import cv2  # Import OpenCV library for image and video processing
import matplotlib.pyplot as plt  # Import Matplotlib for displaying images

# Load the pre-trained face detection model (Haar Cascade)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Open the default camera (webcam) for video capture
cap = cv2.VideoCapture(0)

while True:  # Loop to process video frames continuously
    ret, frame = cap.read()  # Read a frame from the webcam
    if not ret:  # If the frame is not captured properly, exit the loop
        break

    # Convert the frame to grayscale (Haar Cascade works better on grayscale images)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces in the grayscale frame
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))

    # Loop through all detected faces and draw a rectangle around each face
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 3)  # Green rectangle

    # Convert the frame from BGR (OpenCV format) to RGB (Matplotlib format) and display it
    plt.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    plt.axis('off')  # Hide axes for better display
    plt.show(block=False)  # Show the image without blocking the execution
    plt.pause(0.01)  # Pause for a short time to update the image
    plt.clf()  # Clear the previous frame to display the next one

    # If the 'q' key is pressed, exit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam resource
cap.release()

# Close all OpenCV windows
cv2.destroyAllWindows()
