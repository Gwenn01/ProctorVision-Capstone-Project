import React, { useEffect, useState } from "react";
import {
  Container,
  Form,
  Button,
  Modal,
  Table,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { FaChalkboardTeacher, FaEdit, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageExam = () => {
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editExam, setEditExam] = useState({
    id: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/instructors");
      setInstructors(res.data);
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
    });
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditExam({ ...editExam, [e.target.name]: e.target.value });
  };

  const handleUpdateExam = async () => {
    try {
      await axios.put(`http://localhost:5000/api/exams/${editExam.id}`, {
        title: editExam.title,
        description: editExam.description,
      });

      toast.success("Exam updated successfully!");
      setEditModal(false);

      // Refresh exams list
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

      <Form.Group controlId="instructorSelect" className="mb-4">
        <Form.Label>Select Instructor</Form.Label>
        <Form.Select
          value={selectedInstructor}
          onChange={handleInstructorSelect}
        >
          <option value="">-- Choose Instructor --</option>
          {instructors.map((instructor) => (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{exam.description}</td>
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
