import React, { useState } from "react";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";

const CreateExam = () => {
  let data = {
    title: "Activities",
    description: "",
    time: 20,
    year: "",
    section: "",
    students: [],
  };

  const [examData, setExamData] = useState(data);
  const [isExamCreated, setIsExamCreated] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(""); // Selected student from the list
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  // List of predefined students
  const studentList = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Michael Johnson" },
    { id: 4, name: "Emily Brown" },
    { id: 5, name: "Chris Evans" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData((prevData) => ({
      ...prevData,
      [name]: name === "time" ? parseInt(value) : value,
    }));
  };

  // Add a student to the enrolled list
  const handleAddStudent = () => {
    if (!selectedStudent) return;

    // Find the student object by ID
    const studentToAdd = studentList.find(
      (s) => s.id.toString() === selectedStudent
    );

    // Prevent duplicates
    if (enrolledStudents.some((s) => s.id === studentToAdd.id)) {
      alert("Student is already enrolled.");
      return;
    }

    setEnrolledStudents([...enrolledStudents, studentToAdd]);
    setSelectedStudent("");
  };

  // Remove a student from the enrolled list
  const handleRemoveStudent = (id) => {
    setEnrolledStudents(enrolledStudents.filter((s) => s.id !== id));
  };

  const handleCreateExam = () => {
    if (
      !examData.title ||
      !examData.description ||
      examData.time <= 0 ||
      !examData.year ||
      !examData.section
    ) {
      alert("Please fill in all fields correctly.");
      return;
    }
    setIsExamCreated(true);
  };

  const handleSaveExam = () => {
    const finalExamData = { ...examData, students: enrolledStudents };
    alert("Exam Saved with Enrolled Students!");
    console.log(finalExamData);
  };

  return (
    <Container className="mt-4">
      <Card className="shadow-lg p-4">
        <Card.Body>
          <h2 className="text-center mb-3">Exam Setup</h2>

          {!isExamCreated ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Exam Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={examData.title}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Exam Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  placeholder="Enter description"
                  value={examData.description}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Exam Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="time"
                  min="1"
                  value={examData.time}
                  onChange={handleChange}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Year Level</Form.Label>
                    <Form.Select
                      name="year"
                      value={examData.year}
                      onChange={handleChange}
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <Form.Select
                      name="section"
                      value={examData.section}
                      onChange={handleChange}
                    >
                      <option value="">Select Section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Button
                variant="success"
                className="w-100"
                onClick={handleCreateExam}
              >
                Create Exam
              </Button>
            </>
          ) : (
            <>
              <h4 className="mb-3">Exam: {examData.title}</h4>
              <p>
                <strong>Description:</strong> {examData.description}
              </p>
              <p>
                <strong>Duration:</strong> {examData.time} minutes
              </p>
              <p>
                <strong>Year Level:</strong> {examData.year}
              </p>
              <p>
                <strong>Section:</strong> {examData.section}
              </p>

              {/* Student Enrollment */}
              <h5 className="mt-4">Enroll Students</h5>
              <Row>
                <Col md={8}>
                  <Form.Select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  >
                    <option value="">Select Student</option>
                    {studentList.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Button variant="primary" onClick={handleAddStudent}>
                    Add Student
                  </Button>
                </Col>
              </Row>

              {/* Enrolled Students List */}
              {enrolledStudents.length > 0 && (
                <Card className="mt-3 p-3">
                  <h6>Enrolled Students:</h6>
                  <ul className="list-group">
                    {enrolledStudents.map((student) => (
                      <li
                        key={student.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {student.name}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Button
                variant="success"
                className="mt-3"
                onClick={handleSaveExam}
              >
                Save Exam
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateExam;
