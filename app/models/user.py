import uuid


def create_user_document(data, image_path, face_encoding=None):
    """
    Create a user document for MongoDB.
    :param face_encoding: numpy array of face encoding, will be converted to list
    """
    doc = {
        "uuid": str(uuid.uuid4()),
        "name": data.get("name"),
        "student_id": data.get("student_id"),
        "class": data.get("class"),
        "department": data.get("department"),
        "room": data.get("room"),
        "image_path": image_path,
        "registered_at": data.get("registered_at"),
        "updated_at": data.get("updated_at"),
    }
    
    # Convert numpy array to list for MongoDB storage
    if face_encoding is not None:
        doc["face_encoding"] = face_encoding.tolist()
    
    return doc


