import React, { useState } from "react";
import { Container, Table, Button, Form, Modal } from "react-bootstrap";

const ManageAccount = () => {
  // Sample user data (Replace this with backend data)
  const initialUsers = [
    {
      id: 1,
      role: "Student",
      name: "John Doe",
      username: "johndoe",
      email: "johndoe@example.com",
    },
    {
      id: 2,
      role: "Instructor",
      name: "Jane Smith",
      username: "janesmith",
      email: "janesmith@example.com",
    },
    {
      id: 3,
      role: "Student",
      name: "Alice Johnson",
      username: "alicej",
      email: "alicej@example.com",
    },
    {
      id: 4,
      role: "Instructor",
      name: "Bob Brown",
      username: "bobb",
      email: "bobb@example.com",
    },
  ];

  const [users, setUsers] = useState(initialUsers);
  const [filterRole, setFilterRole] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Handle dropdown change
  const handleFilterChange = (e) => {
    setFilterRole(e.target.value);
  };

  // Open Edit Modal
  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Handle Save Changes in Modal
  const handleSaveChanges = () => {
    setUsers(
      users.map((user) => (user.id === selectedUser.id ? selectedUser : user))
    );
    setShowModal(false);
  };

  // Handle Delete User
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  // Filter Users Based on Dropdown Selection
  const filteredUsers =
    filterRole === "All"
      ? users
      : users.filter((user) => user.role === filterRole);

  return (
    <Container>
      <h2 className="mb-4">Manage Account</h2>

      {/* Dropdown for filtering */}
      <Form.Group className="mb-3">
        <Form.Label>Filter by Role:</Form.Label>
        <Form.Select value={filterRole} onChange={handleFilterChange}>
          <option value="All">All</option>
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
        </Form.Select>
      </Form.Group>

      {/* Table for Users */}
      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Role</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.role}</td>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Edit User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedUser.username}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      username: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageAccount;
