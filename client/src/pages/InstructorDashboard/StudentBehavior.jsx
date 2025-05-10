import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StudentBehavior = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [behaviorImages, setBehaviorImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  const instructorId = JSON.parse(localStorage.getItem("userData"))?.id;

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/exams-with-behavior?instructor_id=${instructorId}`
        );
        setExams(response.data);
      } catch (err) {
        toast.error("Failed to load exams with behavior data");
      }
    };

    if (instructorId) {
      fetchExams();
    }
  }, [instructorId]);

  const handleExamSelect = async (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/exam-behavior/${examId}`
      );
      setStudents(response.data);
    } catch (err) {
      toast.error("Failed to load student behavior");
    }
    setLoading(false);
  };

  const handleViewBehavior = async (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setLoadingImages(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/behavior-images/${selectedExam}/${student.id}`
      );
      setBehaviorImages(res.data);
    } catch (err) {
      toast.error("Failed to load behavior images");
    }
    setLoadingImages(false);
  };

  return (
    <Container className="py-4 px-3 px-md-5">
      <ToastContainer />
      <h2 className="mb-4 fw-bold">
        <i className="bi bi-person-check-fill me-2"></i> Student Behavior
        Monitoring
      </h2>

      <Form.Group controlId="examSelect" className="mb-4">
        <Form.Label className="fw-bold text-dark">
          <i className="bi bi-clipboard-check me-2"></i>Select an Exam
        </Form.Label>
        <Form.Select
          value={selectedExam}
          onChange={handleExamSelect}
          className="shadow-sm border-primary"
        >
          <option value="">-- Choose from your created exams --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : selectedExam ? (
        <>
          <h4 className="mt-4 text-primary">
            <i className="bi bi-book me-2"></i>
            Exam:{" "}
            {exams.find((exam) => exam.id === parseInt(selectedExam))?.title}
          </h4>
          <Table striped bordered hover className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Username</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <tr
                    key={student.id}
                    className={student.cheated ? "table-danger" : ""}
                  >
                    <td>{index + 1}</td>
                    <td className="text-dark">{student.name}</td>
                    <td className="text-dark">@{student.username}</td>
                    <td>
                      <Badge bg={student.cheated ? "danger" : "success"}>
                        {student.cheated ? "Cheated" : "Clean"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewBehavior(student)}
                      >
                        <i className="bi bi-eye"></i> View Behavior
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No student records available for this exam.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      ) : null}

      {selectedStudent && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-person-lines-fill me-2"></i>
              Behavior Logs for {selectedStudent.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingImages && (
              <div className="text-center">
                <Spinner animation="border" />
              </div>
            )}
            {!loadingImages && behaviorImages.length === 0 && (
              <p className="text-muted">No behavior logs found.</p>
            )}
            <div className="row">
              {behaviorImages.map((img, index) => (
                <div className="col-md-6 mb-4" key={index}>
                  <div className="card shadow-sm h-100">
                    <img
                      src={`data:image/jpeg;base64,${img.image_base64}`}
                      alt={`Behavior ${index}`}
                      className="card-img-top"
                      style={{ maxHeight: "250px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <p className="mb-1 text-dark">
                        <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                        <strong>Warning:</strong> {img.warning_type}
                      </p>
                      <p className="text-dark mb-1">
                        <i className="bi bi-cpu me-1"></i>
                        <strong>AI:</strong>{" "}
                        {img.classification_label || "Not yet classified"}
                      </p>
                      <p className="text-dark small mb-0">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(img.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              <i className="bi bi-x-circle me-1"></i> Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default StudentBehavior;
