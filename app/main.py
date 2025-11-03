from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import datetime
import cv2
import numpy as np
import uuid
from typing import Optional, Dict, Any
import base64

from app.db.mongo import get_db
from app.services.face_detection import FaceDetection
from app.models.user import create_user_document

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = get_db()
users_col = db["users"]

face_detector = FaceDetection(model_name="buffalo_l", det_size=(640, 640), conf_threshold=0.5)

# ----------------- Helper functions -----------------
def normalize_embedding(arr: np.ndarray) -> np.ndarray:
    """L2 normalize an embedding vector"""
    if arr is None:
        return None
    arr = np.asarray(arr, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm == 0:
        return arr
    return arr / norm

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = normalize_embedding(a)
    b = normalize_embedding(b)
    if a is None or b is None:
        return 0.0
    return float(np.dot(a, b))

def user_to_response(doc: Dict) -> Dict:
    """Chuyển user doc thành object trả về cho client (không lộ embedding)"""
    profile = doc.get("profile", {})
    # Backwards compatibility: support older schema where fields were top-level
    if not profile and "name" in doc:
        profile = {
            "name": doc.get("name"),
            "student_id": doc.get("student_id"),
            "department": doc.get("department"),
            "class": doc.get("class"),
            "room": doc.get("room"),
        }

    # Ensure timestamps exist (for backward compatibility with old records)
    registered_at = doc.get("registered_at")
    updated_at = doc.get("updated_at")

    # If timestamps are missing, try to get from face's added_at or use current time
    if not registered_at:
        faces = doc.get("faces", [])
        if faces and faces[0].get("added_at"):
            registered_at = faces[0]["added_at"]
        else:
            registered_at = datetime.datetime.now().isoformat()

    if not updated_at:
        updated_at = registered_at

    return {
        "user_id": doc.get("user_id") or doc.get("uuid"),
        "profile": profile,
        "registered_at": registered_at,
        "updated_at": updated_at,
        "embedding_version": doc.get("embedding_version")
    }

# ----------------- Routes -----------------

@app.route("/")
def home():
    return jsonify({"message": "Face Detection API (InsightFace) is running!"})


@app.route("/register", methods=["POST"])
def register_user():
    """
    Register a new user with profile info and face image.
    Expects multipart/form-data:
      - name, student_id, class, department, room
      - image (file)
    """
    name = request.form.get("name", "").strip()
    student_id = request.form.get("student_id", "").strip()
    user_class = request.form.get("class", "").strip()
    department = request.form.get("department", "").strip()
    room = request.form.get("room", "").strip()
    # Accept either multiple files 'images', single file 'image', or base64
    images_files = request.files.getlist("images")
    image_file = request.files.get("image")
    image_base64 = request.form.get("image_base64")

    # Validate required fields - check for None, empty string, or missing file
    if not name:
        return jsonify({"error": "Missing required field: name"}), 400
    if not student_id:
        return jsonify({"error": "Missing required field: student_id"}), 400
    if (not images_files and (not image_file or image_file.filename == '')) and not image_base64:
        return jsonify({"error": "Missing required field: image file"}), 400

    # Save uploaded images (supports multiple files or base64)
    saved_paths = []
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    if images_files:
        for idx, f in enumerate(images_files):
            if not f or f.filename == '':
                continue
            filename = f"{student_id}_{timestamp}_{idx+1}.jpg"
            path = os.path.join(UPLOAD_FOLDER, filename)
            f.save(path)
            saved_paths.append(path)
    elif image_file and image_file.filename != '':
        filename = f"{student_id}_{timestamp}.jpg"
        path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(path)
        saved_paths.append(path)
    else:
        try:
            b64 = image_base64 or ""
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            img_bytes = base64.b64decode(b64)
            filename = f"{student_id}_{timestamp}.jpg"
            path = os.path.join(UPLOAD_FOLDER, filename)
            with open(path, 'wb') as f:
                f.write(img_bytes)
            saved_paths.append(path)
        except Exception as e:
            return jsonify({"error": f"Invalid image_base64 data: {str(e)}"}), 400

    # Read images and detect faces; keep all valid faces
    detected_faces = []
    valid_paths = []
    for path in saved_paths:
        img = cv2.imread(path)
        if img is None:
            continue
        face = face_detector.get_best_face(img)
        if face:
            detected_faces.append({"face": face, "image_path": path})
            valid_paths.append(path)

    if not detected_faces:
        # cleanup saved files
        for path in saved_paths:
            try:
                os.remove(path)
            except Exception:
                pass
        return jsonify({"error": "No face detected in the provided images. Please upload clear face images."}), 400

    # Build doc and insert
    now_iso = datetime.datetime.now().isoformat()
    data = {
        "name": name,
        "student_id": student_id,
        "class": user_class,
        "department": department,
        "room": room,
        "image_path": detected_faces[0]["image_path"],
        "registered_at": now_iso,
        "updated_at": now_iso
    }

    # Start with first detected face
    user_doc = create_user_document(data, detected_faces[0]["face"], embedding_version="insightface-buffalo_l-v1")
    # Append additional faces
    for item in detected_faces[1:]:
        user_doc["faces"].append({
            "image_path": item["image_path"],
            "embedding": item["face"].get("embedding"),
            "confidence": item["face"].get("conf"),
            "landmarks": item["face"].get("landmarks"),
            "added_at": now_iso,
        })
    users_col.insert_one(user_doc)

    # Return sanitized response
    resp = user_to_response(user_doc)
    return jsonify({"message": "User registered successfully", "data": resp}), 201


@app.route("/users", methods=["GET"])
def get_all_users():
    all_users = list(users_col.find({}, {"_id": 0, "faces.embedding": 0}))  # hide embeddings in list endpoint
    # Transform for backward compat
    resp = [user_to_response(u) for u in all_users]
    return jsonify(resp), 200


@app.route("/users/student/<student_id>", methods=["GET"])
def get_user_by_student_id(student_id):
    user = users_col.find_one({"profile.student_id": student_id}, {"_id": 0, "faces.embedding": 0})
    if not user:
        # try legacy
        user = users_col.find_one({"student_id": student_id}, {"_id": 0, "faces.embedding": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404
    return jsonify(user_to_response(user)), 200


@app.route("/users/userid/<user_id>", methods=["GET"])
def get_user_by_userid(user_id):
    user = users_col.find_one({"user_id": user_id}, {"_id": 0, "faces.embedding": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user_to_response(user)), 200


@app.route("/users/userid/<user_id>", methods=["DELETE"])
def delete_user_by_userid(user_id):
    """
    Delete a user by their user_id.
    Also deletes associated face images from the uploads folder.
    """
    try:
        # First, find the user to get their image paths
        user = users_col.find_one({"user_id": user_id})

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Collect all image paths to delete
        image_paths = []
        faces = user.get("faces", [])
        for face in faces:
            image_path = face.get("image_path")
            if image_path:
                image_paths.append(image_path)

        # Delete the user document from MongoDB
        result = users_col.delete_one({"user_id": user_id})

        if result.deleted_count == 0:
            return jsonify({"error": "Failed to delete user"}), 500

        # Delete associated image files
        deleted_images = 0
        failed_images = []
        for image_path in image_paths:
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
                    deleted_images += 1
            except Exception as e:
                failed_images.append({"path": image_path, "error": str(e)})

        response = {
            "message": "User deleted successfully",
            "user_id": user_id,
            "deleted_images": deleted_images,
            "total_images": len(image_paths)
        }

        if failed_images:
            response["failed_images"] = failed_images

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": f"Error deleting user: {str(e)}"}), 500


@app.route("/ping", methods=["GET"])
def ping():
    """Health check endpoint for the API"""
    return jsonify({"status": "ok", "message": "Server is running"}), 200


@app.route("/migrate-timestamps", methods=["POST"])
def migrate_timestamps():
    """
    Migration endpoint to fix existing records with null timestamps.
    This should be run once to update old records.
    """
    try:
        updated_count = 0
        users = list(users_col.find({}))

        for user in users:
            needs_update = False
            update_fields = {}

            # Check if registered_at or updated_at is missing
            if not user.get("registered_at"):
                needs_update = True
                # Try to get from first face's added_at
                faces = user.get("faces", [])
                if faces and faces[0].get("added_at"):
                    update_fields["registered_at"] = faces[0]["added_at"]
                else:
                    # Use current time as fallback
                    update_fields["registered_at"] = datetime.datetime.now().isoformat()

            if not user.get("updated_at"):
                needs_update = True
                # Use registered_at if available, otherwise current time
                update_fields["updated_at"] = user.get("registered_at") or update_fields.get("registered_at") or datetime.datetime.now().isoformat()

            # Update the record if needed
            if needs_update:
                users_col.update_one(
                    {"_id": user["_id"]},
                    {"$set": update_fields}
                )
                updated_count += 1

        return jsonify({
            "message": f"Migration completed. Updated {updated_count} records.",
            "updated_count": updated_count
        }), 200

    except Exception as e:
        return jsonify({"error": f"Migration failed: {str(e)}"}), 500


@app.route("/recognize", methods=["POST"])
def recognize_face():
    """
    Recognize a face from uploaded image and return user info if matched.
    Expects multipart/form-data with 'image' file and optional 'room' to limit search.
    """
    image_file = request.files.get("image")
    image_base64 = request.form.get("image_base64")
    room = request.form.get("room")  # optional: restrict to users assigned to this room

    if not image_file and not image_base64:
        return jsonify({"error": "No image provided"}), 400

    # save temp image
    temp_filename = f"temp_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
    temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
    if image_file:
        image_file.save(temp_path)
    else:
        try:
            b64 = image_base64 or ""
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            img_bytes = base64.b64decode(b64)
            with open(temp_path, 'wb') as f:
                f.write(img_bytes)
        except Exception as e:
            return jsonify({"error": f"Invalid image_base64 data: {str(e)}"}), 400

    try:
        img = cv2.imread(temp_path)
        if img is None:
            return jsonify({"error": "Could not read uploaded image"}), 400

        best_face = face_detector.get_best_face(img)
        if not best_face:
            return jsonify({"error": "No face detected in the image", "detected": False}), 400

        probe_emb = np.array(best_face.get("embedding"), dtype=np.float32)
        probe_emb = normalize_embedding(probe_emb)

        # Query candidate users
        query = {}
        if room:
            query["profile.room"] = room

        # Project only embeddings to compare (and minimal metadata)
        candidates = list(users_col.find(query, {
            "_id": 0,
            "user_id": 1,
            "profile": 1,
            "faces.embedding": 1,
            "faces.confidence": 1,
            "registered_at": 1,
            "updated_at": 1,
            "embedding_version": 1
        }))

        best_match = None
        best_sim = -1.0

        for cand in candidates:
            faces = cand.get("faces", [])
            for f in faces:
                emb = f.get("embedding")
                if emb is None:
                    continue
                emb_arr = np.array(emb, dtype=np.float32)
                sim = cosine_similarity(probe_emb, emb_arr)
                if sim > best_sim:
                    best_sim = sim
                    best_match = {
                        "user": cand,
                        "face_meta": f
                    }

        # Clean up temp file
        try:
            os.remove(temp_path)
        except Exception:
            pass

        # Decide threshold: similarity ~0.35-0.4 (dot product of normalized vectors) is okay but tune on your data.
        THRESHOLD = 0.70  # we use 0..1 (higher = more similar); InsightFace normalized dot is in [-1,1], but for real embeddings it's typically 0..1.
                           # choose a conservative threshold like 0.7 for fewer false positives. Tune it.

        if best_match and best_sim >= THRESHOLD:
            matched_user = best_match["user"]
            response = {
                "recognized": True,
                "confidence": round(best_sim, 4),
                "user": user_to_response(matched_user)
            }
            return jsonify(response), 200
        else:
            return jsonify({
                "recognized": False,
                "message": "Face detected but no matching user found (threshold not met).",
                "confidence": round(best_sim, 4) if best_match else 0.0
            }), 404

    except Exception as e:
        try:
            os.remove(temp_path)
        except Exception:
            pass
        return jsonify({"error": f"Error processing face: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
