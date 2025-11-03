import cv2
import numpy as np
from ultralytics import YOLO
from typing import List, Tuple, Dict
import face_recognition


class FaceDetection:
    """
    FaceDetection class sử dụng YOLOv8s-face để phát hiện khuôn mặt.
    Hỗ trợ CPU-only, có thể dùng trong backend FastAPI / Flask.
    """

    def __init__(self, model_path: str = "yolov8m_200e.pt", conf_threshold: float = 0.5):
        """
        Khởi tạo model YOLOv8-face.
        :param model_path: đường dẫn đến file YOLOv8-face (.pt)
        :param conf_threshold: ngưỡng độ tin cậy khi detect khuôn mặt
        """
        self.model = YOLO(model_path)
        self.model.to("cpu")  # đảm bảo chạy trên CPU
        self.conf_threshold = conf_threshold

    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Phát hiện khuôn mặt trong ảnh.
        :param image: ảnh đầu vào dạng numpy (BGR - từ OpenCV)
        :return: danh sách các khuôn mặt [{'box': (x1, y1, x2, y2), 'conf': 0.95}, ...]
        """
        results = self.model.predict(image, conf=self.conf_threshold, verbose=False)
        detections = []

        if len(results) == 0 or len(results[0].boxes) == 0:
            return detections

        boxes = results[0].boxes.xyxy.cpu().numpy()
        confs = results[0].boxes.conf.cpu().numpy()

        for box, conf in zip(boxes, confs):
            x1, y1, x2, y2 = map(int, box)
            detections.append({
                "box": (x1, y1, x2, y2),
                "conf": float(conf)
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
        Lấy face encoding từ ảnh sử dụng face_recognition library.
        :param image: ảnh đầu vào dạng numpy BGR (từ OpenCV) hoặc RGB
        :return: 128-dimensional face encoding
        """
        # Chuyển BGR sang RGB cho face_recognition
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Tìm face encodings (có thể có nhiều khuôn mặt)
        encodings = face_recognition.face_encodings(rgb_image)
        
        if len(encodings) > 0:
            return encodings[0]  # Trả về encoding của khuôn mặt đầu tiên
        return None

    def compare_faces(self, encoding1: np.ndarray, encoding2: np.ndarray, tolerance: float = 0.6) -> bool:
        """
        So sánh hai face encodings.
        :param encoding1: face encoding thứ nhất
        :param encoding2: face encoding thứ hai
        :param tolerance: ngưỡng so sánh (thấp hơn = nghiêm ngặt hơn, mặc định 0.6)
        :return: True nếu trùng khớp, False nếu không
        """
        if encoding1 is None or encoding2 is None:
            return False
        distance = face_recognition.face_distance([encoding1], encoding2)[0]
        return distance <= tolerance

    def compare_faces_with_distance(self, encoding1: np.ndarray, encoding2: np.ndarray) -> Tuple[bool, float]:
        """
        So sánh hai face encodings và trả về cả khoảng cách.
        :param encoding1: face encoding thứ nhất
        :param encoding2: face encoding thứ hai
        :return: (is_match, distance)
        """
        if encoding1 is None or encoding2 is None:
            return False, 1.0
        distance = face_recognition.face_distance([encoding1], encoding2)[0]
        is_match = distance <= 0.6
        return is_match, float(distance)


