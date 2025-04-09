import React, { useState } from "react";
import { Container, Card, Button, Form } from "react-bootstrap";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUser,
  FaEnvelope,
  FaKey,
  FaIdBadge,
  FaHashtag,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner"; // Make sure this Spinner component exists

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    <Container className="d-flex flex-column align-items-center justify-content-center mt-4">
      <ToastContainer />
      <Card className="shadow-lg border-0 p-4" style={{ width: "30rem" }}>
        <Card.Body>
          <Card.Title className="text-center mb-3 fw-bold fs-4">
            Create Account
          </Card.Title>

          {!userType ? (
            <>
              <p className="text-center">
                Select the type of account you want to create:
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button
                  variant="primary"
                  className="d-flex align-items-center"
                  onClick={() => setUserType("Student")}
                >
                  <FaUserGraduate className="me-2" /> Student
                </Button>
                <Button
                  variant="success"
                  className="d-flex align-items-center"
                  onClick={() => setUserType("Instructor")}
                >
                  <FaChalkboardTeacher className="me-2" /> Instructor
                </Button>
              </div>
            </>
          ) : loading ? (
            <div className="text-center mt-3">
              <Spinner /> {/* Reuse your Spinner component */}
              <p className="mt-2">Creating account...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <p className="text-center">
                Creating a <strong>{userType}</strong> account
              </p>

              <Form.Group className="mb-3">
                <Form.Label>
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
                <Form.Label>
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
                <Form.Label>
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
                <Form.Label>
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

              <Form.Group className="mb-3">
                <Form.Label>
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

              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={() => setUserType(null)}>
                  Back
                </Button>
                <Button variant="dark" type="submit">
                  Create Account
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateAccount;
