import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Row,
  Col,
  Card,
} from "react-bootstrap";
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
    <Container fluid className="py-4 px-3 px-md-5">
      <ToastContainer autoClose={3000} />
      <h2 className="mb-4 fw-bold text-center text-md-start">
        <i className="bi bi-journal-bookmark-fill me-2"></i>Manage Exams
      </h2>

      <Card className="shadow-sm border-0 p-3">
        <div className="table-responsive">
          <Table striped bordered hover className="align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Duration</th>
                <th className="text-center">Actions</th>
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
                    <td className="text-center">
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewExam(exam)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No exams found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* View Modal */}
      {selectedExam && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          size="md"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-info-circle me-2"></i>
              Exam: {selectedExam.title}
            </Modal.Title>
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
