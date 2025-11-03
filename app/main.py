from flask import Flask, request, jsonify
from flask_cors import CORS
import os, datetime
import cv2
import numpy as np
import face_recognition

from app.db.mongo import get_db
from app.models.user import create_user_document
from app.services.face_detection import FaceDetection


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = get_db()
users = db["users"]

# Initialize face detection
face_detector = FaceDetection(model_path="yolov8m_200e.pt", conf_threshold=0.5)


# ============ ROUTES ============

@app.route("/")
def home():
    return jsonify({"message": "Face Detection API is running!"})


# ---- REGISTER NEW USER ----
@app.route("/register", methods=["POST"])
def register_user():
    """
    Register a new user with profile info and face image.
    """
    name = request.form.get("name")
    student_id = request.form.get("student_id")
    user_class = request.form.get("class")
    department = request.form.get("department")
    room = request.form.get("room")
    image = request.files.get("image")

    if not all([name, student_id, image]):
        return jsonify({"error": "Missing required fields"}), 400

    # Save image
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{student_id}_{timestamp}.jpg"
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(image_path)

    # Read image and generate face encoding
    face_encoding = None
    try:
        img = cv2.imread(image_path)
        if img is not None:
            # Detect faces first to ensure there's a face in the image
            detections = face_detector.detect_faces(img)
            if len(detections) > 0:
                # Generate face encoding
                face_encoding = face_detector.get_face_encoding(img)
                if face_encoding is None:
                    return jsonify({"error": "Could not generate face encoding. Please ensure image contains a clear face."}), 400
            else:
                return jsonify({"error": "No face detected in the image. Please upload an image with a clear face."}), 400
        else:
            return jsonify({"error": "Could not read uploaded image"}), 400
    except Exception as e:
        return jsonify({"error": f"Error processing face: {str(e)}"}), 400

    data = {
        "name": name,
        "student_id": student_id,
        "class": user_class,
        "department": department,
        "room": room,
        "registered_at": datetime.datetime.now().isoformat(),
        "updated_at": datetime.datetime.now().isoformat(),
    }

    # Save to MongoDB with face encoding
    user_doc = create_user_document(data, image_path, face_encoding)
    users.insert_one(user_doc)

    # Exclude MongoDB ObjectId from response
    response_doc = dict(user_doc)
    response_doc.pop("_id", None)
    # Remove face_encoding from response for security
    response_doc.pop("face_encoding", None)

    return jsonify({"message": "User registered successfully", "data": response_doc}), 201


# ---- GET ALL USERS ----
@app.route("/users", methods=["GET"])
def get_all_users():
    all_users = list(users.find({}, {"_id": 0}))
    return jsonify(all_users)   


# ---- GET ONE USER ----
@app.route("/users/student/<student_id>", methods=["GET"])
def get_user_by_student_id(student_id):
    user = users.find_one({"student_id": student_id}, {"_id": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user)

@app.route("/users/uuid/<uuid>", methods=["GET"])
def get_user_by_uuid(uuid):
    user = users.find_one({"uuid": uuid}, {"_id": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user)


# ---- FACE RECOGNITION / DETECTION ----
@app.route("/recognize", methods=["POST"])
def recognize_face():
    """
    Recognize a face from uploaded image and return user info if found.
    """
    image = request.files.get("image")
    
    if not image:
        return jsonify({"error": "No image provided"}), 400
    
    # Save uploaded image temporarily
    temp_filename = f"temp_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
    temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
    image.save(temp_path)
    
    try:
        # Read and process image
        img = cv2.imread(temp_path)
        if img is None:
            return jsonify({"error": "Could not read uploaded image"}), 400
        
        # Detect faces
        detections = face_detector.detect_faces(img)
        if len(detections) == 0:
            return jsonify({"error": "No face detected in the image", "detected": False}), 400
        
        # Generate face encoding from uploaded image
        face_encoding = face_detector.get_face_encoding(img)
        if face_encoding is None:
            return jsonify({"error": "Could not generate face encoding", "detected": False}), 400
        
        # Convert to numpy array
        face_encoding = np.array(face_encoding)
        
        # Get all users from database
        all_users = list(users.find({}))
        
        # Find matching user with stricter threshold (confidence > 0.7 = distance < 0.3)
        best_match = None
        best_distance = float('inf')
        
        for user in all_users:
            if "face_encoding" in user:
                user_encoding = np.array(user["face_encoding"])
                distance = face_recognition.face_distance([face_encoding], user_encoding)[0]
                
                if distance < best_distance:
                    best_match = user
                    best_distance = distance
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # Check if confidence is high enough (confidence > 0.7 = distance < 0.3)
        confidence = 1 - best_distance
        if best_match and confidence > 0.7:
            # Format response without MongoDB ObjectId and face_encoding
            response = {
                "recognized": True,
                "confidence": round(confidence, 4),
                "user": {
                    "uuid": best_match.get("uuid"),
                    "name": best_match.get("name"),
                    "student_id": best_match.get("student_id"),
                    "class": best_match.get("class"),
                    "department": best_match.get("department"),
                    "room": best_match.get("room"),
                }
            }
            return jsonify(response), 200
        else:
            return jsonify({
                "recognized": False,
                "message": "Face detected but no matching user found in database (confidence threshold not met)",
                "confidence": round(confidence, 4) if best_match else 0.0
            }), 404
            
    except Exception as e:
        # Clean up temp file in case of error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": f"Error processing face: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


