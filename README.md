# Face Detection & Recognition API

A Flask-based face detection and recognition system using YOLOv8 and face_recognition libraries.

## Features

- **Face Detection**: Detect faces in images using YOLOv8-face model
- **Face Recognition**: Recognize faces and identify users from a database
- **User Registration**: Register new users with face images
- **MongoDB Integration**: Store user data and face encodings
- **RESTful API**: Clean REST API endpoints

## Tech Stack

- **Flask**: Web framework
- **YOLOv8**: Face detection model
- **face_recognition**: Face encoding and comparison
- **OpenCV**: Image processing
- **MongoDB**: Database
- **Gunicorn**: Production server

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure MongoDB is running:
```bash
# If using Docker
docker run -d -p 27017:27017 mongo

# Or install locally
# Follow MongoDB installation guide for your OS
```

3. Ensure you have the YOLOv8-face model files:
   - `yolov8m_200e.pt` (main model)
   - `yolov8s-face.pt` (alternative model)

## Running the Application

### Development Mode
```bash
python -m app.main
```

### Production Mode with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
# or
gunicorn -w 4 -b 0.0.0.0:5000 app.main:app
```

The API will be available at `http://localhost:5000`

## API Endpoints

### 1. Home
**GET** `/`
```json
{
  "message": "Face Detection API is running!"
}
```

### 2. Register New User
**POST** `/register`

Form data:
- `name` (required): User's name
- `student_id` (required): Student ID
- `image` (required): Face image file
- `class` (optional): Class name
- `department` (optional): Department name
- `room` (optional): Room number

Response:
```json
{
  "message": "User registered successfully",
  "data": {
    "uuid": "4fcd97cf-9a13-44f5-b91c-2f3bb2824ed7",
    "name": "Phan Van Tai",
    "student_id": "2202084",
    "class": "CS301",
    "department": "Computer Science",
    "room": "212",
    "image_path": "uploads/2202084_20231103145430.jpg",
    "registered_at": "2023-11-03T14:54:30",
    "updated_at": "2023-11-03T14:54:30"
  }
}
```

### 3. Face Recognition
**POST** `/recognize`

Form data:
- `image` (required): Face image file to recognize

Response (when recognized):
```json
{
  "recognized": true,
  "confidence": 0.8542,
  "user": {
    "uuid": "4fcd97cf-9a13-44f5-b91c-2f3bb2824ed7",
    "name": "Phan Van Tai",
    "student_id": "2202084",
    "class": "CS301",
    "department": "Computer Science",
    "room": "212"
  }
}
```

Response (when not recognized):
```json
{
  "recognized": false,
  "message": "Face detected but no matching user found in database (confidence threshold not met)",
  "confidence": 0.4133
}
```

**Note**: Confidence threshold is set to 0.7 (70%). Only matches with confidence > 0.7 are considered valid.

### 4. Get All Users
**GET** `/users`

Returns list of all registered users.

### 5. Get User by Student ID
**GET** `/users/student/<student_id>`

Returns user information by student ID.

### 6. Get User by UUID
**GET** `/users/uuid/<uuid>`

Returns user information by UUID.

## Testing

Use the provided test script:

```bash
python test_recognize.py
```

Or test manually with curl:

```bash
# Register a user
curl -X POST http://localhost:5000/register \
  -F "name=Phan Van Tai" \
  -F "student_id=2202084" \
  -F "class=CS301" \
  -F "department=Computer Science" \
  -F "room=212" \
  -F "image=@images/image.png"

# Recognize a face
curl -X POST http://localhost:5000/recognize \
  -F "image=@images/image.png"
```

## Face Recognition Threshold

The system uses a **confidence threshold of 0.7 (70%)** for face recognition:
- **Confidence > 0.7**: Face is recognized, user information is returned
- **Confidence ≤ 0.7**: Face detected but not recognized (confidence threshold not met)

This threshold can be adjusted in `app/main.py`:
```python
if best_match and confidence > 0.7:  # Change 0.7 to your desired threshold
```

## Directory Structure

```
face-detection/
├── app/
│   ├── __init__.py          # Re-exports app for gunicorn (app:app)
│   ├── main.py              # Main Flask application & routes
│   ├── db/
│   │   ├── __init__.py
│   │   └── mongo.py         # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # MongoDB document models
│   └── services/
│       ├── __init__.py
│       └── face_detection.py# Face detection and recognition logic
├── test.py                  # Basic face detection test
├── test_recognize.py        # Face recognition API test
├── requirements.txt         # Python dependencies
├── README.md                # This file
├── uploads/                 # Uploaded user images
├── images/                  # Test images
├── yolov8m_200e.pt          # YOLOv8-face weight
└── yolov8s-face.pt          # Alternative model weight
```

## Notes

- The system requires clear, front-facing face images for best results
- Face encodings are stored as 128-dimensional arrays in MongoDB
- Images are saved in the `uploads/` directory
- The YOLOv8-face model is used for detection, face_recognition library for encoding

## License

MIT License

