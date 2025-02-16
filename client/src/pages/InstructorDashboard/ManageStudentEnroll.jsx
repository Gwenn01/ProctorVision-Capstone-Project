import React, { useState } from "react";
import { Container, Table, Button, Modal, Form } from "react-bootstrap";

const ManageStudentEnroll = () => {
  // Sample data for enrolled students
  const initialStudents = [
    {
      id: 1,
      name: "Arnel Gwen Nuqui",
      username: "gwen",
      email: "gwenn@example.com",
      password: "password123",
    },
    {
      id: 2,
      name: "Neriz Sisgon",
      username: "neriz",
      email: "neriz@example.com",
      password: "nerizepass",
    },
  ];

  // Sample data for all students who have an account but are not enrolled
  const allStudents = [
    {
      id: 3,
      name: "Alexander Orcino",
      username: "alex",
      email: "alex@example.com",
    },
    {
      id: 4,
      name: "PeterJames Marteja",
      username: "pits",
      email: "pits@example.com",
    },
  ];

  const [students, setStudents] = useState(initialStudents);
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [selectedExistingStudent, setSelectedExistingStudent] = useState("");

  // Handle adding a new student manually
  const handleAddStudent = () => {
    if (
      !newStudent.name ||
      !newStudent.username ||
      !newStudent.email ||
      !newStudent.password
    ) {
      alert("Please fill in all student details.");
      return;
    }
    setStudents([...students, { ...newStudent, id: students.length + 1 }]);
    setShowModal(false);
    setNewStudent({ name: "", username: "", email: "", password: "" }); // Reset form
  };

  // Handle adding an existing student from the dropdown
  const handleAddExistingStudent = () => {
    if (!selectedExistingStudent) {
      alert("Please select a student to add.");
      return;
    }
    const studentToAdd = allStudents.find(
      (s) => s.id === parseInt(selectedExistingStudent)
    );
    if (studentToAdd) {
      setStudents([
        ...students,
        { ...studentToAdd, password: "defaultPassword" },
      ]); // Set a default password
      setSelectedExistingStudent("");
    }
  };

  // Handle removing a student
  const handleRemoveStudent = (id) => {
    if (window.confirm("Are you sure you want to remove this student?")) {
      setStudents(students.filter((student) => student.id !== id));
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Manage Student Enrollment</h2>

      {/* Add Student Manually */}
      <Button
        variant="primary"
        className="mb-3"
        onClick={() => setShowModal(true)}
      >
        + Add Student Manually
      </Button>

      {/* Add Existing Student Dropdown */}
      <Form.Group className="mb-3">
        <Form.Label>Add Existing Student</Form.Label>
        <div className="d-flex">
          <Form.Select
            value={selectedExistingStudent}
            onChange={(e) => setSelectedExistingStudent(e.target.value)}
          >
            <option value="">Select a student</option>
            {allStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.username})
              </option>
            ))}
          </Form.Select>
          <Button
            variant="success"
            className="ms-2"
            onClick={handleAddExistingStudent}
          >
            Add
          </Button>
        </div>
      </Form.Group>

      {/* Table Displaying Enrolled Students */}
      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Password</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.username}</td>
                <td>{student.email}</td>
                <td>{student.password}</td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveStudent(student.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No students enrolled
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add Student Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Student Manually</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter full name"
                value={newStudent.name}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={newStudent.username}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, username: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={newStudent.email}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, email: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={newStudent.password}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, password: e.target.value })
                }
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddStudent}>
            Add Student
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageStudentEnroll;
