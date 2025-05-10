import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Card,
  Form,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageExam = () => {
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  useEffect(() => {
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

    if (instructorId) fetchExams();
  }, [instructorId]);

  const fetchStudents = async (examId) => {
    try {
      setLoading(true);
      const [enrolledRes, allRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/exam_students/${examId}`),
        axios.get("http://localhost:5000/api/students"),
      ]);
      setEnrolledStudents(enrolledRes.data);
      setAllStudents(allRes.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    fetchStudents(exam.id);
    setShowModal(true);
  };

  const handleAddStudent = async () => {
    // Check if student is already enrolled
    const alreadyEnrolled = enrolledStudents.some(
      (student) => student.id.toString() === selectedStudent.toString()
    );

    if (alreadyEnrolled) {
      toast.warning("Student is already enrolled in this exam.");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/exam_students`, {
        exam_id: selectedExam.id,
        student_id: selectedStudent,
      });
      toast.success("Student added successfully");
      fetchStudents(selectedExam.id);
      setSelectedStudent(""); // reset dropdown
    } catch (err) {
      toast.error("Failed to add student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/exam_students/${selectedExam.id}/${studentId}`
      );
      toast.success("Student removed successfully");
      fetchStudents(selectedExam.id);
    } catch (err) {
      toast.error("Failed to remove student");
    }
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

      {selectedExam && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-info-circle me-2"></i>
              Exam: {selectedExam.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
            <p>
              <strong>Description:</strong> {selectedExam.description}
            </p>
            <p>
              <strong>Duration:</strong> {selectedExam.duration_minutes} minutes
            </p>

            <h5 className="mt-4">Enrolled Students</h5>
            {loading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div
                className="mb-4"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                <ul className="list-group">
                  {enrolledStudents.map((student) => (
                    <li
                      key={student.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-bold">{student.name}</div>
                        <div className="text-muted small">{student.email}</div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        <i className="bi bi-x-circle me-1"></i>Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Form.Group controlId="addStudent" className="mt-3">
              <Form.Label>Add Student</Form.Label>
              <Form.Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Select Student --</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </Form.Select>
              <Button
                variant="success"
                className="mt-2"
                onClick={handleAddStudent}
                disabled={!selectedStudent}
              >
                Add Student
              </Button>
            </Form.Group>
          </Modal.Body>
        </Modal>
      )}
    </Container>
  );
};

export default ManageExam;
