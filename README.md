# Apna AI Coach

A real-time gym coach. It watches your form through the camera, counts your reps, and speaks short corrections while you train.

This repository contains **two versions** of the same app:

| | **Flask + JavaScript** (recommended) | **Streamlit** |
|---|---|---|
| Folder | `flask-js/` | `streamlit-app/` |
| Pose detection runs | In the browser (MediaPipe JS) | On the server (MediaPipe Python) |
| Video leaves your device | No | Yes (streamed over WebRTC) |
| Smoothness | Smooth, no server round trip | Can lag on shared cloud CPUs |
| Camera on phones | Needs HTTPS (Render and Railway give it) | Needs HTTPS and often a TURN server |
| Login and workout history | Not yet (planned) | Yes |
| Landing page | Yes | No |

> Adjust the folder names above to match your repository layout.

## Supported exercises

Squats, Push-ups, Biceps Curls (Dumbbell), Shoulder Press, Lunges.

Each exercise has its own rep counter and form checks (angles and body alignment), for example sagging hips in a push-up or leaning forward in a squat.

## How it works

Both versions use the same idea:

```
Camera frame -> MediaPipe Pose (33 body landmarks)
             -> rule-based detectors (joint angles and thresholds)
             -> rep count + form issue
             -> LLM coach (Groq) writes a short cue
             -> gTTS turns it into voice
```

- **MediaPipe** only finds body points. It does not know what a push-up is.
- **Detectors** are plain angle rules that decide reps and form.
- **The LLM** never sees the video. It only receives text such as `ongoing_form_check` plus a form issue like "Your hips are sagging."
- **Events** the coach understands: `workout_started`, `set_completed`, `workout_completed`, `no_pose_detected`, `ongoing_form_check`.

## Requirements

- Python 3.11
- A free [Groq API key](https://console.groq.com)
- A webcam
- An internet connection (the LLM, gTTS, and the browser model download all need it)

---

## Version 1: Flask + JavaScript

### Run locally

```bash
cd flask-js
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

Create a `.env` file:

```
GROQ_API_KEY=your_key_here
SECRET_KEY=any_long_random_string
```

Start the app:

```bash
python app.py
```

Open:

- `http://127.0.0.1:5000/` for the landing page
- `http://127.0.0.1:5000/coach` for the live coach

### Project layout

```
flask-js/
├── app.py                  # routes: /, /coach, /api/feedback
├── requirements.txt
├── services/
│   ├── coaching/           # llm.py, tts.py, issues.py
│   └── config/             # workout_config.py (system prompt, exercises)
├── templates/              # index.html, coach.html
└── static/
    ├── js/detectors.js     # JS port of the Python detectors
    └── media/              # hero.mp4 and images for the landing page
```

### API

`POST /api/feedback`

```json
{
  "event": "ongoing_form_check",
  "exercise": "Push-ups",
  "metrics": { "hip_status": "SAGGING", "body_alignment": "Straight" }
}
```

Returns `{ "text": "...", "audio": "<base64 mp3>", "audio_format": "audio/mp3" }`. For `ongoing_form_check`, it returns `text: null` when there is no form issue.

### Deploy (Render)

1. Push this repo to GitHub.
2. On Render, choose **New, then Web Service**, and select the repo. Set the root directory to `flask-js` if the app is in a subfolder.
3. Settings:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app --workers 1 --threads 4 --timeout 60`
4. Environment variables: `GROQ_API_KEY`, `SECRET_KEY`, `PYTHON_VERSION=3.11.9`.

Use one worker: coach history is stored in memory per session. The camera only works over HTTPS, which Render provides.

---

## Version 2: Streamlit

### Run locally

```bash
cd streamlit-app
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

Provide your Groq key in either place:

- environment variable `GROQ_API_KEY`, or
- `.streamlit/secrets.toml`:

  ```toml
  GROQ_API_KEY = "your_key_here"
  ```

### What it needs

- `ml_models/pose_landmarker_full.task` (the MediaPipe pose model file)
- The `detectors/`, `core/`, and `services/` folders
- `requirements.txt` with at least: `streamlit`, `streamlit-webrtc`, `opencv-python-headless`, `mediapipe`, `av`, `groq`, `gTTS`, `pandas`
- On Streamlit Community Cloud, a `packages.txt` listing `libgl1` if OpenCV fails to import

### Features

- Login wall and per-user workout history (SQLite)
- Sidebar workout plan (exercise, sets, reps per set)
- Live progress and per-exercise metrics
- Proactive voice coaching with form-issue detection

### Known issues

- **"Connection is taking longer than expected":** the browser cannot reach the server over WebRTC. Add a TURN server to `rtc_configuration`, or test from a different network (mobile data often works).
- **Lag:** every frame goes to the server and back. Lower the resolution (480x360) and frame rate (15 fps), or use the Flask + JavaScript version.

---

## Notes and limitations

- Detection is rule-based. Camera angle matters: push-ups need a side view, squats and lunges work best from the front or a slight angle, and curls and presses need the arm and shoulder clearly visible.
- The pose model is not perfect in poor lighting or when limbs are out of frame. The Flask version shows "STEP BACK" and pauses counting when the needed joints are not visible.
- This is a training aid, not medical or professional coaching advice.

## Roadmap

- [ ] Login and workout history for the Flask version (database)
- [ ] Hero video and screenshots for the landing page
- [ ] Per-exercise tuning of rep thresholds
- [ ] Mobile layout polish

## Tech stack

Flask, Streamlit, streamlit-webrtc, MediaPipe (Python and JS), OpenCV, Groq (LLM), gTTS, SQLite, gunicorn.
