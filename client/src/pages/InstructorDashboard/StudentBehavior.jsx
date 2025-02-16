import React, { useState } from "react";
import { Container, Table, Button, Modal, Form } from "react-bootstrap";

const StudentBehavior = () => {
  // Sample exam data (Replace with backend data)
  const exams = [
    { id: 1, title: "Math Quiz" },
    { id: 2, title: "Science Test" },
    { id: 3, title: "History Exam" },
  ];

  // Sample student behavior records per exam
  const behaviorRecords = {
    1: [
      // Math Quiz
      {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        cheated: true,
        behaviors: [
          "Switching tabs multiple times",
          "Looking left frequently",
          "Minimized exam window",
        ],
      },
      {
        id: 2,
        name: "Alice Johnson",
        username: "alicej",
        cheated: false,
        behaviors: ["No suspicious activity"],
      },
    ],
    2: [
      // Science Test
      {
        id: 3,
        name: "Mark Brown",
        username: "markb",
        cheated: true,
        behaviors: ["Using phone", "Looking at another student's screen"],
      },
      {
        id: 4,
        name: "Emma Watson",
        username: "emmaw",
        cheated: false,
        behaviors: ["No suspicious activity"],
      },
    ],
    3: [
      // History Exam
      {
        id: 5,
        name: "Michael Lee",
        username: "michaell",
        cheated: false,
        behaviors: ["No suspicious activity"],
      },
      {
        id: 6,
        name: "Sara White",
        username: "saraw",
        cheated: true,
        behaviors: ["Talking during exam", "Gaze on right frequently"],
      },
    ],
  };

  const [selectedExam, setSelectedExam] = useState("");
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Handle Exam Selection
  const handleExamSelect = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    setStudents(behaviorRecords[examId] || []); // Load student data
  };

  // Open Modal to Show Detailed Behavior Logs
  const handleViewBehavior = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Student Behavior Monitoring</h2>

      {/* Step 1: Select Exam */}
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

      {/* Step 2: Show Student Behavior Records */}
      {selectedExam && (
        <>
          <h4 className="mt-4">
            Exam: {exams.find((exam) => exam.id == selectedExam)?.title}
          </h4>
          <Table striped bordered hover className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Cheated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className={student.cheated ? "table-danger" : ""}
                  >
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>{student.cheated ? "Yes" : "No"}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewBehavior(student)}
                      >
                        View Behavior
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No student records available for this exam.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      )}

      {/* Modal to Show Detailed Behavior Logs */}
      {selectedStudent && (
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Behavior Logs for {selectedStudent.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ul>
              {selectedStudent.behaviors.map((behavior, index) => (
                <li key={index}>{behavior}</li>
              ))}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default StudentBehavior;
