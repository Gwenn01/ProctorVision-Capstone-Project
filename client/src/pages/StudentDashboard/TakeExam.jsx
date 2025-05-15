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
import { toast } from "react-toastify";
import Spinner from "../../components/Spinner"; // Adjust path if needed
import axios from "axios";

const TakeExam = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [showCapturedModal, setShowCapturedModal] = useState(false);
  const [classifiedLogs, setClassifiedLogs] = useState([]);

  // Fetch exams + filter out submitted
  useEffect(() => {
    const fetchExams = async () => {
      const userData = JSON.parse(localStorage.getItem("userData"));
      const studentId = userData?.id;
      try {
        const examsRes = await axios.get(
          `http://127.0.0.1:5000/api/get_exam?student_id=${studentId}`
        );
        const submissionsRes = await axios.get(
          `http://127.0.0.1:5000/api/get_exam_submissions?user_id=${studentId}`
        );

        const submittedIds = submissionsRes.data.map((s) => s.exam_id);
        const availableExams = examsRes.data.filter(
          (exam) => !submittedIds.includes(exam.id)
        );

        setExams(availableExams);
      } catch (error) {
        console.error("Error fetching exams/submissions:", error);
      }
    };

    fetchExams();
  }, []);

  const handleExamSelect = (e) => {
    const exam = exams.find((exam) => exam.id === parseInt(e.target.value));
    setSelectedExam(exam);
  };

  const handleStartExam = () => {
    if (!selectedExam) {
      toast.warn("Please select an exam first!");
      return;
    }
    setIsTakingExam(true);
    setTimer(selectedExam.duration_minutes * 60);
  };

  useEffect(() => {
    if (isTakingExam && timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [isTakingExam, timer]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const studentId = userData?.id;

    const notifStart = async () => {
      try {
        await axios.post(
          "http://127.0.0.1:5000/api/update_exam_status_start",
          {
            student_id: studentId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (err) {
        console.error("Error updating start status:", err);
      }
    };

    if (isTakingExam) {
      notifStart(); //
    }
  }, [isTakingExam]); //
  // FIXED: dependency array goes here

  useEffect(() => {
    if (isTakingExam) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(
            "http://127.0.0.1:5000/api/detect_warning"
          );

          if (response.data.warning !== "Looking Forward") {
            setWarningMessage(response.data.warning);
            setShowWarning(true);

            if (response.data.capture && response.data.frame) {
              const userData = JSON.parse(localStorage.getItem("userData"));
              const userId = userData?.id;

              await axios.post("http://127.0.0.1:5000/api/save_behavior_log", {
                user_id: userId,
                exam_id: selectedExam.id,
                image_base64: response.data.frame,
                warning_type: response.data.warning,
              });
            }
          }
        } catch (error) {
          console.error("Warning detection error:", error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isTakingExam, selectedExam]);

  const fetchBehaviorLogs = async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const response = await axios.get(
      `http://127.0.0.1:5000/api/get_behavior_logs?user_id=${userData.id}`
    );
    const logs = response.data.filter((log) => log.exam_id === selectedExam.id);
    setClassifiedLogs(logs.reverse());
  };

  const handleSubmitExam = async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const studentId = userData?.id;
    setIsSubmitting(true);
    try {
      await axios.post(
        "http://127.0.0.1:5000/api/update_exam_status_submit",
        {
          student_id: studentId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Exam submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit exam.");
    }
    try {
      const userData = JSON.parse(localStorage.getItem("userData"));

      await axios.post("http://127.0.0.1:5000/api/stop_camera");
      await axios.post("http://127.0.0.1:5000/api/classify_behavior_logs", {
        user_id: userData.id,
        exam_id: selectedExam.id,
      });

      await axios.post("http://127.0.0.1:5000/api/submit_exam", {
        user_id: userData.id,
        exam_id: selectedExam.id,
      });

      await fetchBehaviorLogs();

      toast.success("Exam submitted and classified.");
      setShowCapturedModal(true);
    } catch (error) {
      console.error("Error during submission:", error);
      toast.error("Something went wrong while submitting the exam.");
    }
    setIsSubmitting(false);
    setIsTakingExam(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      <h2 className="mb-4 fw-bold text-center text-md-start">
        <i className="bi bi-journal-text me-2"></i>
        Take Exam
      </h2>

      {/* Warning Modal */}
      <Modal show={showWarning} onHide={() => setShowWarning(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Behavior Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="fs-5 text-danger">{`Warning: You are ${warningMessage}`}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowWarning(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Exam Selector */}
      {!isTakingExam && (
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="p-4 shadow-sm border-0">
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Select an Exam
                  </Form.Label>
                  <Form.Select
                    onChange={handleExamSelect}
                    value={selectedExam ? selectedExam.id : ""}
                  >
                    <option value="">-- Choose an Exam --</option>
                    {exams.length === 0 ? (
                      <option disabled>No available exams</option>
                    ) : (
                      exams.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title} ({exam.duration_minutes} min)
                        </option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
                <div className="text-center mt-3">
                  <Button
                    variant="success"
                    onClick={handleStartExam}
                    disabled={!selectedExam}
                    className="w-100"
                  >
                    Start Exam
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Exam View with Camera */}
      {isTakingExam && selectedExam && (
        <Row className="justify-content-center mt-4">
          <Col xs={12} lg={10}>
            <Card className="p-4 shadow-lg border-0">
              <Card.Body>
                <h3 className="text-center fw-bold">{selectedExam.title}</h3>

                <ProgressBar
                  animated
                  now={(timer / (selectedExam.duration_minutes * 60)) * 100}
                  variant="danger"
                  className="my-3"
                />
                <p className="text-center text-danger fw-semibold fs-5">
                  Time Left: {formatTime(timer)}
                </p>

                <div className="text-center mt-4">
                  <h5 className="fw-semibold mb-2">🎥 Live Camera Feed</h5>
                  <img
                    src="http://127.0.0.1:5000/api/video_feed"
                    alt="Webcam Stream"
                    className="img-fluid rounded border"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>

                <div className="d-flex justify-content-center mt-4">
                  {isSubmitting ? (
                    <Spinner />
                  ) : (
                    <Button variant="primary" onClick={handleSubmitExam}>
                      Submit Exam
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Captured Modal */}
      <Modal
        show={showCapturedModal}
        onHide={() => setShowCapturedModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📸 Captured Behavior Logs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {classifiedLogs.length > 0 ? (
            <Row>
              {classifiedLogs.map((log, index) => (
                <Col
                  key={index}
                  xs={12}
                  sm={6}
                  md={4}
                  className="mb-4 text-center"
                >
                  <img
                    src={`data:image/jpeg;base64,${log.image_base64}`}
                    alt={`Captured ${index}`}
                    className="img-fluid rounded shadow-sm border mb-2"
                  />
                  <div className="fw-semibold">Warning: {log.warning_type}</div>
                  <div
                    className={`fw-bold ${
                      log.classification_label === "Cheating"
                        ? "text-danger"
                        : "text-success"
                    }`}
                  >
                    Result: {log.classification_label || "Unclassified"}
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <p className="text-center">No behavior logs found.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TakeExam;
