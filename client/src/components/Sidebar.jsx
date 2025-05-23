import React from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/prmsu-logo.png";
import axios from "axios";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userData = JSON.parse(localStorage.getItem("userData"));
  const username = userData?.username || "Unknown";

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("userData"));
    const token = localStorage.getItem("token");

    if (user?.role === "Student") {
      try {
        await axios.post(
          "http://localhost:5000/api/logout",
          { student_id: user.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Logout API failed:", error);
      }
    }

    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully!", { autoClose: 2000 });
    setTimeout(() => navigate("/login", { replace: true }), 1000);
  };

  const menuItems = {
    Admin: [
      { href: "create-account", icon: "people", label: "Create Account" },
      { href: "manage-account", icon: "gear", label: "Manage Account" },
      {
        href: "manage-admin-exam",
        icon: "clipboard-data",
        label: "Manage Exam",
      },
      {
        href: "manage-admin-behavior",
        icon: "activity",
        label: "Manage Behavior",
      },
    ],
    Instructor: [
      { href: "manage-student", icon: "person", label: "Manage Student" },
      { href: "create-exam", icon: "book", label: "Exam Setup" },
      { href: "manage-exam", icon: "chat", label: "Manage Exam" },
      {
        href: "student-behavior",
        icon: "bar-chart",
        label: "Student Behavior",
      },
    ],
    Student: [
      { href: "take-exam", icon: "book", label: "Take Exam" },
      //{ href: "your-behavior", icon: "bar-chart", label: "Exam Behavior" },
    ],
  };

  const panelTitle =
    role === "Admin"
      ? "Admin Panel"
      : role === "Instructor"
      ? "Instructor Panel"
      : "Student Dashboard";

  const links = menuItems[role] || menuItems.Student;

  return (
    <div
      className="d-flex flex-column text-white p-3 gap-3 bg-dark"
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: "240px",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      {/* Logo and Title */}
      <div className="text-center">
        <img
          src={logo}
          alt="Logo"
          style={{ width: "60px", height: "60px" }}
          className="mb-2"
        />
        <div className="mt-2">
          <h5 className="fw-bold mb-1 text-white">{panelTitle}</h5>
          <div className="d-flex justify-content-center align-items-center gap-1">
            <i className="bi bi-person-circle text-white fs-5"></i>
            <span
              className="text-white fst-italic"
              style={{ fontSize: "0.9rem" }}
            >
              Welcome, <span className="fw-semibold">{username}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <Nav className="flex-column gap-2">
        {links.map((link, index) => (
          <Nav.Item key={index}>
            <Link
              to={`/dashboard/${link.href}`}
              className={`nav-link text-white d-flex align-items-center px-3 py-2 rounded ${
                location.pathname.includes(link.href)
                  ? "bg-primary"
                  : "hover-dark"
              }`}
              style={{ transition: "all 0.3s ease" }}
            >
              <i className={`bi bi-${link.icon} me-2 fs-5`}></i>
              {link.label}
            </Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* Logout */}
      <div className="mt-auto">
        <Nav.Item>
          <span
            role="button"
            onClick={handleLogout}
            className="nav-link text-white d-flex align-items-center px-3 py-2 rounded bg-danger bg-opacity-75"
          >
            <i className="bi bi-box-arrow-right me-2 fs-5"></i> Logout
          </span>
        </Nav.Item>
      </div>
    </div>
  );
};

export default Sidebar;
