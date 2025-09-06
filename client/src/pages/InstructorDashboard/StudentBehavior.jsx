import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Modal,
  Spinner,
  Table,
  Image,
  Button,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
  BsCalendarEvent,
  BsClock,
  BsCheckCircle,
  BsBoxArrowInDownLeft,
  BsExclamationTriangleFill,
  BsCpuFill,
} from "react-icons/bs";
import "react-toastify/dist/ReactToastify.css";
import "./../../styles/indicatior.css";

const StudentBehavior = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCurrentExamModal, setShowCurrentExamModal] = useState(false);
  const [showPastExamModal, setShowPastExamModal] = useState(false);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);

  const instructorId = JSON.parse(localStorage.getItem("userData"))?.id;

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/exams-instructor/${instructorId}`
        );
        setExams(res.data);
      } catch (err) {
        toast.error("Failed to load exams");
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) fetchExams();
  }, [instructorId]);
  // intervals
  useEffect(() => {
    let interval;

    const fetchStudentsWithSubmissionStatus = async () => {
      if (!selectedExam || !selectedExam.id) return;

      try {
        const [studentRes, submittedRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/exam-assigned-students/${selectedExam.id}`
          ),
          axios.get(
            `http://localhost:5000/api/exam-submissions/${selectedExam.id}`
          ),
        ]);

        const studentsData = studentRes.data;
        const submittedIds = submittedRes.data;

        const merged = studentsData.map((student) => ({
          ...student,
          has_submitted: submittedIds.includes(
            student.student_id || student.id
          ),
        }));

        setStudents(merged);

        // Now also check if exam officially ended — then reset behavior counts
        const now = new Date();
        const [hour, minute, second = 0] = selectedExam.start_time
          .split(":")
          .map(Number);
        const startTime = new Date(selectedExam.exam_date);
        startTime.setHours(hour, minute, second);

        const endTime = new Date(startTime);
        endTime.setMinutes(
          endTime.getMinutes() + parseInt(selectedExam.duration_minutes)
        );

        if (now >= endTime) {
          // Loop through students who haven’t submitted and reset status
          const unsubmittedStudents = studentsData.filter(
            (student) =>
              !submittedIds.includes(student.student_id || student.id)
          );

          for (const student of unsubmittedStudents) {
            await axios.post("http://127.0.0.1:5000/api/update_status_timeup", {
              student_id: student.student_id || student.id,
            });
          }
        }
      } catch (err) {
        console.error("Real-time fetch error", err);
      }
    };

    if (selectedExam && selectedExam.id && showCurrentExamModal) {
      fetchStudentsWithSubmissionStatus();
      interval = setInterval(fetchStudentsWithSubmissionStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedExam, showCurrentExamModal]);

  const groupExams = () => {
    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0]; // 'YYYY-MM-DD'
    const past = [];
    const current = [];

    exams.forEach((exam) => {
      if (!exam.exam_date || !exam.start_time || !exam.duration_minutes) return;

      // Combine exam_date and start_time
      const [hour, minute] = exam.start_time.split(":").map(Number);
      const startDateTime = new Date(exam.exam_date);
      startDateTime.setHours(hour, minute, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(
        endDateTime.getMinutes() + parseInt(exam.duration_minutes)
      );

      const examDateStr = startDateTime.toISOString().split("T")[0];

      if (examDateStr === todayDateStr && now <= endDateTime) {
        // Today’s exam and not yet finished
        current.push({
          ...exam,
          startTimeObj: startDateTime,
          endTimeObj: endDateTime,
        });
      } else if (endDateTime < now) {
        // Exam ended regardless of date
        past.push({
          ...exam,
          startTimeObj: startDateTime,
          endTimeObj: endDateTime,
        });
      }
    });

    return { past, current };
  };

  const { past, current } = groupExams();

  const handleCurrentExamClick = async (exam) => {
    setSelectedExam(exam);
    setSelectedStudent(null);
    try {
      const studentRes = await axios.get(
        `http://localhost:5000/api/exam-assigned-students/${exam.id}`
      );
      const studentsData = studentRes.data;

      // Get submitted user_ids
      const submittedRes = await axios.get(
        `http://localhost:5000/api/exam-submissions/${exam.id}`
      );
      const submittedIds = submittedRes.data; // array of user_id

      // Add `has_submitted` property to each student
      const merged = studentsData.map((student) => ({
        ...student,
        has_submitted: submittedIds.includes(student.student_id || student.id),
      }));
      setStudents(merged);
      setShowCurrentExamModal(true);
    } catch (err) {
      toast.error("Failed to load current exam students");
    }
  };

  const handlePastExamClick = async (exam) => {
    setSelectedExam(exam);
    setSelectedStudent(null);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exam-behavior/${exam.id}`
      );

      const sortedStudents = res.data.sort((a, b) => {
        const statusPriority = {
          Cheated: 0,
          Completed: 1,
          "Did Not Take Exam": 2,
        };
        return statusPriority[a.exam_status] - statusPriority[b.exam_status];
      });

      setStudents(sortedStudents);
      setShowPastExamModal(true);
    } catch (err) {
      toast.error("Failed to load past exam data");
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    const studentId = student.student_id || student.id;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/behavior-images/${selectedExam.id}/${studentId}`
      );
      setBehaviorLogs(res.data);
      setShowBehaviorModal(true);
    } catch (err) {
      toast.error("Failed to load behavior logs");
    }
  };
  // Format date like: May 16, 2025
  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // Format time range like: 07:00 AM - 07:20 AM
  const formatTimeRange = (examDate, startTime, duration) => {
    const [hour, minute] = startTime.split(":").map(Number);
    const start = new Date(examDate);
    start.setHours(hour, minute, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + parseInt(duration));

    return `${start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })} - ${end.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  return (
    <Container className="py-4">
      <ToastContainer />
      <h2 className="text-center fw-bold mb-4">
        <BsCalendarEvent className="me-2" />
        Student Behavior Overview
      </h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          {[
            {
              label: "Current Exams",
              color: "success",
              icon: <BsCheckCircle />,
              data: current,
            },
            {
              label: "Past Exams",
              color: "secondary",
              icon: <BsBoxArrowInDownLeft />,
              data: past,
            },
          ].map((group, idx) => (
            <Col md={4} key={idx}>
              <Card className="shadow-sm mb-4 h-100">
                <Card.Header className={`bg-${group.color} text-white fw-bold`}>
                  {group.icon} {group.label}
                </Card.Header>

                {/* Scrollable Body */}
                <Card.Body
                  className="overflow-auto"
                  style={{ maxHeight: "400px" }}
                >
                  {group.data.length ? (
                    group.data.map((exam) => (
                      <Card
                        key={exam.id}
                        className="mb-2"
                        onClick={() => {
                          group.label === "Past Exams"
                            ? handlePastExamClick(exam)
                            : handleCurrentExamClick(exam);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <Card.Body>
                          <strong>{exam.title}</strong>
                          <div className="text-muted small">
                            {formatDate(new Date(exam.exam_date))} <br />
                            {formatTimeRange(
                              exam.exam_date,
                              exam.start_time,
                              exam.duration_minutes
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted">No exams</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        show={showCurrentExamModal}
        onHide={() => setShowCurrentExamModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Students Taking Exam - {selectedExam?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {students.length ? (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Is Logged In</th>
                  <th>Taking Exam</th>
                  <th>Suspicious Behavior Count</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>
                      <span
                        className={`status-indicator ${
                          student.is_login ? "active" : "inactive"
                        }`}
                        title={student.is_login ? "Logged In" : "Not Logged In"}
                      ></span>
                    </td>
                    <td>
                      <span
                        className={`status-indicator ${
                          student.is_taking_exam ? "active" : "inactive"
                        }`}
                        title={
                          student.is_taking_exam ? "Taking Exam" : "Not Taking"
                        }
                      ></span>
                    </td>
                    <td className="text-center">
                      {student.suspicious_behavior_count}
                    </td>

                    <td>
                      <span
                        className={`status-indicator ${
                          student.has_submitted
                            ? "active submitted"
                            : "inactive"
                        }`}
                        title={
                          student.has_submitted ? "Submitted" : "Not Submitted"
                        }
                      ></span>
                    </td>

                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStudentClick(student)}
                      >
                        View Behavior
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">No assigned students found.</p>
          )}
        </Modal.Body>
      </Modal>

      <Modal
        show={showPastExamModal}
        onHide={() => setShowPastExamModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Past Exam - {selectedExam?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {students.length ? (
            <Table striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>
                      {student.exam_status === "Did Not Take Exam" ? (
                        <span className="text-muted">Did Not Take Exam</span>
                      ) : student.exam_status === "Cheated" ? (
                        <span className="text-danger fw-bold">Cheating</span>
                      ) : (
                        <span className="text-success">Completed</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStudentClick(student)}
                      >
                        View Behavior
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">No behavior data available.</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Behavior Modal */}
      <Modal
        show={showBehaviorModal}
        onHide={() => setShowBehaviorModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <BsBoxArrowInDownLeft className="me-2" />
            Suspicious Behavior - {selectedStudent?.name} (
            {selectedStudent?.username})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {behaviorLogs.length ? (
            <Row>
              {behaviorLogs.map((log, idx) => (
                <Col md={4} key={idx} className="mb-3">
                  <Card className="shadow-sm border-danger">
                    <Image
                      src={`data:image/jpeg;base64,${log.image_base64}`}
                      alt="Suspicious"
                      fluid
                    />
                    <Card.Body>
                      <p className="mb-2">
                        <BsExclamationTriangleFill className="me-1 text-warning" />
                        <strong>Type:</strong> {log.warning_type}
                      </p>
                      <p className="mb-2">
                        <BsCpuFill className="me-1 text-primary" />
                        <strong>AI Classification:</strong>{" "}
                        {log.classification_label}{" "}
                      </p>
                      <p className="text-muted small mb-0">
                        <BsClock className="me-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <p className="text-muted">
              <BsCheckCircle className="me-2 text-success" />
              No suspicious behavior detected by the AI model.
            </p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StudentBehavior;
