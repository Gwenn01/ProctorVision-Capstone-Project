import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Spinner as BsSpinner,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import { Modal } from "react-bootstrap";

const ManageStudentEnroll = ({ instructorId }) => {
  const [groupedEnrolled, setGroupedEnrolled] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filters, setFilters] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGroupView, setSelectedGroupView] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [showFilteredModal, setShowFilteredModal] = useState(false);

  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/all-students");
      setAllStudents(res.data);
    } catch (err) {
      toast.error("Failed to load all students.");
    }
  }, []);

  const fetchEnrolledStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/enrolled-students/${instructorId}`
      );
      groupStudents(res.data);
    } catch (err) {
      toast.error("Failed to load enrolled students.");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/student-filters");
      setFilters(res.data);
    } catch (err) {
      toast.error("Failed to load filter options.");
    }
  }, []);

  useEffect(() => {
    if (instructorId) {
      fetchAllStudents();
      fetchEnrolledStudents();
      fetchFilters();
    }
  }, [instructorId, fetchAllStudents, fetchEnrolledStudents, fetchFilters]);

  const groupStudents = (students) => {
    const map = new Map();
    students.forEach((s) => {
      const key = `${s.course}||${s.year}||${s.section}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    const result = Array.from(map.entries()).map(([key, list]) => {
      const [course, year, section] = key.split("||");
      return { course, year, section, students: list };
    });
    setGroupedEnrolled(result);
  };

  const availableCourses = [...new Set(filters.map((f) => f.course))];
  const availableSections = [
    ...new Set(
      filters.filter((f) => f.course === selectedCourse).map((f) => f.section)
    ),
  ];
  const availableYears = [
    ...new Set(
      filters
        .filter(
          (f) => f.course === selectedCourse && f.section === selectedSection
        )
        .map((f) => f.year)
    ),
  ];

  const handleViewFiltered = () => {
    if (!selectedCourse || !selectedSection || !selectedYear) {
      toast.warn("Please select all fields.");
      return;
    }
    const matches = allStudents.filter(
      (s) =>
        s.course === selectedCourse &&
        s.section === selectedSection &&
        s.year === selectedYear
    );
    setFilteredStudents(matches);
    setViewing(true);
    setShowFilteredModal(true);
  };

  const handleBulkAssign = async () => {
    if (!selectedCourse || !selectedSection || !selectedYear) {
      toast.warn("Please select all fields.");
      return;
    }
    try {
      setAssigning(true);
      const res = await axios.post(
        "http://localhost:5000/api/assign-students-group",
        {
          instructor_id: instructorId,
          course: selectedCourse,
          section: selectedSection,
          year: selectedYear,
        }
      );

      if (res.status === 201) {
        toast.success("Students assigned successfully!");
        fetchEnrolledStudents();
        fetchAllStudents();
        setFilteredStudents([]);
        setViewing(false);
      } else {
        toast.warn(
          res.data.message || "Some students may already be assigned."
        );
      }
    } catch (err) {
      toast.error("Bulk assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      <ToastContainer autoClose={3000} position="top-right" />
      <h2 className="mb-4 fw-bold text-center text-md-start">
        <i className="bi bi-person-plus-fill me-2"></i>
        Manage Student Enrollment
      </h2>

      {/* Filter Assign Section */}
      <Row className="justify-content-center mb-3">
        <Col xs={12} md={10} lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="fw-bold mb-3">Assign by Course, Section & Year</h6>
              <Row className="g-2 mb-2">
                <Col>
                  <Form.Select
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setSelectedSection("");
                      setSelectedYear("");
                      setViewing(false);
                    }}
                  >
                    <option value="">Select Course</option>
                    {availableCourses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedYear("");
                      setViewing(false);
                    }}
                    disabled={!selectedCourse}
                  >
                    <option value="">Select Section</option>
                    {availableSections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={!selectedSection}
                  >
                    <option value="">Select Year</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
              <div className="d-flex gap-2">
                <Button variant="info" onClick={handleViewFiltered}>
                  View Students
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkAssign}
                  disabled={
                    assigning || !viewing || filteredStudents.length === 0
                  }
                >
                  {assigning ? (
                    <>
                      <BsSpinner
                        size="sm"
                        animation="border"
                        className="me-1"
                      />
                      Assigning...
                    </>
                  ) : (
                    "Assign All"
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showFilteredModal}
        onHide={() => setShowFilteredModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold">
            Filtered Students – {selectedCourse} {selectedYear}{" "}
            {selectedSection}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.username}</td>
                      <td>{s.email}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No matching students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowFilteredModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enrolled Grouped Table */}
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner />
        </div>
      ) : (
        <Card className="shadow-sm border-0 mt-4">
          <Card.Body>
            <h5 className="fw-semibold mb-3">Enrolled Students</h5>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Section</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedEnrolled.length > 0 ? (
                    groupedEnrolled.map((group, idx) => (
                      <tr key={idx}>
                        <td>{group.course}</td>
                        <td>{group.year}</td>
                        <td>{group.section}</td>
                        <td className="text-center">
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => setSelectedGroupView(group)}
                          >
                            View Students
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No enrolled student groups.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal
        show={!!selectedGroupView}
        onHide={() => setSelectedGroupView(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold">
            Students in {selectedGroupView?.course} {selectedGroupView?.year}{" "}
            {selectedGroupView?.section}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroupView?.students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.name}</td>
                    <td>{s.username}</td>
                    <td>{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setSelectedGroupView(null)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageStudentEnroll;
