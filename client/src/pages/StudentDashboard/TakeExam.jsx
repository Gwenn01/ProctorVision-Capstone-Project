import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  ProgressBar,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";

const TakeExam = () => {
  const exams = [
    { id: 1, title: "Math Exam", duration: 10 },
    { id: 2, title: "Science Test", duration: 15 },
  ];

  const [selectedExam, setSelectedExam] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [lastCapture, setLastCapture] = useState("");
  const [capturedImages, setCapturedImages] = useState([]); // Store captured images
  const [results, setResults] = useState([]); // Store classification results
  const [showResults, setShowResults] = useState(false); // Control results modal visibility

  // Timer Countdown
  useEffect(() => {
    if (isTakingExam && timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [isTakingExam, timer]);

  // Check for suspicious behavior and capture images
  useEffect(() => {
    if (isTakingExam) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(
            "http://127.0.0.1:5000/api/detect_warning"
          );
          console.log("Warning Response:", response.data); // Debugging Log

          if (response.data.warning !== "Looking Forward") {
            setWarningMessage(response.data.warning);
            setShowWarning(true);

            // Capture image for each unique warning
            if (
              response.data.capture &&
              lastCapture !== response.data.warning
            ) {
              setLastCapture(response.data.warning);
              captureFrame(response.data.warning);
            }
          }
        } catch (error) {
          console.error("Error detecting warning:", error);
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isTakingExam, lastCapture]);

  // Select Exam
  const handleExamSelect = (e) => {
    const exam = exams.find((exam) => exam.id === parseInt(e.target.value));
    setSelectedExam(exam);
  };

  // Start Exam
  const handleStartExam = () => {
    if (!selectedExam) {
      alert("Please select an exam first!");
      return;
    }
    setIsTakingExam(true);
    setTimer(selectedExam.duration * 60);
    setCapturedImages([]); // Clear previous exam images
    setResults([]); // Clear previous exam results
    setShowResults(false); // Hide results modal
  };

  const handleSubmitExam = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/api/stop_camera");
      alert("Exam Submitted! Checking behavior...");
      await checkBehavior(); // ✅ Process images
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
    setIsTakingExam(false);
  };

  // Capture Frame & Store Image Locally
  const captureFrame = async (warningLabel) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/video_feed");
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Store captured image along with the label
      setCapturedImages((prevImages) => [
        ...prevImages,
        { image: imageUrl, label: warningLabel },
      ]);
    } catch (error) {
      console.error("Error capturing frame:", error);
    }
  };

  // Send all captured images for classification after the exam
  const checkBehavior = async () => {
    try {
      const formData = new FormData();

      for (let i = 0; i < capturedImages.length; i++) {
        const blob = await fetch(capturedImages[i].image).then((res) =>
          res.blob()
        );

        formData.append(
          "files",
          new File([blob], `image_${i}.jpg`, { type: "image/jpeg" })
        );
      }

      // Send the request
      const response = await axios.post(
        "http://127.0.0.1:5000/api/classify_multiple",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } } // ✅ Important!
      );

      // ✅ Store results and show the results modal
      setResults(response.data.results);
      setShowResults(true); // Ensure modal shows up
    } catch (error) {
      console.error("Error classifying images:", error);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Take Exam</h2>

      {/* Warning Modal */}
      <Modal show={showWarning} onHide={() => setShowWarning(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{`Warning: You are ${warningMessage}`}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowWarning(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Exam Selection */}
      {!isTakingExam && results.length === 0 && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Select Exam</Form.Label>
            <Form.Select
              onChange={handleExamSelect}
              value={selectedExam ? selectedExam.id : ""}
            >
              <option value="">-- Select an Exam --</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.duration} min)
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button
            variant="success"
            onClick={handleStartExam}
            disabled={!selectedExam}
          >
            Start Exam
          </Button>
        </>
      )}

      {/* Exam in Progress */}
      {isTakingExam && selectedExam && (
        <Card className="mt-4 p-3 shadow-lg">
          <Card.Body>
            <h3 className="text-center">{selectedExam.title}</h3>

            {/* Timer Progress Bar */}
            <ProgressBar
              animated
              now={(timer / (selectedExam.duration * 60)) * 100}
              variant="danger"
              className="my-3"
            />
            <p className="text-center text-danger fw-bold">
              Time Left: {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}
              {timer % 60}
            </p>

            {/* Live Webcam Feed */}
            <div className="text-center mt-3">
              <h5>Live Camera Feed</h5>
              <img
                src="http://127.0.0.1:5000/api/video_feed"
                alt="Webcam Stream"
                width="640"
                height="480"
              />
            </div>

            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="secondary"
                onClick={() => setIsTakingExam(false)}
              >
                Cancel Exam
              </Button>
              <Button variant="primary" onClick={handleSubmitExam}>
                Submit Exam
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Results Modal */}
      <Modal
        show={showResults}
        onHide={() => setShowResults(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📊 Exam Behavior Analysis</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {capturedImages.map((img, index) => (
              <Col key={index} md={4} className="text-center">
                <img
                  src={img.image}
                  alt={`Captured ${index}`}
                  width="100%"
                  className="mb-2"
                />
                <p>
                  <strong>{results[index]}</strong>
                </p>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TakeExam;
