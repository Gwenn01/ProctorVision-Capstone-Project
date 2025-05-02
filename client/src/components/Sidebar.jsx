import React from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/prmsu-logo.png";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
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
      { href: "your-behavior", icon: "bar-chart", label: "Exam Behavior" },
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
    <div className="d-flex flex-column text-white min-vh-100 p-3 gap-3">
      {/* Logo and Title */}
      <div className="text-center">
        <img
          src={logo}
          alt="Logo"
          style={{ width: "60px", height: "60px" }}
          className="mb-2"
        />
        <h5 className="fw-bold mb-0">{panelTitle}</h5>
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
