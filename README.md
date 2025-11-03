# Face Detection & Recognition API

A Flask-based face detection and recognition system using InsightFace library for high-accuracy face recognition.

## Features

- **Face Detection**: Detect faces in images using InsightFace models
- **Face Recognition**: Recognize faces with 512-dimensional embeddings
- **User Registration**: Register new users with single or multiple face images
- **MongoDB Integration**: Store user profiles and face embeddings
- **RESTful API**: Clean REST API endpoints with CORS support
- **Multiple Image Support**: Register users with multiple face images
- **Base64 Image Support**: Upload images via base64 encoding or file upload
- **Room-based Search**: Filter recognition by room assignment

## Tech Stack

- **Flask**: Web framework
- **InsightFace**: Face detection and recognition (buffalo_l model)
- **OpenCV**: Image processing
- **MongoDB**: Database for user profiles and embeddings
- **Gunicorn**: Production server
- **Flask-CORS**: Cross-Origin Resource Sharing support

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

3. InsightFace will automatically download the required model files on first run.

## Running the Application

### Development Mode
```bash
python -m app.main
```
The API will be available at `http://localhost:8000`

### Production Mode with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
# or
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

## API Endpoints

### 1. Home
**GET** `/`
```json
{
  "message": "Face Detection API (InsightFace) is running!"
}
```

### 2. Health Check
**GET** `/ping`
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 3. Register New User
**POST** `/register`

Form data:
- `name` (required): User's name
- `student_id` (required): Student ID
- `image` (optional): Single face image file
- `images` (optional): Multiple face image files
- `image_base64` (optional): Base64 encoded image
- `class` (optional): Class name
- `department` (optional): Department name
- `room` (optional): Room number

**Note**: At least one image must be provided (via `image`, `images`, or `image_base64`)

Response:
```json
{
  "message": "User registered successfully",
  "data": {
    "user_id": "4fcd97cf-9a13-44f5-b91c-2f3bb2824ed7",
    "profile": {
      "name": "Phan Van Tai",
      "student_id": "2202084",
      "class": "CS301",
      "department": "Computer Science",
      "room": "212"
    },
    "registered_at": "2023-11-03T14:54:30",
    "updated_at": "2023-11-03T14:54:30",
    "embedding_version": "insightface-buffalo_l-v1"
  }
}
```

### 4. Face Recognition
**POST** `/recognize`

Form data:
- `image` (optional): Face image file to recognize
- `image_base64` (optional): Base64 encoded image
- `room` (optional): Limit search to users in specific room

Response (when recognized):
```json
{
  "recognized": true,
  "confidence": 0.8542,
  "user": {
    "user_id": "4fcd97cf-9a13-44f5-b91c-2f3bb2824ed7",
    "profile": {
      "name": "Phan Van Tai",
      "student_id": "2202084",
      "class": "CS301",
      "department": "Computer Science",
      "room": "212"
    },
    "registered_at": "2023-11-03T14:54:30",
    "updated_at": "2023-11-03T14:54:30",
    "embedding_version": "insightface-buffalo_l-v1"
  }
}
```

Response (when not recognized):
```json
{
  "recognized": false,
  "message": "Face detected but no matching user found (threshold not met).",
  "confidence": 0.4133
}
```

**Note**: Confidence threshold is set to 0.70 (70%). Only matches with confidence >= 0.70 are considered valid.

### 5. Get All Users
**GET** `/users`

Returns list of all registered users (embeddings excluded).

### 6. Get User by Student ID
**GET** `/users/student/<student_id>`

Returns user information by student ID.

### 7. Get User by User ID
**GET** `/users/userid/<user_id>`

Returns user information by user ID.

### 8. Delete User by User ID
**DELETE** `/users/userid/<user_id>`

Deletes user and associated face images from storage.

Response:
```json
{
  "message": "User deleted successfully",
  "user_id": "4fcd97cf-9a13-44f5-b91c-2f3bb2824ed7",
  "deleted_images": 2,
  "total_images": 2
}
```

### 9. Migrate Timestamps (Admin)
**POST** `/migrate-timestamps`

Migration endpoint to fix existing records with null timestamps. Run once after upgrading from older versions.

## Testing

Test manually with curl:

