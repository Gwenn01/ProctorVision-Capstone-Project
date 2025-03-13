import cv2
import torch
from ultralytics import YOLO

# Load the YOLOv8 model (Pre-trained on COCO dataset, detects common objects)
model = YOLO("yolov8n.pt")  # You can use 'yolov8s.pt' for more accuracy

# List of device categories to detect
target_classes = {
    "cell phone": "Phone",
    "laptop": "Laptop",
    "tv": "Monitor/TV",
    "remote": "Remote",
    "mouse": "Mouse",
    "keyboard": "⌨Keyboard",
    "watch": "Smartwatch",
    "tablet": "Tablet"
}

# Open the webcam
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Perform inference
    results = model(frame)

    detected_devices = []

    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])  # Get class ID
            confidence = box.conf[0].item()  # Get confidence score
            label = model.names[class_id]  # Get class label

            if label in target_classes and confidence > 0.5:  # Filter devices with high confidence
                detected_devices.append(target_classes[label])

                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Draw a bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

                # Display the label
                cv2.putText(frame, f"{target_classes[label]} ({confidence:.2f})", 
                            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # Display detected device types
    if detected_devices:
        device_text = f"Detected: {', '.join(set(detected_devices))}"
    else:
        device_text = "No Device Detected"

    cv2.putText(frame, device_text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Display the frame
    cv2.imshow("Device Detection (Phone, Smartwatch, Tablet, etc.)", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
