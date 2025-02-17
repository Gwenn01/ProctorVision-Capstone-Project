import React, { useState, useEffect } from "react";
import { Container, Card, Button, Form, ProgressBar } from "react-bootstrap";

const TakeExam = () => {
  // Sample exam data
  const exams = [
    { id: 1, title: "Math Exam", duration: 10 },
    { id: 2, title: "Science Test", duration: 15 },
  ];

  const [selectedExam, setSelectedExam] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTakingExam, setIsTakingExam] = useState(false);

  // Timer Countdown
  useEffect(() => {
    if (isTakingExam && timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [isTakingExam, timer]);

  // Handle selecting an exam
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
    setTimer(selectedExam.duration * 60); // Convert minutes to seconds
  };

  // Submit Exam
  const handleSubmitExam = () => {
    alert("Exam Submitted! Thank you.");
    setIsTakingExam(false);
    setSelectedExam(null);
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Take Exam</h2>

      {/* Step 1: Choose Exam */}
      {!isTakingExam && (
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

      {/* Step 2: Exam Timer & Submit Button */}
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
    </Container>
  );
};

export default TakeExam;
