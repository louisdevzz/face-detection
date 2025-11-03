import cv2
from app.services.face_detection import FaceDetection

# Khởi tạo class
fd = FaceDetection(model_path="yolov8m_200e.pt")

# Đọc ảnh
image = cv2.imread("images/image.png")
image = cv2.resize(image, (640, 640))

# Phát hiện khuôn mặt
detections = fd.detect_faces(image)
print("Số khuôn mặt phát hiện:", len(detections))

# Vẽ bounding box
output = fd.draw_boxes(image, detections)

# Tạo cửa sổ có thể thay đổi kích thước
cv2.namedWindow("Result", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Result", 1280, 720)  # hoặc 1920x1080 nếu bạn muốn to hơn

cv2.imshow("Result", output)
cv2.waitKey(0)
cv2.destroyAllWindows()
