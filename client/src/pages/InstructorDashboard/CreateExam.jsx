import React, { useState } from "react";
import { Container, Card, Button, Form } from "react-bootstrap";

const CreateExam = () => {
  let data = {
    title: "Activities",
    description: "",
    time: 20,
  };

  const [examData, setExamData] = useState(data);
  const [isExamCreated, setIsExamCreated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData((prevData) => ({
      ...prevData,
      [name]: name === "time" ? parseInt(value) : value,
    }));
  };

  const handleCreateExam = () => {
    if (!examData.title || !examData.description || examData.time <= 0) {
      alert("Please fill in all fields correctly.");
      return;
    }
    setIsExamCreated(true);
  };

  const handleSaveExam = () => {
    alert("Exam Saved!");
    console.log(examData);
  };

  return (
    <Container className="mt-4">
      <Card className="shadow-lg p-4">
        <Card.Body>
          <h2 className="text-center mb-3">Exam Setup</h2>

          {!isExamCreated ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Exam Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={examData.title}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Exam Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  placeholder="Enter description"
                  value={examData.description}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Exam Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="time"
                  min="1"
                  value={examData.time}
                  onChange={handleChange}
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
              <h4 className="mb-3">Exam: {examData.title}</h4>
              <p>
                <strong>Description:</strong> {examData.description}
              </p>
              <p>
                <strong>Duration:</strong> {examData.time} minutes
              </p>
              <Button variant="success" onClick={handleSaveExam}>
                Save Exam
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateExam;