```bash
# Register a user with single image
curl -X POST http://localhost:8000/register \
  -F "name=Phan Van Tai" \
  -F "student_id=2202084" \
  -F "class=CS301" \
  -F "department=Computer Science" \
  -F "room=212" \
  -F "image=@images/image.png"

# Register a user with multiple images
curl -X POST http://localhost:8000/register \
  -F "name=Phan Van Tai" \
  -F "student_id=2202084" \
  -F "class=CS301" \
  -F "images=@images/image1.png" \
  -F "images=@images/image2.png"

# Recognize a face
curl -X POST http://localhost:8000/recognize \
  -F "image=@images/image.png"

# Recognize a face in specific room
curl -X POST http://localhost:8000/recognize \
  -F "image=@images/image.png" \
  -F "room=212"

# Get all users
curl http://localhost:8000/users

# Get user by student ID
curl http://localhost:8000/users/student/2202084

# Delete user
curl -X DELETE http://localhost:8000/users/userid/4fcd97cf-9a13-44f5-b91c-2f3bb2824ed7
```

## Face Recognition Technology

### InsightFace Model
The system uses **InsightFace** with the **buffalo_l** model pack for face detection and recognition:

- **Model**: buffalo_l (larger, more accurate)
- **Detection Size**: 640x640
- **Confidence Threshold**: 0.5 for face detection
- **Embedding Dimension**: 512-dimensional face embeddings
- **Execution**: CPU-only (CPUExecutionProvider)

### Recognition Process
1. **Face Detection**: InsightFace detects faces and extracts facial landmarks
2. **Embedding Generation**: Creates 512-dimensional normalized embeddings
3. **Similarity Matching**: Uses cosine similarity to compare embeddings
4. **Threshold Filtering**: Only matches with similarity >= 0.70 are accepted

### Confidence Threshold
The system uses a **confidence threshold of 0.70 (70%)** for face recognition:
- **Confidence >= 0.70**: Face is recognized, user information is returned
- **Confidence < 0.70**: Face detected but not recognized (threshold not met)

This threshold can be adjusted in `app/main.py:412`:
```python
THRESHOLD = 0.70  # Change to your desired threshold (0.0 to 1.0)
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
├── frontend/                # Frontend web application
├── uploads/                 # Uploaded user images
├── images/                  # Test images
├── requirements.txt         # Python dependencies
├── README.md                # This file
├── API_DOCUMENTATION.md     # Detailed API documentation
├── .gitignore
└── pyproject.toml
```

## Database Schema

### Users Collection
```json
{
  "user_id": "uuid-string",
  "profile": {
    "name": "string",
    "student_id": "string",
    "class": "string",
    "department": "string",
    "room": "string"
  },
  "faces": [
    {
      "image_path": "uploads/2202084_20231103145430.jpg",
      "embedding": [512-dimensional array],
      "confidence": 0.95,
      "landmarks": [[x, y], ...],
      "added_at": "ISO-8601 timestamp"
    }
  ],
  "embedding_version": "insightface-buffalo_l-v1",
  "registered_at": "ISO-8601 timestamp",
  "updated_at": "ISO-8601 timestamp"
}
```

## Key Features

### Multiple Face Registration
Users can be registered with multiple face images to improve recognition accuracy:
- Upload multiple images at once using the `images` parameter
- Each face is detected and stored with its own embedding
- Recognition compares against all registered faces for a user

### Base64 Image Support
Images can be uploaded as base64-encoded strings:
```bash
curl -X POST http://localhost:8000/register \
  -F "name=John Doe" \
  -F "student_id=ST001" \
  -F "image_base64=data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

### Room-based Filtering
Speed up recognition by limiting search to users in a specific room:
```bash
curl -X POST http://localhost:8000/recognize \
  -F "image=@face.jpg" \
  -F "room=212"
```

## Performance Notes

- The system requires clear, front-facing face images for best results
- Face embeddings are 512-dimensional arrays stored in MongoDB
- Images are saved in the `uploads/` directory with timestamps
- Embeddings are normalized using L2 normalization for consistent comparison
- CPU-based inference - consider GPU for faster processing in production

## Migration from Legacy System

If upgrading from an older version using YOLOv8/face_recognition:
1. The embedding format and dimension have changed (128D → 512D)
2. Use the `/migrate-timestamps` endpoint to fix timestamp issues
3. Old user records may need re-registration for best results
4. User ID field changed from `uuid` to `user_id`

## License

MIT License
