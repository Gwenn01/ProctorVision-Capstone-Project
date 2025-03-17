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
  const [capturedImages, setCapturedImages] = useState([]); // Store captured images
  const [showCapturedModal, setShowCapturedModal] = useState(false); // Controls captured images modal

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
  };

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
          console.log("📡 Full API Response:", response.data);

          if (response.data.warning !== "Looking Forward") {
            console.log(`⚠️ Warning detected: ${response.data.warning}`);
            setWarningMessage(response.data.warning);
            setShowWarning(true);

            if (response.data.capture && response.data.frame) {
              const imageUrl = `data:image/jpeg;base64,${response.data.frame}`;
              console.log("📸 Capturing Image:", imageUrl.substring(0, 50) + "...");

              setCapturedImages((prevImages) => [
                { image: imageUrl, label: "Non Cheating" }, // Default label as "Non Cheating"
                ...prevImages,
              ]);
            }
          }
        } catch (error) {
          console.error("Error detecting warning:", error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isTakingExam]);

  // Submit Exam
  const handleSubmitExam = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/api/stop_camera");
      alert("Exam Submitted! Opening captured images...");
      setShowCapturedModal(true); // Open captured images modal
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
    setIsTakingExam(false);
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
      {!isTakingExam && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Select Exam</Form.Label>
            <Form.Select onChange={handleExamSelect} value={selectedExam ? selectedExam.id : ""}>
              <option value="">-- Select an Exam --</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.duration} min)
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button variant="success" onClick={handleStartExam} disabled={!selectedExam}>
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
                width="440"
                height="280"
              />
            </div>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => setIsTakingExam(false)}>
                Cancel Exam
              </Button>
              <Button variant="primary" onClick={handleSubmitExam}>
                Submit Exam
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Captured Images Modal */}
      <Modal show={showCapturedModal} onHide={() => setShowCapturedModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>📸 Captured Images</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {capturedImages.length > 0 ? (
            <Row>
              {capturedImages.map((img, index) => (
                <Col key={index} md={4} className="text-center">
                  <img
                    src={img.image}
                    alt={`Captured ${index}`}
                    width="100%"
                    className="mb-2 rounded border shadow"
                  />
                  <p><strong>{img.label}</strong></p>
                </Col>
              ))}
            </Row>
          ) : (
            <p className="text-center">No images captured.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCapturedModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TakeExam;
