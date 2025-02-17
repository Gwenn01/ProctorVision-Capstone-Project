import React, { useState, useEffect } from "react";
import { Container, Card, Button, Form, ProgressBar } from "react-bootstrap";

const TakeExam = () => {
  // Sample exam data
  const exams = [
    {
      id: 1,
      title: "Math Exam",
      duration: 10,
      questions: [
        {
          id: 1,
          questionText: "What is 2 + 2?",
          format: "Multiple Choice",
          options: ["2", "3", "4", "5"],
        },
        {
          id: 2,
          questionText: "Which numbers add up to 5?",
          format: "Checkbox",
          options: ["1", "2", "3", "4"],
        },
        {
          id: 3,
          questionText: "Explain the Pythagorean theorem:",
          format: "Short Answer",
        },
      ],
    },
  ];

  const [selectedExam, setSelectedExam] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
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
    setStudentAnswers({});
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

  // Handle answer selection
  const handleAnswerChange = (questionId, value) => {
    setStudentAnswers({ ...studentAnswers, [questionId]: value });
  };

  // Handle checkbox selection
  const handleCheckboxChange = (questionId, option) => {
    const currentAnswers = studentAnswers[questionId] || [];
    if (currentAnswers.includes(option)) {
      setStudentAnswers({
        ...studentAnswers,
        [questionId]: currentAnswers.filter((ans) => ans !== option),
      });
    } else {
      setStudentAnswers({
        ...studentAnswers,
        [questionId]: [...currentAnswers, option],
      });
    }
  };

  // Submit Exam
  const handleSubmitExam = () => {
    alert("Exam Submitted! Thank you.");
    setIsTakingExam(false);
    setSelectedExam(null);
    setStudentAnswers({});
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

      {/* Step 2: Take the Exam */}
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

            {/* Exam Questions */}
            {selectedExam.questions.map((q) => (
              <Form.Group className="mb-3" key={q.id}>
                <Card className="p-3">
                  <Form.Label className="fw-bold">{q.questionText}</Form.Label>

                  {/* Multiple Choice */}
                  {q.format == "Multiple Choice" &&
                    q.options.map((option, i) => (
                      <Form.Check
                        key={i}
                        type="radio"
                        label={option}
                        name={`question-${q.id}`}
                        value={option}
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                      />
                    ))}

                  {/* Checkbox */}
                  {q.format == "Checkbox" &&
                    q.options.map((option, i) => (
                      <Form.Check
                        key={i}
                        type="checkbox"
                        label={option}
                        value={option}
                        checked={
                          studentAnswers[q.id]?.includes(option) || false
                        }
                        onChange={() => handleCheckboxChange(q.id, option)}
                      />
                    ))}

                  {/* Short Answer */}
                  {q.format == "Short Answer" && (
                    <Form.Control
                      type="text"
                      placeholder="Your answer"
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                  )}
                </Card>
              </Form.Group>
            ))}

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
