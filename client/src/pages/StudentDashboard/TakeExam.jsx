import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Card,
  Button,
  Form,
  ProgressBar,
  Modal,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Spinner from "../../components/Spinner";
import axios from "axios";

import {
  startProctoringWebRTC,
  stopProctoringWebRTC,
} from "../../utils/proctorRTC";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";

const TakeExam = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [showCapturedModal, setShowCapturedModal] = useState(false);
  const [classifiedLogs, setClassifiedLogs] = useState([]);
  const [examText, setExamText] = useState("");

  // Local camera preview
  const videoPreviewRef = useRef(null);

  // HUD overlay (badge in top-left of the video)
  const overlayRef = useRef(null);

  // Audio: one-shot beep + continuous alarm (both use /beep.wav)
  const beepRef = useRef(null); // one-shot
  const alarmRef = useRef(null); // continuous loop for "No Face"
  const audioCtxRef = useRef(null); // Web Audio fallback
  const prevWarnRef = useRef("Looking Forward");
  const noFaceActiveRef = useRef(false);

  const [lastCaptureAt, setLastCaptureAt] = useState(0);

  // ---- helpers: one-shot beep (audio element first, then Web Audio fallback) ----
  const playBeep = useCallback(async () => {
    if (beepRef.current) {
      try {
        beepRef.current.currentTime = 0;
        await beepRef.current.play();
        return;
      } catch {
        /* fall back below */
      }
    }
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* ignore */
    }
  }, []);

  // ---- helpers: start/stop continuous alarm for "No Face" ----
  const startNoFaceAlarm = useCallback(async () => {
    if (noFaceActiveRef.current) return; // already playing
    noFaceActiveRef.current = true;

    if (alarmRef.current) {
      try {
        alarmRef.current.loop = true;
        alarmRef.current.currentTime = 0;
        await alarmRef.current.play();
        return;
      } catch {
        /* fallback below */
      }
    }
    // Web Audio fallback (sustained tone until stopped)
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 700;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      // store on ref so we can stop it later
      alarmRef.current = { __osc: osc, __gain: gain, __webAudio: true };
    } catch {
      /* ignore */
    }
  }, []);

  const stopNoFaceAlarm = useCallback(() => {
    if (!noFaceActiveRef.current) return;
    noFaceActiveRef.current = false;

    const a = alarmRef.current;
    if (!a) return;

    // If it's an <audio> element
    if (a.tagName === "AUDIO") {
      try {
        a.pause();
        a.currentTime = 0;
        a.loop = false;
      } catch {}
      return;
    }

    // If it's a Web Audio oscillator fallback
    if (a.__webAudio && a.__osc) {
      try {
        a.__osc.stop();
      } catch {}
      alarmRef.current = null;
    }
  }, []);

  // Fetch exams + filter out submitted
  useEffect(() => {
    const fetchExams = async () => {
      const userData = JSON.parse(localStorage.getItem("userData"));
      const studentId = userData?.id;
      try {
        const examsRes = await axios.get(
          `${API_BASE}/api/get_exam?student_id=${studentId}`
        );
        const submissionsRes = await axios.get(
          `${API_BASE}/api/get_exam_submissions?user_id=${studentId}`
        );
        const submittedIds = submissionsRes.data.map((s) => s.exam_id);
        const availableExams = examsRes.data.filter(
          (exam) => !submittedIds.includes(exam.id)
        );
        setExams(availableExams);
      } catch (error) {
        console.error("Error fetching exams/submissions:", error);
      }
    };

    fetchExams();
  }, []);

  // Load exam text
  useEffect(() => {
    if (selectedExam && selectedExam.exam_file) {
      const filename = selectedExam.exam_file
        .replaceAll("\\", "/")
        .split("/")
        .pop();
      axios
        .get(`${API_BASE}/api/exam_text/${filename}`)
        .then((res) => setExamText(res.data.content))
        .catch((err) => console.error("Failed to load exam text:", err));
    } else {
      setExamText("");
    }
  }, [selectedExam]);

  const handleExamSelect = (e) => {
    const exam = exams.find((x) => x.id === parseInt(e.target.value));
    setSelectedExam(exam || null);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
          s
        ).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Start exam (starts timer; WebRTC begins in effect below)
  const handleStartExam = async () => {
    if (!selectedExam) {
      toast.warn("Please select an exam first!");
      return;
    }

    const now = new Date();
    const [hour, minute, second = 0] = selectedExam.start_time
      .split(":")
      .map(Number);
    const startTime = new Date(selectedExam.exam_date);
    startTime.setHours(hour, minute, second, 0);

    const durationInMinutes = parseInt(selectedExam.duration_minutes);
    const endTime = new Date(
      startTime.getTime() + durationInMinutes * 60 * 1000
    );

    if (now < startTime) {
      toast.error("You can only start the exam at the scheduled time.");
      return;
    }
    if (now > endTime) {
      toast.error("The exam period has already ended.");
      return;
    }

    // Unlock audio synchronously in the click event (both players)
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      if (beepRef.current) {
        beepRef.current.load();
        await beepRef.current.play();
        beepRef.current.pause();
        beepRef.current.currentTime = 0;
      }
      if (alarmRef.current && alarmRef.current.tagName === "AUDIO") {
        alarmRef.current.load();
        await alarmRef.current.play();
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      }
    } catch {
      /* ignore; fallbacks will try again later */
    }

    setIsTakingExam(true);
    const remainingTimeInSeconds = Math.floor((endTime - now) / 1000);
    setTimer(Math.max(0, remainingTimeInSeconds));
    toast.success("Exam started. Good luck!");
  };

  const getTodayDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Timer tick
  useEffect(() => {
    if (isTakingExam && timer > 0) {
      const countdown = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [isTakingExam, timer]);

  // Notify start -> backend
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const studentId = userData?.id;

    const notifStart = async () => {
      try {
        await axios.post(
          `${API_BASE}/api/update_exam_status_start`,
          { student_id: studentId },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Error updating start status:", err);
      }
    };
    if (isTakingExam) notifStart();
  }, [isTakingExam]);

  // Start WebRTC AFTER the exam view mounts
  useEffect(() => {
    (async () => {
      if (!isTakingExam || !selectedExam) return;
      const userData = JSON.parse(localStorage.getItem("userData"));
      const studentId = userData?.id;

      try {
        await startProctoringWebRTC(
          API_BASE,
          studentId,
          selectedExam.id,
          videoPreviewRef.current
        );
      } catch (e) {
        console.error("Failed to start WebRTC:", e);
        toast.error(
          "Could not access/send camera. Check permissions & HTTPS, then retry."
        );
        setIsTakingExam(false);
      }
    })();
  }, [isTakingExam, selectedExam]);

  // Poll server for last_warning -> HUD + one-shot beeps + continuous alarm on No Face
  useEffect(() => {
    if (!isTakingExam || !selectedExam) return;
    const userData = JSON.parse(localStorage.getItem("userData"));
    const studentId = userData?.id;

    const t = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/proctor/last_warning`,
          { params: { student_id: studentId, exam_id: selectedExam.id } }
        );

        const warn = data?.warning || "Looking Forward";

        const isNoFace = warn === "No Face";
        if (isNoFace) {
          await startNoFaceAlarm();
        } else {
          stopNoFaceAlarm();
        }

        // One-shot beep on NEW violation (exclude No Face; continuous handled above)
        const isViolation = warn !== "Looking Forward" && !isNoFace;
        if (isViolation && warn !== prevWarnRef.current) {
          await playBeep();
          setWarningMessage(warn);
          setShowWarning(true);
        }
        prevWarnRef.current = warn;

        // HUD badge
        if (overlayRef.current) {
          overlayRef.current.innerText = warn || "Looking Forward";
          overlayRef.current.style.background =
            warn === "Looking Forward"
              ? "rgba(0,0,0,0.6)"
              : warn === "No Face"
              ? "rgba(128,0,0,0.75)"
              : "rgba(160,30,0,0.8)";
        }
      } catch {
        /* ignore polling errors */
      }
    }, 600);

    return () => {
      clearInterval(t);
      stopNoFaceAlarm();
    };
  }, [isTakingExam, selectedExam, playBeep, startNoFaceAlarm, stopNoFaceAlarm]);

  // Optional: poll server for last_capture -> beep on new capture (suppressed if No Face alarm is active)
  useEffect(() => {
    if (!isTakingExam || !selectedExam) return;
    const userData = JSON.parse(localStorage.getItem("userData"));
    const studentId = userData?.id;

    const t = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/proctor/last_capture`,
          { params: { student_id: studentId, exam_id: selectedExam.id } }
        );
        if (data?.at && data.at > lastCaptureAt) {
          setLastCaptureAt(data.at);
          if (!noFaceActiveRef.current) {
            await playBeep();
          }
        }
      } catch {
        /* ignore polling errors */
      }
    }, 1200);

    return () => clearInterval(t);
  }, [isTakingExam, selectedExam, lastCaptureAt, playBeep]);

  // Fetch behavior logs after submitting
  const fetchBehaviorLogs = useCallback(async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData?.id || !selectedExam?.id) return;

    const response = await axios.get(
      `${API_BASE}/api/get_behavior_logs?user_id=${userData.id}`
    );
    const logs = response.data.filter((log) => log.exam_id === selectedExam.id);
    setClassifiedLogs(logs.reverse());
  }, [selectedExam]);

  // Submit exam
  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;

    const userData = JSON.parse(localStorage.getItem("userData"));
    const studentId = userData?.id;

    if (!studentId || !selectedExam?.id) {
      toast.error("Missing exam or student information.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `${API_BASE}/api/update_exam_status_submit`,
        { student_id: studentId },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Exam submitted successfully!");
    } catch {
      toast.error("Failed to submit exam.");
    }

    try {
      stopProctoringWebRTC();
      stopNoFaceAlarm();

      await axios.post(`${API_BASE}/api/classify_behavior_logs`, {
        user_id: studentId,
        exam_id: selectedExam.id,
      });

      await axios.post(`${API_BASE}/api/submit_exam`, {
        user_id: studentId,
        exam_id: selectedExam.id,
      });

      await fetchBehaviorLogs();

      toast.success("Exam submitted and classified.");
      setShowCapturedModal(true);
    } catch (error) {
      console.error("Error during submission:", error);
      toast.error("Something went wrong while submitting the exam.");
    }

    setIsSubmitting(false);
    setIsTakingExam(false);
  }, [isSubmitting, selectedExam, fetchBehaviorLogs, stopNoFaceAlarm]);

  // Auto-submit when time is up
  useEffect(() => {
    if (isTakingExam && timer === 0 && selectedExam?.id) {
      handleSubmitExam();
    }
  }, [timer, isTakingExam, selectedExam, handleSubmitExam]);

  // Cleanup on unmount / route change
  useEffect(() => {
    return () => {
      stopProctoringWebRTC();
      stopNoFaceAlarm();
    };
  }, [stopNoFaceAlarm]);

  return (
    <Container fluid className="py-4 px-3 px-md-5 bg-light min-vh-100">
      {/* Title */}
      <h2
        className="mb-4 fw-bold text-center text-md-start"
        style={{ color: "#0d3b66" }}
      >
        <i className="bi bi-journal-text me-2"></i>
        {selectedExam ? selectedExam.title : "Take Exam"}
      </h2>

      {/* One-shot beep */}
      <audio ref={beepRef} preload="auto">
        <source src="/beep.wav" type="audio/wav" />
      </audio>

      {/* Continuous alarm */}
      <audio ref={alarmRef} preload="auto" loop>
        <source src="/beep.wav" type="audio/wav" />
      </audio>

      {/* Date Alert */}
      <Alert variant="info" className="text-center shadow-sm rounded-pill">
        <i className="bi bi-calendar-event me-2"></i>
        <strong>Today:</strong> {getTodayDate()}
      </Alert>

      {/* Warning Modal */}
      <Modal show={showWarning} onHide={() => setShowWarning(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Behavior Warning
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="fs-5 text-danger text-center">
            {`Warning: You are ${warningMessage}`}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-danger"
            onClick={() => setShowWarning(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Exam Selector */}
      {!isTakingExam && (
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="p-4 shadow border-0 rounded-3">
              <Card.Body>
                <Form.Group>
                  <Form.Label className="fw-semibold text-secondary">
                    <i className="bi bi-list-task me-2"></i>Select Exam /
                    Activity
                  </Form.Label>
                  <Form.Select
                    onChange={handleExamSelect}
                    value={selectedExam ? selectedExam.id : ""}
                  >
                    <option value="">-- Choose --</option>
                    {exams
                      .filter((exam) => {
                        const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
                        return exam.exam_date === today && exam.start_time;
                      })
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title} • {exam.exam_type} (
                          {exam.duration_minutes || 0} min)
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
                <div className="text-center mt-3">
                  <Button
                    variant="success"
                    onClick={handleStartExam}
                    disabled={!selectedExam}
                    className="w-100"
                  >
                    <i className="bi bi-play-fill me-2"></i>Start
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Taking Exam UI */}
      {isTakingExam && selectedExam && (
        <Row className="mt-4">
          <Col lg={8}>
            <Card className="shadow border-0 rounded-3">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-pencil-square me-2"></i>
                  {selectedExam.title}
                </h5>
                <span className="badge bg-light text-dark">
                  {selectedExam.exam_type}
                </span>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold">
                    Time Remaining: {formatTime(timer)}
                  </span>
                  <ProgressBar
                    now={(timer / (selectedExam.duration_minutes * 60)) * 100}
                    className="flex-grow-1 mx-3"
                    variant="success"
                  />
                  <span>{selectedExam.duration_minutes} min</span>
                </div>
                <div className="border rounded p-3 bg-light-subtle">
                  <pre className="mb-0">{examText}</pre>
                </div>
                <div className="text-end mt-3">
                  <Button
                    variant="danger"
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-box-arrow-up me-2"></i>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mt-3 mt-lg-0">
            <Card className="shadow border-0 rounded-3">
              <Card.Header className="bg-dark text-white">
                <i className="bi bi-camera-video me-2"></i>Live Camera
              </Card.Header>
              <Card.Body className="p-0 position-relative">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", borderRadius: "0 0 0.5rem 0.5rem" }}
                />
                <div
                  ref={overlayRef}
                  className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded text-white small"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                  }}
                >
                  Looking Forward
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Captured Logs Modal */}
      <Modal
        show={showCapturedModal}
        onHide={() => setShowCapturedModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-list-check me-2"></i>Behavior Logs
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {classifiedLogs.length > 0 ? (
            <Row>
              {classifiedLogs.map((log, index) => (
                <Col
                  key={index}
                  xs={12}
                  sm={6}
                  md={4}
                  className="mb-4 text-center"
                >
                  {/* Captured Image */}
                  {log.image_base64 && (
                    <img
                      src={`data:image/jpeg;base64,${log.image_base64}`}
                      alt={`Captured ${index}`}
                      className="img-fluid rounded shadow-sm border mb-2"
                    />
                  )}

                  {/* Warning type */}
                  <div className="fw-semibold text-danger">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Warning: {log.warning_type || "Unknown"}
                  </div>

                  {/* Classification */}
                  <div
                    className={`fw-bold ${
                      log.classification_label === "Cheating"
                        ? "text-danger"
                        : "text-success"
                    }`}
                  >
                    <i className="bi bi-shield-check me-1"></i>
                    Result: {log.classification_label || "Unclassified"}
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <p>No behavior logs found.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCapturedModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TakeExam;
