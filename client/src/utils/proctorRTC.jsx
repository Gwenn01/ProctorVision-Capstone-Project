let pc = null;
let localStream = null;

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" }, // TURN not needed for localhost
];

function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    function check() {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    }
    pc.addEventListener("icegatheringstatechange", check);
  });
}

export async function startProctoringWebRTC(
  apiBase,
  studentId,
  examId,
  previewVideoEl
) {
  console.log("[RTC] requesting camera…");
  // 1) Camera
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720, frameRate: { ideal: 30 } },
    audio: false,
  });
  if (previewVideoEl) {
    previewVideoEl.srcObject = localStream;
    try {
      await previewVideoEl.play();
    } catch (e) {}
  }

  // 2) Peer connection
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  pc.oniceconnectionstatechange = () =>
    console.log("ICE state:", pc.iceConnectionState);
  pc.onconnectionstatechange = () =>
    console.log("RTC state:", pc.connectionState);

  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  // 3) Offer with full ICE
  const offer = await pc.createOffer({
    offerToReceiveVideo: false,
    offerToReceiveAudio: false,
  });
  await pc.setLocalDescription(offer);
  await waitForIceGatheringComplete(pc);

  const url = `${apiBase}/api/webrtc/offer`;
  console.log("[RTC] POST", url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // credentials: "include", // <- leave off while testing CORS
    body: JSON.stringify({
      sdp: pc.localDescription.sdp,
      type: pc.localDescription.type,
      student_id: String(studentId),
      exam_id: String(examId),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[RTC] /webrtc/offer failed", res.status, text);
    throw new Error(`Offer failed: ${res.status} ${text}`);
  }

  const answer = await res.json();
  await pc.setRemoteDescription(answer);
  console.log("[RTC] remote description set; waiting for connected…");
}

export function stopProctoringWebRTC() {
  try {
    if (pc) {
      pc.getSenders().forEach((s) => {
        try {
          s.track && s.track.stop();
        } catch {}
      });
      pc.close();
    }
  } catch {}
  pc = null;

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
}
