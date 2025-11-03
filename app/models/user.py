import uuid
from typing import Dict, Any

def create_user_document(data: Dict[str, Any], face: Dict[str, Any], embedding_version: str = "insightface-buffalo_l-v1") -> Dict:
    """
    Tạo document consistent để lưu MongoDB.
    face: dict returned from FaceDetection.get_best_face()
    """
    return {
        "user_id": str(uuid.uuid4()),
        "profile": {
            "name": data.get("name"),
            "student_id": data.get("student_id"),
            "department": data.get("department"),
            "class": data.get("class"),
            "room": data.get("room"),
        },
        "faces": [
            {
                "image_path": data.get("image_path"),
                "embedding": face.get("embedding"),       # list
                "confidence": face.get("conf"),
                "landmarks": face.get("landmarks"),
                "added_at": data.get("registered_at"),
            }
        ],
        "embedding_version": embedding_version,
        "registered_at": data.get("registered_at"),
        "updated_at": data.get("updated_at"),
    }
