import React, { useState } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUser,
  FaEnvelope,
  FaKey,
  FaIdBadge,
  FaHashtag,
  FaUserCircle,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAccount = () => {
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/create_account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, userType }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setUserType(null);
        setFormData({
          id: "",
          name: "",
          username: "",
          email: "",
          password: "",
        });
      } else {
        toast.error(result.error || "Failed to create account.");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Server error: Failed to connect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <ToastContainer />
      <Card
        className="shadow-lg p-4 rounded-4 w-100"
        style={{ maxWidth: "600px" }}
      >
        <Card.Body>
          {/* Top Icon */}
          <div className="text-center mb-3">
            <FaUserCircle size={64} className="text-dark mb-2" />
            <Card.Title className="fw-bold fs-3 text-dark">
              Create Account
            </Card.Title>
          </div>

          {!userType ? (
            <>
              <p className="text-center text-muted mb-3">
                Select the type of account you want to create:
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button
                  variant="outline-dark"
                  className="d-flex align-items-center"
                  onClick={() => setUserType("Student")}
                >
                  <FaUserGraduate className="me-2" /> Student
                </Button>
                <Button
                  variant="outline-dark"
                  className="d-flex align-items-center"
                  onClick={() => setUserType("Instructor")}
                >
                  <FaChalkboardTeacher className="me-2" /> Instructor
                </Button>
              </div>
            </>
          ) : loading ? (
            <div className="text-center mt-4">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2 text-muted">Creating account...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <p className="text-center text-muted mb-4">
                Creating a <strong>{userType}</strong> account
              </p>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaHashtag className="me-2" /> ID
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter user ID"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaUser className="me-2" /> Full Name
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter full name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaIdBadge className="me-2" /> Username
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaEnvelope className="me-2" /> Email Address
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <FaKey className="me-2" /> Password
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Row>
                <Col className="text-start">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setUserType(null)}
                  >
                    Back
                  </Button>
                </Col>
                <Col className="text-end">
                  <Button variant="dark" type="submit">
                    Create Account
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateAccount;
