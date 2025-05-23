import React, { useEffect, useState } from "react";
import {
  Container,
  Form,
  Button,
  Modal,
  Table,
  Spinner,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import { FaChalkboardTeacher, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageExam = () => {
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editExam, setEditExam] = useState({
    id: "",
    title: "",
    description: "",
    exam_date: "",
    start_time: "",
  });

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    const filtered = instructors.filter((i) =>
      (i.name + i.username).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInstructors(filtered);
  }, [searchTerm, instructors]);

  const fetchInstructors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/instructors");
      setInstructors(res.data);
      setFilteredInstructors(res.data);
    } catch (err) {
      console.error("Failed to fetch instructors", err);
    }
  };

  const handleInstructorSelect = async (e) => {
    const instructorId = e.target.value;
    setSelectedInstructor(instructorId);
    setShowModal(true);
    setLoadingExams(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/exams/instructor/${instructorId}`
      );
      setExams(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Failed to fetch exams", err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleDelete = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        await axios.delete(`http://localhost:5000/api/exams/${examId}`);
        setExams((prev) => prev.filter((exam) => exam.id !== examId));
        toast.success("Exam deleted successfully");
      } catch (err) {
        console.error("Failed to delete exam", err);
        toast.error("Failed to delete exam.");
      }
    }
  };

  const handleEdit = (exam) => {
    setEditExam({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      exam_date: exam.exam_date || "",
      start_time: exam.start_time?.substring(0, 5) || "", // ensures input shows HH:MM
    });
    setEditModal(true);
  };
  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    return date.toISOString().split("T")[0]; // Outputs 'YYYY-MM-DD'
  };

  const handleEditChange = (e) => {
    setEditExam({ ...editExam, [e.target.name]: e.target.value });
  };

  const handleUpdateExam = async () => {
    const updatedData = {
      ...editExam,
      exam_date: formatDate(editExam.exam_date),
      start_time:
        editExam.start_time.length === 5
          ? `${editExam.start_time}:00`
          : editExam.start_time,
    };

    console.log("Submitting update:", updatedData);

    try {
      await axios.put(
        `http://localhost:5000/api/exams/${editExam.id}`,
        updatedData
      );
      toast.success("Exam updated successfully!");
      window.location.reload();
      setEditModal(false);

      const res = await axios.get(
        `http://localhost:5000/api/exams/instructor/${selectedInstructor}`
      );
      setExams(res.data);
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update exam.");
    }
  };

  return (
    <Container className="mt-5">
      <ToastContainer />
      <h3 className="mb-4 d-flex align-items-center fw-bold">
        <FaChalkboardTeacher className="me-2" />
        Manage Instructor Exams
      </h3>

      <InputGroup className="mb-3">
        <InputGroup.Text>
          <FaSearch />
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search instructor by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <Form.Group controlId="instructorSelect" className="mb-4">
        <Form.Label>Select Instructor</Form.Label>
        <Form.Select
          value={selectedInstructor}
          onChange={handleInstructorSelect}
        >
          <option value="">-- Choose Instructor --</option>
          {filteredInstructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Exam List Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Created Exams</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingExams ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Loading exams...</p>
            </div>
          ) : exams.length > 0 ? (
            <Table bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{exam.description}</td>
                    <td>{exam.exam_date || "N/A"}</td>
                    <td>{exam.start_time || "N/A"}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(exam)}
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(exam.id)}
                      >
                        <FaTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center">
              No exams found for this instructor.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Exam Modal */}
      <Modal show={editModal} onHide={() => setEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={editExam.title}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={editExam.description}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="exam_date"
                    value={
                      editExam.exam_date
                        ? new Date(editExam.exam_date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleEditChange}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="start_time"
                    value={editExam.start_time}
                    onChange={handleEditChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateExam}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageExam;
