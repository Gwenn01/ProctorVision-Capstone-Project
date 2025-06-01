import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";

// Admin Pages
import CreateAccount from "./AdminDashboard/CreateAccount";
import ManageAccount from "./AdminDashboard/ManageAccount";
import ManageAdminExam from "./AdminDashboard/ManageExam";
import ManageBehavior from "./AdminDashboard/ManageBehavior";
// gmail verification
import VerifySuccess from "./VerifySuccess";

// Instructor Pages
import CreateExam from "./InstructorDashboard/CreateExam";
import ManageExam from "./InstructorDashboard/ManageExam";
import ManageStudentEnroll from "./InstructorDashboard/ManageStudentEnroll";
import StudentBehavior from "./InstructorDashboard/StudentBehavior";

// Student Pages
import TakeExam from "./StudentDashboard/TakeExam";
//import YourBehavior from "./StudentDashboard/YourBehavior";

const Dashboard = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const role = userData.role || "Student";
  const instructorId = userData.id || null;

  // Toggle state for small screens
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Container fluid>
      <Row className="flex-nowrap">
        {/* Sidebar */}
        <Col
          xs="auto"
          md={3}
          xl={2}
          className="px-sm-2 px-0 bg-dark text-white min-vh-100"
        >
          <button
            className="btn btn-outline-light d-md-none m-3"
            onClick={() => setIsOpen(!isOpen)}
          >
            ☰ Menu
          </button>
          {isOpen && <Sidebar role={role} />}
        </Col>

        {/* Main content */}
        <Col className="py-3 px-4">
          <Routes>
            {/* Public route (accessible without login) */}
            <Route path="/verify-success" element={<VerifySuccess />} />

            {/* Admin Routes */}
            {role === "Admin" && (
              <>
                <Route path="/" element={<CreateAccount />} />
                <Route path="create-account" element={<CreateAccount />} />
                <Route path="manage-account" element={<ManageAccount />} />
                <Route path="manage-admin-exam" element={<ManageAdminExam />} />
                <Route
                  path="manage-admin-behavior"
                  element={<ManageBehavior />}
                />
              </>
            )}

            {/* Instructor Routes */}
            {role === "Instructor" && (
              <>
                <Route
                  path="/"
                  element={<ManageStudentEnroll instructorId={instructorId} />}
                />
                <Route
                  path="manage-student"
                  element={<ManageStudentEnroll instructorId={instructorId} />}
                />
                <Route path="create-exam" element={<CreateExam />} />
                <Route path="manage-exam" element={<ManageExam />} />
                <Route path="student-behavior" element={<StudentBehavior />} />
              </>
            )}

            {/* Student Routes */}
            {role === "Student" && (
              <>
                <Route path="/" element={<TakeExam />} />
                <Route path="take-exam" element={<TakeExam />} />
              </>
            )}

            {/* Fallback */}
            <Route path="*" element={<h4>Page Not Found</h4>} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
