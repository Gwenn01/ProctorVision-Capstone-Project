import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Spinner as BS_Spinner,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";

const ManageStudentEnroll = ({ instructorId }) => {
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (instructorId) {
      fetchAllStudents();
      fetchEnrolledStudents();
    }
  }, [instructorId]);

  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/enrolled-students/${instructorId}`
      );
      setEnrolledStudents(res.data);
    } catch (err) {
      toast.error("Failed to load enrolled students.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/all-students");
      setAllStudents(res.data);
    } catch (err) {
      toast.error("Failed to load all students.");
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudentId) return;
    try {
      setAssigning(true);
      const res = await axios.post("http://localhost:5000/api/assign-student", {
        instructor_id: instructorId,
        student_id: selectedStudentId,
      });

      if (res.status === 201) {
        toast.success("Student assigned successfully!");
        fetchEnrolledStudents();
        fetchAllStudents();
        setSelectedStudentId("");
      } else {
        toast.warn(res.data.message || "Student already assigned.");
      }
    } catch (err) {
      toast.error("Assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    try {
      setAssigning(true);
      const res = await axios.post(
        "http://localhost:5000/api/unassign-student",
        {
          instructor_id: instructorId,
          student_id: studentId,
        }
      );

      if (res.status === 200) {
        toast.success("Student unassigned successfully!");
        fetchEnrolledStudents();
        fetchAllStudents();
      }
    } catch (err) {
      toast.error("Unassignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Container className="mt-4">
      <ToastContainer autoClose={3000} position="top-right" />

      <h2 className="mb-4">Manage Student Enrollment</h2>

      {/* Assign Dropdown */}
      <Form.Group className="mb-3">
        <Form.Label>Assign Existing Student</Form.Label>
        <div className="d-flex align-items-center">
          <Form.Select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={assigning}
          >
            <option value="">Select a student</option>
            {allStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.username})
              </option>
            ))}
          </Form.Select>
          <Button
            variant="success"
            className="ms-2"
            onClick={handleAssignStudent}
            disabled={assigning}
          >
            {assigning ? (
              <>
                <BS_Spinner size="sm" animation="border" className="me-1" />
                Assigning...
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </div>
      </Form.Group>

      {/* Enrolled Students Table */}
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner />
        </div>
      ) : (
        <Table striped bordered hover>
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrolledStudents.length > 0 ? (
              enrolledStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.username}</td>
                  <td>{student.email}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={assigning}
                      onClick={() => handleUnassignStudent(student.id)}
                    >
                      {assigning ? (
                        <BS_Spinner size="sm" animation="border" />
                      ) : (
                        "Unassign"
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No students enrolled.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default ManageStudentEnroll;
