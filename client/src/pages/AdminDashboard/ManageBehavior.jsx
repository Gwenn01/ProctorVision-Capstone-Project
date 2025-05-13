import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Image,
  Spinner,
  Row,
  Col,
  Form,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import { FaUser, FaEye, FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageBehavior = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filters, setFilters] = useState({
    course: "",
    year: "",
    section: "",
    status: "",
    search: "",
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentExams, setStudentExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

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

  const applyFilters = () => {
    const { course, year, section, status, search } = filters;
    const filtered = students.filter((student) => {
      const matchCourse = course ? student.course === course : true;
      const matchYear = year ? student.year === year : true;
      const matchSection = section ? student.section === section : true;
      const matchStatus = status ? student.status === status : true;
      const matchSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.username.toLowerCase().includes(search.toLowerCase());
      return (
        matchCourse && matchYear && matchSection && matchStatus && matchSearch
      );
    });
    setFilteredStudents(filtered);
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

      {/* Filters and Search */}
      <Row className="mb-3">
        <Col md={2}>
          <Form.Select
            value={filters.course}
            onChange={(e) => setFilters({ ...filters, course: e.target.value })}
          >
            <option value="">All Courses</option>
            <option value="BSIT">BSIT</option>
            <option value="BSCS">BSCS</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={filters.section}
            onChange={(e) =>
              setFilters({ ...filters, section: e.target.value })
            }
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search name or username..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </InputGroup>
        </Col>
      </Row>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Course</th>
            <th>Year</th>
            <th>Section</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.username}</td>
                <td>{student.email}</td>
                <td>{student.course}</td>
                <td>{student.year}</td>
                <td>{student.section}</td>
                <td>{student.status}</td>
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
              <td colSpan="8" className="text-center text-muted">
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
