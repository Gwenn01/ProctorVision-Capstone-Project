import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  ListGroup,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import { FaSearch } from "react-icons/fa";

const CreateExam = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  const [examData, setExamData] = useState({
    title: "",
    description: "",
    time: 20,
  });

  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [examFile, setExamFile] = useState(null);

  const [allStudents, setAllStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [filters, setFilters] = useState({
    course: "",
    year: "",
    section: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/all-students");
      setAllStudents(res.data);
    } catch (err) {
      toast.error("Failed to load students.");
    }
  };

  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExamData((prev) => ({
      ...prev,
      [name]: name === "time" ? parseInt(value) : value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkAssign = () => {
    const filtered = allStudents.filter(
      (s) =>
        s.course === filters.course &&
        s.year === filters.year &&
        s.section === filters.section
    );

    const newStudents = filtered.filter(
      (s) => !enrolledStudents.some((e) => e.id === s.id)
    );

    if (newStudents.length === 0) {
      toast.info("No new students to assign.");
      return;
    }

    setEnrolledStudents([...enrolledStudents, ...newStudents]);
    toast.success(`Added ${newStudents.length} students.`);
  };

  const handleAddIndividual = () => {
    const student = allStudents.find(
      (s) => s.id.toString() === selectedStudent
    );

    if (!student) return;

    if (enrolledStudents.some((s) => s.id === student.id)) {
      toast.warning("Student already added.");
      return;
    }

    setEnrolledStudents([...enrolledStudents, student]);
    toast.success(`Added students.`);
    setSelectedStudent("");
  };

  const handleRemoveStudent = (id) => {
    setEnrolledStudents(enrolledStudents.filter((s) => s.id !== id));
  };

  const handleSaveExam = async () => {
    const { title, description, time } = examData;

    if (!title || !description || time <= 0 || !examDate || !startTime) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (enrolledStudents.length === 0) {
      toast.warning("Please assign at least one student.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("time", time);
    formData.append("exam_date", examDate);
    formData.append("start_time", startTime);
    formData.append("instructor_id", instructorId);
    formData.append("students", JSON.stringify(enrolledStudents));

    if (examFile) {
      formData.append("exam_file", examFile);
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/create-exam",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Exam created successfully!");
      window.location.reload();
      console.log("Exam Created:", res.data);
    } catch (err) {
      toast.error("Failed to save exam.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const courseOptions = [...new Set(allStudents.map((s) => s.course))];
  const yearOptions = [...new Set(allStudents.map((s) => s.year))];
  const sectionOptions = [...new Set(allStudents.map((s) => s.section))];

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      <ToastContainer autoClose={2500} />
      <Card className="shadow-lg border-0 p-4">
        <Card.Body>
          <h2 className="text-center fw-bold mb-4">
            <i className="bi bi-pencil-square me-2"></i>Create Exam
          </h2>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={examData.title}
              onChange={handleExamChange}
              placeholder="Enter exam title"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={examData.description}
              onChange={handleExamChange}
              placeholder="Brief exam description"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Duration (minutes)</Form.Label>
            <Form.Control
              type="number"
              name="time"
              value={examData.time}
              min={1}
              onChange={handleExamChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Exam Date</Form.Label>
            <Form.Control
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Start Time</Form.Label>
            <Form.Control
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              Upload Exam File (optional)
            </Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setExamFile(e.target.files[0])}
            />
          </Form.Group>

          <hr />
          <h5 className="fw-bold">Bulk Assign Students</h5>
          <Row className="mb-3">
            <Col md>
              <Form.Select
                name="course"
                value={filters.course}
                onChange={handleFilterChange}
              >
                <option value="">Select Course</option>
                {courseOptions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md>
              <Form.Select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
              >
                <option value="">Select Year</option>
                {yearOptions.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md>
              <Form.Select
                name="section"
                value={filters.section}
                onChange={handleFilterChange}
              >
                <option value="">Select Section</option>
                {sectionOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button
                className="w-100"
                variant="primary"
                onClick={handleBulkAssign}
              >
                Add by Group
              </Button>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Add Individual Student
            </Form.Label>

            <Row className="mb-2">
              <Col>
                <Form.Label className="fw-semibold">Search Student</Form.Label>
                <Form.Group>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaSearch />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or username"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={9}>
                <Form.Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">Select Student</option>
                  {allStudents
                    .filter((s) =>
                      `${s.name} ${s.username}`
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.username})
                      </option>
                    ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button
                  className="w-100"
                  variant="secondary"
                  onClick={handleAddIndividual}
                >
                  Add Student
                </Button>
              </Col>
            </Row>
          </Form.Group>

          {enrolledStudents.length > 0 && (
            <Card className="mt-3 p-3 border-0 shadow-sm">
              <h6 className="fw-semibold mb-3">Enrolled Students:</h6>
              <ListGroup>
                {enrolledStudents.map((student) => (
                  <ListGroup.Item
                    key={student.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {student.name}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      Remove
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}

          <Button
            variant="success"
            className="mt-4 w-100"
            onClick={handleSaveExam}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Save Exam"}
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateExam;
