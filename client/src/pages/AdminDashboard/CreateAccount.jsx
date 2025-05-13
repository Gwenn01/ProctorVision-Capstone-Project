import React, { useState } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  Spinner,
  Row,
  Col,
  InputGroup,
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
  FaGraduationCap,
  FaLayerGroup,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAccount = () => {
  const [userType, setUserType] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    password: "",
    course: "",
    section: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (userType === "Student" && (!formData.course || !formData.section)) {
      toast.error("Please select both course and section.");
      setLoading(false);
      return;
    }

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
          course: "",
          section: "",
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
                <Form.Label className="fw-semibold">ID</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaHashtag />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Enter user ID"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Full Name</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaUser />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Enter full name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Username</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaIdBadge />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Email Address</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaEnvelope />
                  </InputGroup.Text>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Password</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaKey />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
              </Form.Group>

              {userType === "Student" && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <FaGraduationCap className="me-2" />
                      Course
                    </Form.Label>
                    <Form.Select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Course --</option>
                      <option value="BS Information Technology">
                        BS Information Technology
                      </option>
                      <option value="BS Computer Science">
                        BS Computer Science
                      </option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <FaLayerGroup className="me-2" />
                      Section
                    </Form.Label>
                    <Form.Select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Section --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                    </Form.Select>
                  </Form.Group>
                </>
              )}

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
