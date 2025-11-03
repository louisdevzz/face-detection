# Face Recognition API Documentation

## Overview
This API provides face detection and recognition functionality using YOLOv8 for face detection and face_recognition library for face matching.

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Make sure MongoDB is running
# Default: mongodb://localhost:27017/
```

## Endpoints

### 1. Home
- **URL:** `/`
- **Method:** GET
- **Description:** Check if API is running
- **Response:**
```json
{
  "message": "Face Detection API is running!"
}
```

### 2. Register User
- **URL:** `/register`
- **Method:** POST
- **Description:** Register a new user with face image
- **Content-Type:** multipart/form-data
- **Parameters:**
  - `name` (required): User's name
  - `student_id` (required): Student ID
  - `class` (optional): Class name
  - `department` (optional): Department
  - `room` (optional): Room number
  - `image` (required): Face image file (JPG, PNG, etc.)

- **Success Response (201):**
```json
{
  "message": "User registered successfully",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "student_id": "ST001",
    "class": "CS101",
    "department": "Computer Science",
    "room": "101",
    "image_path": "uploads/ST001_20240101120000.jpg",
    "registered_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:00:00"
  }
}
```

- **Error Response (400):**
```json
{
  "error": "Missing required fields"
}
```

or

```json
{
  "error": "No face detected in the image. Please upload an image with a clear face."
}
```

### 3. Get All Users
- **URL:** `/users`
- **Method:** GET
- **Description:** Retrieve all registered users
- **Response (200):**
```json
[
  {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "student_id": "ST001",
    "class": "CS101",
    "department": "Computer Science",
    "room": "101",
    "image_path": "uploads/ST001_20240101120000.jpg",
    "registered_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:00:00"
  }
]
```

### 4. Get User by Student ID
- **URL:** `/users/student/<student_id>`
- **Method:** GET
- **Description:** Retrieve user by student ID
- **Example:** `/users/student/ST001`
- **Success Response (200):**
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "student_id": "ST001",
  "class": "CS101",
  "department": "Computer Science",
  "room": "101",
  "image_path": "uploads/ST001_20240101120000.jpg",
  "registered_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

- **Error Response (404):**
```json
{
  "error": "User not found"
}
```

### 5. Get User by UUID
- **URL:** `/users/uuid/<uuid>`
- **Method:** GET
- **Description:** Retrieve user by UUID
- **Example:** `/users/uuid/123e4567-e89b-12d3-a456-426614174000`
- **Response:** Same as Get User by Student ID

### 6. Recognize Face ⭐
- **URL:** `/recognize`
- **Method:** POST
- **Description:** Recognize a face from uploaded image and return user info if found
- **Content-Type:** multipart/form-data
- **Parameters:**
  - `image` (required): Face image file (JPG, PNG, etc.)

- **Success Response (200):**
```json
{
  "recognized": true,
  "confidence": 0.95,
  "user": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "student_id": "ST001",
    "class": "CS101",
    "department": "Computer Science",
    "room": "101"
  }
}
```

- **Not Found Response (404):**
```json
{
  "recognized": false,
  "message": "Face detected but no matching user found in database (confidence threshold not met)",
  "confidence": 0.41
}
```

- **Error Response (400):**
```json
{
  "error": "No face detected in the image",
  "detected": false
}
```

## Usage Examples

### Using curl

**Register a user:**
```bash
curl -X POST http://localhost:5000/register \
  -F "name=John Doe" \
  -F "student_id=ST001" \
  -F "class=CS101" \
  -F "department=Computer Science" \
  -F "room=101" \
  -F "image=@path/to/image.jpg"
```

**Recognize a face:**
```bash
curl -X POST http://localhost:5000/recognize \
  -F "image=@path/to/image.jpg"
```

### Using Python requests

**Register a user:**
```python
import requests

url = "http://localhost:5000/register"
files = {'image': open('path/to/image.jpg', 'rb')}
data = {
    'name': 'John Doe',
    'student_id': 'ST001',
    'class': 'CS101',
    'department': 'Computer Science',
    'room': '101'
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

**Recognize a face:**
```python
import requests

url = "http://localhost:5000/recognize"
files = {'image': open('path/to/image.jpg', 'rb')}

response = requests.post(url, files=files)
print(response.json())
```

## Running the Server

```bash
python -m app.main
# or
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The server will start on `http://0.0.0.0:5000`.

## Technical Details

### Face Detection
- Uses YOLOv8 face detection model (`yolov8m_200e.pt`)
- Confidence threshold: 0.5
- Runs on CPU

### Face Recognition
- Uses `face_recognition` library (dlib-based)
- Generates 128-dimensional face encodings
- Tolerance: 0.6 for matching
- Confidence score: `1 - distance`

Threshold in `app/main.py`:
```python
if best_match and confidence > 0.7:
    ...
```

### Database
- MongoDB database: `face_recognition`
- Collection: `users`
- Face encodings stored as lists (converted from numpy arrays)

## Notes
- Images should contain clear, frontal faces for best results
- Face encodings are stored in database but not returned in API responses for security
- Temporary files are automatically cleaned up after processing

