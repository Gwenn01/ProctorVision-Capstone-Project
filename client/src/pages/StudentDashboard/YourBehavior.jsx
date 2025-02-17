import React, { useState } from "react";
import { Container, Card, Table, Form } from "react-bootstrap";

const YourBehavior = () => {
  // Sample exams
  const exams = [
    { id: 1, title: "Math Quiz" },
    { id: 2, title: "Science Test" },
  ];

  // Sample student behavior logs
  const behaviorRecords = {
    1: {
      cheated: true,
      behaviors: [
        { timestamp: "10:05 AM", action: "Looking right" },
        { timestamp: "10:10 AM", action: "Looked away from screen frequently" },
      ],
    },
    2: {
      cheated: false,
      behaviors: [
        { timestamp: "10:15 AM", action: "Stayed focused on the exam" },
      ],
    },
  };

  const [selectedExam, setSelectedExam] = useState("");
  const [behaviorData, setBehaviorData] = useState(null);

  // Handle selecting an exam
  const handleExamSelect = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    setBehaviorData(behaviorRecords[examId] || null);
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Your Exam Behavior</h2>

      {/* Select Exam */}
      <Form.Group className="mb-3">
        <Form.Label>Select Exam</Form.Label>
        <Form.Select value={selectedExam} onChange={handleExamSelect}>
          <option value="">-- Select an Exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Show Student Behavior */}
      {behaviorData && (
        <Card className="p-3 shadow-lg">
          <Card.Body>
            <h3 className="text-center">
              {exams.find((e) => e.id == selectedExam)?.title}
            </h3>
            <p
              className={`text-center fw-bold ${
                behaviorData.cheated ? "text-danger" : "text-success"
              }`}
            >
              {behaviorData.cheated
                ? "Cheating detected."
                : "No suspicious behavior detected."}
            </p>

            {/* Behavior Details */}
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Timestamp</th>
                  <th>Behavior Recorded</th>
                </tr>
              </thead>
              <tbody>
                {behaviorData.behaviors.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.timestamp}</td>
                    <td>{entry.action}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default YourBehavior;
