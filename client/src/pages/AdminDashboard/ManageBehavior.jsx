import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Image,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { FaUser, FaEye } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageBehavior = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentExams, setStudentExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users?role=Student"
      );
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
      toast.error("Unable to load students");
    }
  };

  const viewBehavior = async (student) => {
    setSelectedStudent(student);
    setBehaviorLogs([]);
    setStudentExams([]);
    setSelectedExam(null);
    setShowModal(true);
    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/student-exams/${student.id}`
      );
      setStudentExams(res.data);
    } catch (err) {
      console.error("Failed to fetch student exams", err);
      toast.error("Unable to fetch exams for this student.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setBehaviorLogs([]);
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/behavior-images/${exam.id}/${selectedStudent.id}`
      );
      setBehaviorLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch behavior logs", err);
      toast.error("Unable to fetch behavior data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <ToastContainer />
      <h3 className="fw-bold mb-4 d-flex align-items-center">
        <FaUser className="me-2" />
        Manage Student Behavior
      </h3>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.username}</td>
                <td>{student.email}</td>
                <td>
                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={() => viewBehavior(student)}
                  >
                    <FaEye className="me-1" />
                    View Behavior
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No student records found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Behavior Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Behavior Logs - {selectedStudent?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p className="mt-2">Loading...</p>
            </div>
          ) : studentExams.length > 0 ? (
            <>
              <h6>Select Exam:</h6>
              <div className="mb-3 d-flex flex-wrap gap-2">
                {studentExams.map((exam) => (
                  <Button
                    key={exam.id}
                    variant={
                      selectedExam?.id === exam.id
                        ? "dark"
                        : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => handleSelectExam(exam)}
                  >
                    {exam.title}
                  </Button>
                ))}
              </div>

              {selectedExam && behaviorLogs.length > 0 ? (
                <Table bordered responsive>
                  <thead className="table-light">
                    <tr>
                      <th>Image</th>
                      <th>Warning</th>
                      <th>Classification</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviorLogs.map((log, index) => (
                      <tr key={index}>
                        <td>
                          <Image
                            src={`data:image/jpeg;base64,${log.image_base64}`}
                            thumbnail
                            width="100"
                          />
                        </td>
                        <td>{log.warning_type}</td>
                        <td>{log.classification_label}</td>
                        <td>{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : selectedExam ? (
                <p className="text-muted">
                  No behavior logs found for this exam.
                </p>
              ) : (
                <p className="text-muted">
                  Select an exam to view behavior logs.
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-muted">
              This student has not taken any exams.
            </p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManageBehavior;
