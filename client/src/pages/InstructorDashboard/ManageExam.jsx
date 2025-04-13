import React, { useEffect, useState } from "react";
import { Container, Table, Button, Modal } from "react-bootstrap";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageExam = () => {
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  const fetchExams = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exams/${instructorId}`
      );
      setExams(res.data);
    } catch (err) {
      console.error("Failed to fetch exams", err);
    }
  };

  useEffect(() => {
    if (instructorId) fetchExams();
  }, [instructorId]);

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setShowModal(true);
  };

  return (
    <Container className="mt-4">
      <ToastContainer autoClose={3000} />
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
                <td>{exam.duration_minutes} minutes</td>
                <td>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => handleViewExam(exam)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No exams found.
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
              <strong>Duration:</strong> {selectedExam.time} minutes
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
