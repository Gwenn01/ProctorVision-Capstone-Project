import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Card,
  Form,
  Spinner,
  Tabs,
  Tab,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageExam = () => {
  const [exams, setExams] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: instructions state + saving flag
  const [examInstructions, setExamInstructions] = useState("");
  const [savingInstructions, setSavingInstructions] = useState(false);

  // NEW states for question editor
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const instructorId = userData.id;

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/exams-instructor/${instructorId}`
        );
        setExams(res.data.filter((e) => e.exam_type === "Exam"));
        setActivities(res.data.filter((e) => e.exam_type === "Activity"));
      } catch (err) {
        console.error("Failed to fetch exams", err);
      }
    };

    if (instructorId) fetchExams();
  }, [instructorId]);

  //  Fetch students, all students, questions, AND instructions
  const fetchExamData = async (examId) => {
    try {
      setLoading(true);

      const [enrolledRes, allRes, questionsRes, instrRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/exam_students/${examId}`),
        axios.get("http://localhost:5000/api/students"),
        axios.get(`http://localhost:5000/api/exam_questions/${examId}`),
        axios.get(`http://localhost:5000/api/exam_instructions/${examId}`, {
          //  allow 404 so Promise.all doesn't reject
          validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
        }),
      ]);

      setEnrolledStudents(enrolledRes.data);
      setAllStudents(allRes.data);
      setSelectedExam((prev) => ({ ...prev, questions: questionsRes.data }));

      // default to empty string if 404 or missing
      setExamInstructions(
        instrRes.status === 404 ? "" : instrRes?.data?.instructions ?? ""
      );
    } catch (err) {
      console.error("Failed to fetch exam data", err);
      setExamInstructions("");
    } finally {
      setLoading(false);
    }
  };

  const handleViewExam = (exam) => {
    setSelectedExam({ ...exam, questions: [] });
    fetchExamData(exam.id);
    setShowModal(true);
  };

  const handleDeleteExam = async (exam) => {
    const examId = exam.id;
    if (
      window.confirm(`Are you sure you want to delete this ${exam.exam_type}?`)
    ) {
      try {
        await axios.delete(`http://localhost:5000/api/exams/${examId}`);
        if (exam.exam_type === "Exam") {
          setExams((prev) => prev.filter((e) => e.id !== examId));
        } else {
          setActivities((prev) => prev.filter((e) => e.id !== examId));
        }
        toast.success(`${exam.exam_type} deleted successfully`);
      } catch (err) {
        console.error("Failed to delete", err);
        toast.error(`Failed to delete ${exam.exam_type}.`);
      }
    }
  };

  const handleAddStudent = async () => {
    const alreadyEnrolled = enrolledStudents.some(
      (student) => student.id.toString() === selectedStudent.toString()
    );

    if (alreadyEnrolled) {
      toast.warning("Student is already enrolled.");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/exam_students`, {
        exam_id: selectedExam.id,
        student_id: selectedStudent,
      });
      toast.success("Student added successfully");
      fetchExamData(selectedExam.id);
      setSelectedStudent("");
    } catch (err) {
      toast.error("Failed to add student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/exam_students/${selectedExam.id}/${studentId}`
      );
      toast.success("Student removed successfully");
      fetchExamData(selectedExam.id);
    } catch (err) {
      toast.error("Failed to remove student");
    }
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/update-exams/${selectedExam.id}`,
        {
          title: selectedExam.title,
          description: selectedExam.description,
          duration_minutes: selectedExam.duration_minutes,
          exam_date: selectedExam.exam_date,
          start_time: selectedExam.start_time,
        }
      );
      toast.success(`${selectedExam.exam_type} updated successfully!`);
      window.location.reload();
    } catch (err) {
      toast.error(`Failed to update ${selectedExam.exam_type}.`);
    }
  };

  // -----------------------------
  // Question Handlers
  // -----------------------------
  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/exam_questions/${questionId}`
      );
      toast.success("Question deleted");
      fetchExamData(selectedExam.id);
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      question_text: "",
      options: ["", ""],
      correct_answer: null,
    });
    setShowQuestionModal(true);
  };
  // handle instructions save
  const handleSaveInstructions = async () => {
    if (!selectedExam?.id) return;
    if (!examInstructions.trim()) {
      toast.error("Instructions cannot be empty.");
      return;
    }
    try {
      setSavingInstructions(true);
      await axios.put(
        `http://localhost:5000/api/exam_instructions/${selectedExam.id}`,
        { instructions: examInstructions }
      );
      toast.success("Instructions saved");
    } catch (err) {
      toast.error("Failed to save instructions");
    } finally {
      setSavingInstructions(false);
    }
  };

  const renderTable = (items, type) => (
    <Card className="shadow-sm border-0 p-3">
      <div className="table-responsive">
        <Table striped bordered hover className="align-middle mb-0">
          <thead className="table-dark text-center">
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Duration</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>File</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((exam) => (
                <tr key={exam.id}>
                  <td className="fw-semibold">{exam.title}</td>
                  <td>{exam.description}</td>
                  <td>{exam.duration_minutes} min</td>
                  <td>{exam.exam_date}</td>
                  <td>{exam.start_time}</td>
                  <td>
                    {exam.exam_file ? (
                      <a
                        href={`http://localhost:5000/${exam.exam_file.replaceAll(
                          "\\",
                          "/"
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View File
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewExam(exam)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteExam(exam)}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted">
                  No {type.toLowerCase()}s found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );

  const isMCQ = (selectedExam?.questions?.length || 0) > 0;

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      <ToastContainer autoClose={3000} />
      <h2 className="mb-4 fw-bold text-center text-md-start">
        <i className="bi bi-journal-bookmark-fill me-2"></i>
        Manage Exams & Activities
      </h2>

      {/* Tabs */}
      <Card className="shadow-lg border-0">
        <Card.Body>
          <Tabs
            defaultActiveKey="exams"
            id="exams-activities-tabs"
            className="mb-4 nav-justified"
          >
            <Tab
              eventKey="exams"
              title={
                <span className="fw-semibold">
                  <i className="bi bi-journal-text me-2"></i> Exams
                </span>
              }
            >
              {renderTable(exams, "Exam")}
            </Tab>
            <Tab
              eventKey="activities"
              title={
                <span className="fw-semibold">
                  <i className="bi bi-pencil-square me-2"></i> Activities
                </span>
              }
            >
              {renderTable(activities, "Activity")}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Exam Modal */}
      {selectedExam && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title>
              <i className="bi bi-info-circle me-2"></i>
              Edit {selectedExam.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
            {/* Exam Info */}
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={selectedExam.title}
                onChange={(e) =>
                  setSelectedExam({ ...selectedExam, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={selectedExam.description}
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={selectedExam.duration_minutes}
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={
                  selectedExam.exam_date
                    ? new Date(selectedExam.exam_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    exam_date: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={selectedExam.start_time || ""}
                onChange={(e) =>
                  setSelectedExam({
                    ...selectedExam,
                    start_time: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Button
              variant="primary"
              className="mb-3 w-100"
              onClick={handleSaveChanges}
            >
              <i className="bi bi-save me-1"></i> Save Changes
            </Button>

            {/* Students */}
            <h5 className="mt-4">Enrolled Students</h5>
            {loading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div
                className="mb-4"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                <ul className="list-group">
                  {enrolledStudents.map((student) => (
                    <li
                      key={student.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-bold">{student.name}</div>
                        <div className="text-muted small">{student.email}</div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        <i className="bi bi-x-circle me-1"></i>Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add Student */}
            <Form.Group controlId="searchStudent" className="mb-2">
              <Form.Control
                type="text"
                placeholder="Search student by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="addStudent" className="mt-1 mb-4">
              <Form.Label>Add Student</Form.Label>
              <Form.Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Select Student --</option>
                {allStudents
                  .filter((s) =>
                    `${s.name} ${s.email}`
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
              </Form.Select>
              <Button
                variant="success"
                className="mt-2 w-100"
                onClick={handleAddStudent}
                disabled={!selectedStudent}
              >
                <i className="bi bi-person-plus-fill me-1"></i>Add Student
              </Button>
            </Form.Group>

            {/* Exam Instructions */}
            <h5 className="mt-2">Exam Instructions</h5>
            {loading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : isMCQ ? (
              //  QA/MCQ: no instructions editor
              <Card className="border-0 bg-light">
                <Card.Body className="text-muted">
                  <i className="bi bi-list-check me-2"></i>
                  This is a <strong>Question & Answer</strong> exam. There are
                  no editable instructions. Students will answer the questions
                  below.
                  {selectedExam?.exam_file ? (
                    <>
                      {" "}
                      If needed, see the attached file:{" "}
                      <a
                        href={`http://localhost:5000/${String(
                          selectedExam.exam_file
                        ).replace(/\\/g, "/")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Attachment
                      </a>
                      .
                    </>
                  ) : (
                    ""
                  )}
                </Card.Body>
              </Card>
            ) : (
              //  CODING: show instructions editor
              <>
                <Form.Group className="mb-3">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Enter clear instructions for the exam"
                    value={examInstructions}
                    onChange={(e) => setExamInstructions(e.target.value)}
                  />
                </Form.Group>
                <div className="d-flex justify-content-end mb-3">
                  <Button
                    variant="outline-secondary"
                    onClick={handleSaveInstructions}
                    disabled={savingInstructions}
                  >
                    {savingInstructions ? (
                      <>
                        <Spinner
                          size="sm"
                          animation="border"
                          className="me-2"
                        />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-1"></i> Save Instructions
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Question Exam */}
            <h5 className="mt-4">Questions</h5>
            {loading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : isMCQ ? (
              <>
                <div
                  className="mb-4"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <ul className="list-group">
                    {(selectedExam?.questions || []).map((q, qIndex) => (
                      <li key={q.id || qIndex} className="list-group-item">
                        <div className="fw-bold">
                          {qIndex + 1}. {q.question_text}
                        </div>
                        <ul className="mb-2">
                          {(q.options || []).map((opt, i) => (
                            <li
                              key={opt.id || i}
                              style={{
                                fontWeight: opt.is_correct ? "bold" : "normal",
                                color: opt.is_correct ? "green" : "inherit",
                              }}
                            >
                              {opt.option_text}
                            </li>
                          ))}
                        </ul>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditQuestion(q)}
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="success"
                  className="w-100"
                  onClick={handleAddQuestion}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Question
                </Button>
              </>
            ) : (
              //  CODING: no MCQ list
              <Card className="border-0 bg-light">
                <Card.Body className="text-muted">
                  <i className="bi bi-code-square me-2"></i>
                  This is a <strong>CODING/Instruction</strong> exam. There are
                  no MCQ questions. Students will follow the instructions above.
                  {selectedExam?.exam_file ? (
                    <>
                      {" "}
                      See the attached file:{" "}
                      <a
                        href={`http://localhost:5000/${String(
                          selectedExam.exam_file
                        ).replace(/\\/g, "/")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Attachment
                      </a>
                      .
                    </>
                  ) : (
                    ""
                  )}
                </Card.Body>
              </Card>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Question Modal */}
      <Modal
        show={showQuestionModal}
        onHide={() => setShowQuestionModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingQuestion?.id ? "Edit Question" : "Add Question"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Question Text</Form.Label>
            <Form.Control
              type="text"
              value={editingQuestion?.question_text || ""}
              onChange={(e) =>
                setEditingQuestion({
                  ...editingQuestion,
                  question_text: e.target.value,
                })
              }
            />
          </Form.Group>

          {editingQuestion?.options?.map((opt, i) => (
            <div key={i} className="d-flex align-items-center mb-2 gap-2">
              <Form.Control
                type="text"
                value={opt.option_text}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => {
                  const newOptions = [...editingQuestion.options];
                  newOptions[i] = e.target.value;
                  setEditingQuestion({
                    ...editingQuestion,
                    options: newOptions,
                  });
                }}
              />
              <Form.Check
                type="radio"
                name="correct"
                checked={editingQuestion.correct_answer === i}
                onChange={() =>
                  setEditingQuestion({
                    ...editingQuestion,
                    correct_answer: i,
                  })
                }
                label="Correct"
              />
            </div>
          ))}

          <Button
            size="sm"
            variant="outline-primary"
            onClick={() =>
              setEditingQuestion({
                ...editingQuestion,
                options: [...editingQuestion.options, ""],
              })
            }
          >
            <i className="bi bi-plus-circle me-1"></i> Add Option
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowQuestionModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                if (editingQuestion.id) {
                  await axios.put(
                    `http://localhost:5000/api/exam_questions/${editingQuestion.id}`,
                    editingQuestion
                  );
                  toast.success("Question updated");
                } else {
                  await axios.post(`http://localhost:5000/api/exam_questions`, {
                    ...editingQuestion,
                    exam_id: selectedExam.id,
                  });
                  toast.success("Question added");
                }
                setShowQuestionModal(false);
                fetchExamData(selectedExam.id);
              } catch (err) {
                toast.error("Failed to save question");
              }
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageExam;
