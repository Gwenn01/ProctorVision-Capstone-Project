import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
// this is for admin
import CreateAccount from "./AdminDashboard/CreateAccount";
import ManageAccount from "./AdminDashboard/ManageAccount";
// this is for instructor
import CreateExam from "./InstructorDashboard/CreateExam";
import ManageExam from "./InstructorDashboard/ManageExam";
import ManageStudentEnroll from "./InstructorDashboard/ManageStudentEnroll";
import StudentBehavior from "./InstructorDashboard/StudentBehavior";
// this is for student
import TakeExam from "./StudentDashboard/TakeExam";
import YourBehavior from "./StudentDashboard/YourBehavior";

const Dashboard = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const role = userData.role || "Student";
  const instructorId = userData.id || null;

  return (
    <Container fluid>
      <Row>
        <Col md={2} className="bg-dark text-white">
          <Sidebar role={role} />
        </Col>
        <Col md={10} className="dashboard-content">
          <div className="p-4">
            <Routes>
              {role === "Admin" && (
                <>
                  <Route path="/" element={<CreateAccount />} />
                  <Route path="create-account" element={<CreateAccount />} />
                  <Route path="manage-account" element={<ManageAccount />} />
                </>
              )}
              {role === "Instructor" && (
                <>
                  <Route
                    path="/"
                    element={
                      <ManageStudentEnroll instructorId={instructorId} />
                    }
                  />
                  <Route
                    path="manage-student"
                    element={
                      <ManageStudentEnroll instructorId={instructorId} />
                    }
                  />
                  <Route path="create-exam" element={<CreateExam />} />
                  <Route path="manage-exam" element={<ManageExam />} />
                  <Route
                    path="student-behavior"
                    element={<StudentBehavior />}
                  />
                </>
              )}
              {role === "Student" && (
                <>
                  <Route path="/" element={<TakeExam />} />{" "}
                  <Route path="take-exam" element={<TakeExam />} />{" "}
                  <Route path="your-behavior" element={<YourBehavior />} />{" "}
                </>
              )}
              <Route path="*" element={<h4>Page Not Found</h4>} />
            </Routes>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
