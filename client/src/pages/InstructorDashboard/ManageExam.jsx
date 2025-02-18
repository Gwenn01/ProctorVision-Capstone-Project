import React, { useState } from "react";
import { Container, Table, Button, Modal } from "react-bootstrap";

const ManageExam = () => {
  const initialExams = [
    {
      id: 1,
      title: "Math Quiz",
      description: "Basic algebra questions",
      duration: "30 minutes",
    },
    {
      id: 2,
      title: "Science Test",
      description: "General science knowledge",
      duration: "45 minutes",
    },
  ];

  const [exams, setExams] = useState(initialExams);
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setShowModal(true);
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Manage Exams</h2>

      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exams.length > 0 ? (
            exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.id}</td>
                <td>{exam.title}</td>
                <td>{exam.description}</td>
                <td>{exam.duration}</td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleStartExam(exam)}
                  >
                    Start Exam
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No exams found
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {selectedExam && (
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Exam: {selectedExam.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Description:</strong> {selectedExam.description}
            </p>
            <p>
              <strong>Duration:</strong> {selectedExam.duration}
            </p>
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

export default ManageExam;
