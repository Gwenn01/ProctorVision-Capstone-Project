import pyaudio
import wave
import json
import vosk

# Load Vosk model (Ensure you download a model from https://alphacephei.com/vosk/models)
MODEL_PATH = "vosk-model-small-en-us-0.15"  # Change to your downloaded model path
samplerate = 16000

# Initialize Vosk recognizer
model = vosk.Model(MODEL_PATH)
recognizer = vosk.KaldiRecognizer(model, samplerate)

# Audio recording settings
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
RECORD_SECONDS = 5
WAVE_OUTPUT_FILENAME = "output.wav"

audio = pyaudio.PyAudio()

# Start recording
stream = audio.open(format=FORMAT, channels=CHANNELS,
                    rate=RATE, input=True,
                    frames_per_buffer=CHUNK)

print("Recording audio... Speak now.")
frames = []

for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
    data = stream.read(CHUNK)
    frames.append(data)

# Stop recording
stream.stop_stream()
stream.close()
audio.terminate()

# Save recorded sound
wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(audio.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()

# Process speech recognition
print("🔍 Processing speech recognition...")

with wave.open(WAVE_OUTPUT_FILENAME, "rb") as wf:
    while True:
        data = wf.readframes(CHUNK)
        if len(data) == 0:
            break
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            detected_text = result.get("text", "")

            print(f"Detected Speech: {detected_text}")

            if detected_text:
                print("Suspicious speech detected!")
            else:
                print("No cheating-related speech detected.")
