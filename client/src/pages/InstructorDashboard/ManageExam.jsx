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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/exams-instructor/${instructorId}`
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
    setSelectedExam({ ...exam }); // shallow clone for safe editing
    fetchStudents(exam.id);
    setShowModal(true);
  };

  const handleAddStudent = async () => {
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
      setSelectedStudent("");
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

  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/update-exams/${selectedExam.id}`,
        {
          title: selectedExam.title,
          description: selectedExam.description,
          duration_minutes: selectedExam.duration_minutes,
          exam_date: selectedExam.exam_date,
          start_time: selectedExam.start_time,
        }
      );
      toast.success("Exam updated successfully!");
      window.location.reload();
    } catch (err) {
      toast.error("Failed to update exam.");
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
                <th>Title</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Exam Date</th>
                <th>Start Time</th>
                <th>Exam File</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{exam.description}</td>
                    <td>{exam.duration_minutes} min</td>
                    <td>{exam.exam_date}</td>
                    <td>{exam.start_time}</td>
                    <td>
                      {exam.exam_file ? (
                        <a
                          href={`http://localhost:5000/${exam.exam_file.replaceAll(
                            "\\",
                            "/"
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View File
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
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
                  <td colSpan="7" className="text-center text-muted">
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
              Edit Exam: {selectedExam.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={selectedExam.title}
                onChange={(e) =>
                  setSelectedExam({ ...selectedExam, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={selectedExam.description}
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={selectedExam.duration_minutes}
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Exam Date</Form.Label>
              <Form.Control
                type="date"
                value={
                  selectedExam.exam_date
                    ? new Date(selectedExam.exam_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    exam_date: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={selectedExam.start_time || ""}
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    start_time: e.target.value,
                  })
                }
              />
            </Form.Group>

            {selectedExam.exam_file && (
              <div className="mb-3">
                <strong>Exam File:</strong>{" "}
                <a
                  href={`http://localhost:5000/${selectedExam.exam_file}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View File
                </a>
              </div>
            )}

            <Button
              variant="primary"
              className="mb-3"
              onClick={handleSaveChanges}
            >
              <i className="bi bi-save me-1"></i> Save Changes
            </Button>

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

            <Form.Group controlId="searchStudent" className="mb-2">
              <Form.Control
                type="text"
                placeholder="Search student by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="addStudent" className="mt-1">
              <Form.Label>Add Student</Form.Label>
              <Form.Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Select Student --</option>
                {allStudents
                  .filter((s) =>
                    `${s.name} ${s.email}`
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((s) => (
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
