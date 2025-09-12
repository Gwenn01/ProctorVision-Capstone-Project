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

  // if the exam ended change the status of student the suspicius behavior
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
        // --- Build start & end times robustly ---
        const now = new Date();

        const toStartDate = (dateStr, timeStr) => {
          const d = new Date(dateStr); // local date at 00:00
          if (Number.isNaN(d.getTime())) return null;

          let h = 0,
            m = 0,
            s = 0;
          if (/am|pm/i.test(timeStr)) {
            // 12-hour format
            const [hh, mm, ss = "0"] = timeStr
              .replace(/\s?(AM|PM)/i, "")
              .split(":");
            h = parseInt(hh, 10);
            m = parseInt(mm, 10);
            s = parseInt(ss, 10);
            const isPM = /pm/i.test(timeStr);
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
          } else {
            // 24-hour format
            const [HH, MM, SS = "0"] = timeStr.split(":");
            h = parseInt(HH, 10);
            m = parseInt(MM, 10);
            s = parseInt(SS, 10);
          }

          d.setHours(h, m, s, 0);
          return d;
        };

        const startTime = toStartDate(
          selectedExam.exam_date,
          selectedExam.start_time
        );
        const durationMin = Number(selectedExam.duration_minutes || 0);
        const endTime = startTime
          ? new Date(startTime.getTime() + durationMin * 60_000)
          : null;

        console.log(startTime + " " + endTime + " " + now);

        if (startTime && endTime && now >= endTime) {
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

      {/* Page Header */}
      <h2 className="text-start fw-bold mb-4" style={{ color: "#0d0e0eff" }}>
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
              icon: <BsCheckCircle className="me-2" />,
              data: current,
              handler: handleCurrentExamClick,
            },
            {
              label: "Past Exams",
              color: "secondary",
              icon: <BsBoxArrowInDownLeft className="me-2" />,
              data: past,
              handler: handlePastExamClick,
            },
          ].map((group, idx) => (
            <Col md={6} lg={5} key={idx}>
              <Card className="shadow-sm mb-4 h-100">
                <Card.Header className={`bg-${group.color} text-white fw-bold`}>
                  {group.icon} {group.label}
                </Card.Header>
                <Card.Body
                  className="overflow-auto"
                  style={{ maxHeight: "400px" }}
                >
                  {group.data.length ? (
                    group.data.map((exam) => (
                      <Card
                        key={exam.id}
                        className="mb-2 border-0 shadow-sm"
                        onClick={() => group.handler(exam)}
                        style={{ cursor: "pointer" }}
                      >
                        <Card.Body>
                          <strong>{exam.title}</strong>
                          <div className="text-muted small">
                            {formatDate(new Date(exam.exam_date))}
                            <br />
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
                    <p className="text-muted text-center">No exams</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Current Exam Modal */}
      <Modal
        show={showCurrentExamModal}
        onHide={() => setShowCurrentExamModal(false)}
        size="xl" // ✅ Wider modal
        centered
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <i className="bi bi-people me-2"></i>
            Students Taking Exam – {selectedExam?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {students.length ? (
            <Table
              striped
              bordered
              hover
              responsive
              className="align-middle shadow-sm"
            >
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Login</th>
                  <th>Exam</th>
                  <th className="text-center">Suspicious</th>
                  <th>Submitted</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td className="fw-semibold">{student.name}</td>
                    <td className="text-muted">{student.username}</td>

                    {/* Login Status */}
                    <td>
                      {student.is_login ? (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i> Yes
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </td>

                    {/* Exam Status */}
                    <td>
                      {student.is_taking_exam ? (
                        <span className="badge bg-info text-dark">
                          <i className="bi bi-pencil-square me-1"></i> Taking
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </td>

                    {/* Suspicious Count */}
                    <td className="text-center">
                      {student.has_submitted ? (
                        <span className="badge bg-success">Submitted</span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          {student.suspicious_behavior_count ?? 0}
                        </span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td>
                      {student.has_submitted ? (
                        <span className="badge bg-success">
                          <i className="bi bi-check2-circle me-1"></i> Yes
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStudentClick(student)}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center">
              <i className="bi bi-info-circle me-2"></i>
              No assigned students found.
            </p>
          )}
        </Modal.Body>
      </Modal>

      {/* Past Exam Modal */}
      <Modal
        show={showPastExamModal}
        onHide={() => setShowPastExamModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <i className="bi bi-archive me-2"></i>
            Past Exam – {selectedExam?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {students.length ? (
            <Table bordered hover responsive className="align-middle shadow-sm">
              <thead className="table-light">
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
                    <td className="text-muted">{student.username}</td>
                    <td>
                      {student.exam_status === "Did Not Take Exam" ? (
                        <span className="badge bg-secondary">Did Not Take</span>
                      ) : student.exam_status === "Cheated" ? (
                        <span className="badge bg-danger">Cheating</span>
                      ) : (
                        <span className="badge bg-success">Completed</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStudentClick(student)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center">
              <i className="bi bi-info-circle me-2"></i>No behavior data
              available.
            </p>
          )}
        </Modal.Body>
      </Modal>

      {/* Behavior Modal */}
      <Modal
        show={showBehaviorModal}
        onHide={() => setShowBehaviorModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <i className="bi bi-eye me-2"></i>
            Suspicious Behavior – {selectedStudent?.name} (
            {selectedStudent?.username})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {behaviorLogs.length ? (
            <Row>
              {behaviorLogs.map((log, idx) => (
                <Col md={4} key={idx} className="mb-4">
                  <Card className="shadow-sm h-100">
                    {" "}
                    <Image
                      src={`data:image/jpeg;base64,${log.image_base64}`}
                      alt="Suspicious"
                      fluid
                      className="rounded-top"
                    />
                    <Card.Body>
                      <p className="mb-2">
                        <BsExclamationTriangleFill className="me-1 text-warning" />
                        <strong>Type:</strong> {log.warning_type}
                      </p>
                      <p
                        className={`mb-2 fw-semibold ${
                          log.classification_label === "Cheating"
                            ? "text-danger"
                            : "text-success"
                        }`}
                      >
                        <BsCpuFill className="me-1 text-primary" />
                        AI: {log.classification_label}
                      </p>
                      <p className="text-muted small mb-0">
                        <BsClock className="me-1" />
                        {log.timestamp.toLocaleString()}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center text-muted">
              <BsCheckCircle className="me-2 text-success" />
              No suspicious behavior detected by the AI model.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StudentBehavior;
