import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Modal,
  Row,
  Col,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import {
  FaUsersCog,
  FaUserEdit,
  FaTrash,
  FaUser,
  FaIdBadge,
  FaEnvelope,
} from "react-icons/fa";
import {
  FaLayerGroup,
  FaGraduationCap,
  FaStream,
  FaCheckCircle,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch } from "react-icons/fa";

const ManageAccount = () => {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("Student");
  const [searchText, setSearchText] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users?role=${filterRole}`
      );
      let sorted = res.data;

      if (filterRole === "Student") {
        sorted = res.data.sort((a, b) => {
          const yearOrder = [
            "1st Year",
            "2nd Year",
            "3rd Year",
            "4th Year",
            "5th Year",
          ];
          const sectionOrder = ["A", "B", "C", "D", "E", "F"];

          const yearDiff =
            yearOrder.indexOf(a.year) - yearOrder.indexOf(b.year);
          if (yearDiff !== 0) return yearDiff;

          return (
            sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section)
          );
        });
      }

      setUsers(sorted);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser.id}`,
        selectedUser
      );
      fetchUsers();
      setShowModal(false);
      toast.success("User updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchUsers();
        toast.success("User deleted successfully!");
      } catch (err) {
        console.error("Delete failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredUsers = users
    .filter((user) =>
      `${user.name} ${user.username}`.toLowerCase().includes(searchText)
    )
    .filter((user) =>
      filterRole !== "Student"
        ? true
        : (!filterCourse || user.course === filterCourse) &&
          (!filterYear || user.year === filterYear) &&
          (!filterSection || user.section === filterSection) &&
          (!filterStatus || user.status === filterStatus)
    );

  return (
    <Container className="mt-5">
      <ToastContainer />
      <div className="d-flex align-items-center mb-4">
        <FaUsersCog size={28} className="me-2 text-dark" />
        <h3 className="fw-bold mb-0">Manage Accounts</h3>
      </div>

      <div className="d-flex flex-wrap gap-3 mb-3">
        <Button
          variant={filterRole === "Student" ? "dark" : "outline-dark"}
          onClick={() => setFilterRole("Student")}
        >
          Student
        </Button>
        <Button
          variant={filterRole === "Instructor" ? "dark" : "outline-dark"}
          onClick={() => setFilterRole("Instructor")}
        >
          Instructor
        </Button>
      </div>

      <Form className="mb-4">
        <Row className="g-3">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by name or username..."
                className="border-start-0"
                onChange={(e) => setSearchText(e.target.value.toLowerCase())}
              />
            </InputGroup>
          </Col>

          {filterRole === "Student" && (
            <>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaGraduationCap className="text-muted" />
                  </InputGroup.Text>
                  <Form.Select
                    className="border-start-0"
                    onChange={(e) => setFilterCourse(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    <option value="BS Information Technology">
                      BS Information Technology
                    </option>
                    <option value="BS Computer Science">
                      BS Computer Science
                    </option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaLayerGroup className="text-muted" />
                  </InputGroup.Text>
                  <Form.Select
                    className="border-start-0"
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaStream className="text-muted" />
                  </InputGroup.Text>
                  <Form.Select
                    className="border-start-0"
                    onChange={(e) => setFilterSection(e.target.value)}
                  >
                    <option value="">All Sections</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaCheckCircle className="text-muted" />
                  </InputGroup.Text>
                  <Form.Select
                    className="border-start-0"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </>
          )}
        </Row>
      </Form>
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="dark" />
          <p className="mt-2 text-muted">Loading data...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-dark text-center">
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              {filterRole === "Student" && (
                <>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Section</th>
                  <th>Status</th>
                </>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="align-middle text-center">
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  {user.role === "Student" && (
                    <>
                      <td>{user.course}</td>
                      <td>{user.year}</td>
                      <td>{user.section}</td>
                      <td>{user.status}</td>
                    </>
                  )}
                  <td>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(user)}
                    >
                      <FaUserEdit className="me-1" /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <FaTrash className="me-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserEdit className="me-2" /> Edit User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-2" /> Name
                </Form.Label>
                <Form.Control
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaIdBadge className="me-2" /> Username
                </Form.Label>
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
                <Form.Label>
                  <FaEnvelope className="me-2" /> Email
                </Form.Label>
                <Form.Control
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      email: e.target.value,
                    })
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
          <Button variant="dark" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageAccount;
