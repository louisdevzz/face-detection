import cv2
import numpy as np
from insightface.app import FaceAnalysis
from typing import List, Tuple, Dict, Optional


class FaceDetection:
    """
    FaceDetection class sử dụng InsightFace để phát hiện và nhận diện khuôn mặt.
    Hỗ trợ CPU-only, có thể dùng trong backend FastAPI / Flask.
    """

    def __init__(
        self,
        model_name: str = "buffalo_l",
        det_size: Tuple[int, int] = (640, 640),
        conf_threshold: float = 0.5,
        det_name: Optional[str] = None,
    ):
        """
        Khởi tạo model InsightFace.
        :param model_name: tên model feature/detection pack (vd: "buffalo_l")
        :param det_size: kích thước khung hình cho detector
        :param conf_threshold: ngưỡng độ tin cậy khi detect khuôn mặt
        :param det_name: tham số cũ để tương thích ngược (nếu truyền sẽ override model_name)
        """
        effective_model = det_name if det_name else model_name
        self.app = FaceAnalysis(name=effective_model, providers=['CPUExecutionProvider'])
        self.app.prepare(ctx_id=-1, det_size=det_size)
        self.conf_threshold = conf_threshold

    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Phát hiện khuôn mặt trong ảnh.
        :param image: ảnh đầu vào dạng numpy (BGR - từ OpenCV)
        :return: danh sách các khuôn mặt [{'box': (x1, y1, x2, y2), 'conf': 0.95, 'embedding': [...], 'landmarks': [...]}]
        """
        faces = self.app.get(image)
        detections = []

        for face in faces:
            if face.det_score >= self.conf_threshold:
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = bbox
                detections.append({
                    "box": (x1, y1, x2, y2),
                    "conf": float(face.det_score),
                    "embedding": face.embedding,
                    "landmarks": face.kps.astype(int).tolist() if hasattr(face, 'kps') else None
                })

        return detections

    def draw_boxes(self, image: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Vẽ bounding box quanh khuôn mặt.
        :param image: ảnh gốc
        :param detections: danh sách khuôn mặt từ detect_faces()
        :return: ảnh đã vẽ khung
        """
        output = image.copy()
        for det in detections:
            x1, y1, x2, y2 = det["box"]
            conf = det["conf"]
            cv2.rectangle(output, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(output, f"{conf:.2f}", (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return output

    def crop_faces(self, image: np.ndarray, detections: List[Dict]) -> List[np.ndarray]:
        """
        Cắt các khuôn mặt được phát hiện.
        :param image: ảnh gốc
        :param detections: danh sách khuôn mặt từ detect_faces()
        :return: danh sách ảnh khuôn mặt đã cắt
        """
        faces = []
        for det in detections:
            x1, y1, x2, y2 = det["box"]
            face = image[y1:y2, x1:x2]
            if face.size > 0:
                faces.append(face)
        return faces

    def get_face_encoding(self, image: np.ndarray) -> np.ndarray:
        """
        Lấy face encoding từ ảnh sử dụng InsightFace.
        :param image: ảnh đầu vào dạng numpy BGR (từ OpenCV)
        :return: 512-dimensional face embedding (InsightFace)
        """
        faces = self.app.get(image)

        if len(faces) > 0:
            return faces[0].embedding  # Trả về embedding của khuôn mặt đầu tiên
        return None

    def compare_faces(self, encoding1: np.ndarray, encoding2: np.ndarray, tolerance: float = 0.4) -> bool:
        """
        So sánh hai face encodings sử dụng cosine similarity.
        :param encoding1: face encoding thứ nhất
        :param encoding2: face encoding thứ hai
        :param tolerance: ngưỡng so sánh (cao hơn = giống nhau hơn, mặc định 0.4 cho cosine similarity)
        :return: True nếu trùng khớp, False nếu không
        """
        if encoding1 is None or encoding2 is None:
            return False

        # Tính cosine similarity
        similarity = np.dot(encoding1, encoding2) / (np.linalg.norm(encoding1) * np.linalg.norm(encoding2))
        return similarity >= tolerance

    def compare_faces_with_distance(self, encoding1: np.ndarray, encoding2: np.ndarray) -> Tuple[bool, float]:
        """
        So sánh hai face encodings và trả về cả độ tương đồng (similarity).
        :param encoding1: face encoding thứ nhất
        :param encoding2: face encoding thứ hai
        :return: (is_match, similarity) - similarity càng cao càng giống (0-1)
        """
        if encoding1 is None or encoding2 is None:
            return False, 0.0

        # Tính cosine similarity
        similarity = np.dot(encoding1, encoding2) / (np.linalg.norm(encoding1) * np.linalg.norm(encoding2))
        is_match = similarity >= 0.4
        return is_match, float(similarity)
    
    def get_best_face(self, image: np.ndarray) -> Optional[Dict]:
        """
        Lấy khuôn mặt có độ tin cậy cao nhất, bao gồm embedding (list) sẵn sàng lưu DB.
        """
        faces = self.app.get(image)
        if not faces:
            return None

        best = max(faces, key=lambda f: f.det_score)

        return {
            "box": best.bbox.astype(int).tolist(),
            "conf": float(best.det_score),
            "embedding": best.embedding.tolist(),
            "landmarks": best.kps.astype(int).tolist()
        }


