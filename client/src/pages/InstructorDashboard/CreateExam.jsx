import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";

const CreateExam = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  const [examData, setExamData] = useState({
    title: "",
    description: "",
    time: 20,
    students: [],
  });

  const [assignedStudents, setAssignedStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isExamCreated, setIsExamCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch assigned students on load
  useEffect(() => {
    if (instructorId) {
      fetchAssignedStudents();
    }
  }, [instructorId]);

  const fetchAssignedStudents = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/assigned-students/${instructorId}`
      );
      setAssignedStudents(res.data);
    } catch (err) {
      toast.error("Failed to load assigned students");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData((prevData) => ({
      ...prevData,
      [name]: name === "time" ? parseInt(value) : value,
    }));
  };

  const handleAddStudent = () => {
    if (!selectedStudent) return;

    const student = assignedStudents.find(
      (s) => s.id.toString() === selectedStudent
    );
    if (!student) return;

    if (enrolledStudents.some((s) => s.id === student.id)) {
      toast.warning("Student is already enrolled.");
      return;
    }

    setEnrolledStudents([...enrolledStudents, student]);
    setSelectedStudent("");
  };

  const handleRemoveStudent = (id) => {
    setEnrolledStudents(enrolledStudents.filter((s) => s.id !== id));
  };

  const handleCreateExam = () => {
    if (!examData.title || !examData.description || examData.time <= 0) {
      toast.error("Please fill in all fields correctly.");
      return;
    }
    setIsExamCreated(true);
  };

  const handleSaveExam = async () => {
    if (enrolledStudents.length === 0) {
      toast.warning("Please enroll at least one student.");
      return;
    }

    const payload = {
      ...examData,
      instructor_id: instructorId,
      students: enrolledStudents,
    };

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/create-exam",
        payload
      );
      toast.success("Exam created successfully!");
      console.log("Exam Created:", res.data);
      // Reset form or redirect if needed
    } catch (err) {
      toast.error("Failed to save exam.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <ToastContainer autoClose={2500} />
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
                  value={examData.description}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="time"
                  value={examData.time}
                  min={1}
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
              <h4 className="mb-3">Title: {examData.title}</h4>
              <p>
                <strong>Description:</strong> {examData.description}
              </p>
              <p>
                <strong>Duration:</strong> {examData.time} minutes
              </p>

              <h5 className="mt-4">Enroll Students</h5>
              <Row>
                <Col md={8}>
                  <Form.Select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  >
                    <option value="">Select Student</option>
                    {assignedStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.username})
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Button variant="primary" onClick={handleAddStudent}>
                    Add Student
                  </Button>
                </Col>
              </Row>

              {enrolledStudents.length > 0 && (
                <Card className="mt-3 p-3">
                  <h6>Enrolled Students:</h6>
                  <ul className="list-group">
                    {enrolledStudents.map((student) => (
                      <li
                        key={student.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {student.name}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Button
                variant="success"
                className="mt-3"
                onClick={handleSaveExam}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Save Exam"}
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateExam;
