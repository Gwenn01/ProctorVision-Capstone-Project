import React, { useState } from "react";
import { Container, Button, Form, Card } from "react-bootstrap";
import "../styles/loginpage.css";

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center vh-100">
      {!selectedRole ? (
        <div className="text-center role-button">
          <h2 className="mb-4">Select Your Role</h2>
          <div className="d-flex gap-3 button-container">
            <Button
              className="buttons"
              variant="primary"
              onClick={() => setSelectedRole("Admin")}
            >
              Admin
            </Button>
            <Button
              className="buttons"
              variant="primary"
              onClick={() => setSelectedRole("Instructor")}
            >
              Instructor
            </Button>
            <Button
              className="buttons"
              variant="primary"
              onClick={() => setSelectedRole("Student")}
            >
              Student
            </Button>
          </div>
        </div>
      ) : (
        <Card className="shadow-lg border-0 p-4" style={{ width: "24rem" }}>
          <Card.Body>
            <Card.Title className="text-center mb-3 fw-bold fs-4">
              {selectedRole} Login
            </Card.Title>
            <Form className="mb-4">
              <Form.Group className="mb-1">
                <Form.Label className="fw-semibold d-flex">Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  className="py-2"
                />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label className="fw-semibold d-flex">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  className="py-2"
                />
              </Form.Group>
            </Form>
            <Button variant="dark" className="w-100 py-2 mt-2" type="submit">
              Login
            </Button>
            <Button
              variant="secondary"
              className="w-100 py-2 mt-3"
              onClick={() => setSelectedRole(null)}
            >
              Back
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default LoginPage;
