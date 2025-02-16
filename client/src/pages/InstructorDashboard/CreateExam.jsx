import React, { useState } from "react";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";

const CreateExam = () => {
  // Step 1: Exam Info
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [isExamCreated, setIsExamCreated] = useState(false);

  // Step 2: Questions
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    format: "Multiple Choice",
    options: [""],
  });

  // Handle exam creation
  const handleCreateExam = () => {
    if (!examTitle || !examDescription) {
      alert("Please fill in the exam title and description.");
      return;
    }
    setIsExamCreated(true);
  };

  // Handle adding a question
  const addQuestion = () => {
    if (!currentQuestion.questionText) {
      alert("Please enter the question text.");
      return;
    }
    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      questionText: "",
      format: "Multiple Choice",
      options: [""],
    });
  };

  // Handle removing a question
  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // Handle option change
  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // Handle adding new option
  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ""],
    });
  };

  // Handle removing an option
  const removeOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // Handle final exam submission
  const handleSaveExam = () => {
    alert("Exam Saved!");
    console.log({
      examTitle,
      examDescription,
      questions,
    });
  };

  return (
    <Container className="mt-4">
      <Card className="shadow-lg p-4">
        <Card.Body>
          <h2 className="text-center mb-3">Create Exam</h2>

          {/* Step 1: Exam Details */}
          {!isExamCreated ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Exam Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter exam title"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Exam Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter description"
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                />
              </Form.Group>

              <Button
                variant="success"
                className="w-100"
                onClick={handleCreateExam}
              >
                Create Exam
              </Button>
            </>
          ) : (
            <>
              <h4 className="mb-3">Exam: {examTitle}</h4>

              {/* Step 2: Add Questions */}
              <h5 className="mt-3">Add Questions</h5>
              <Form.Group className="mb-3">
                <Form.Label>Question</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter question"
                  value={currentQuestion.questionText}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      questionText: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Question Type</Form.Label>
                <Form.Select
                  value={currentQuestion.format}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      format: e.target.value,
                    })
                  }
                >
                  <option>Multiple Choice</option>
                  <option>Checkbox</option>
                  <option>Drop-down</option>
                </Form.Select>
              </Form.Group>

              {/* Options for Multiple Choice & Checkbox */}
              {(currentQuestion.format === "Multiple Choice" ||
                currentQuestion.format === "Checkbox") && (
                <div className="mb-3">
                  <Form.Label>Options</Form.Label>
                  {currentQuestion.options.map((option, index) => (
                    <Row key={index} className="mb-2">
                      <Col md={8}>
                        <Form.Control
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                        />
                      </Col>
                      <Col md={2}>
                        <Button
                          variant="danger"
                          onClick={() => removeOption(index)}
                        >
                          -
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button variant="primary" onClick={addOption}>
                    + Add Option
                  </Button>
                </div>
              )}

              <Button
                variant="secondary"
                className="mt-3"
                onClick={addQuestion}
              >
                Add Question
              </Button>

              {/* Display Added Questions */}
              <h5 className="mt-4">Questions</h5>
              {questions.length === 0 ? (
                <p>No questions added yet.</p>
              ) : (
                questions.map((q, index) => (
                  <Card key={index} className="mb-2">
                    <Card.Body>
                      <strong>{q.questionText}</strong> ({q.format})
                      {q.options.length > 0 && (
                        <ul>
                          {q.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        Delete
                      </Button>
                    </Card.Body>
                  </Card>
                ))
              )}

              {/* Final Save Exam Button */}
              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary">Preview Exam</Button>
                <Button variant="success" onClick={handleSaveExam}>
                  Save Exam
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateExam;
