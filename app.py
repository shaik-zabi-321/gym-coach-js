import base64
import os
import uuid

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from groq import Groq

# Reused from your Streamlit project: copy the services/ folder next to this file
from services.coaching.llm import LLMCoach
from services.coaching.tts import TextToSpeech
from services.coaching.issues import find_form_issue

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-me-in-production")

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
tts = TextToSpeech()

# One coach per browser session so each user has their own chat history.
# In-memory only: fine for learning, replace with a DB/Redis when you scale.
coaches = {}


def get_coach():
    sid = session.get("sid")
    if not sid:
        sid = session["sid"] = uuid.uuid4().hex
    if sid not in coaches:
        coaches[sid] = LLMCoach(groq_client)
    return coaches[sid]


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/coach")
def coach_page():
    return render_template("coach.html")


@app.post("/api/feedback")
def feedback():
    data = request.get_json(silent=True) or {}
    event = (data.get("event") or "").strip()
    exercise = (data.get("exercise") or "").strip()
    metrics = data.get("metrics") or {}
    # Use the issue sent by the browser, else derive it from status metrics
    issue = (data.get("issue") or "").strip() or find_form_issue(exercise, metrics)

    if not event:
        return jsonify(error="'event' is required"), 400

    # Same gating as your VoicePipeline: non-major events speak only when there is an issue
    if event not in ("workout_started", "set_completed", "workout_completed") and not issue:
        return jsonify(text=None, audio=None)

    try:
        text = get_coach().give_feedback(event, issue)
        audio = tts.speak(text)
    except Exception as e:
        app.logger.exception("feedback failed")
        return jsonify(error=str(e)), 500

    audio_b64 = base64.b64encode(audio).decode() if audio else None
    return jsonify(text=text, audio=audio_b64, audio_format="audio/mp3")


if __name__ == "__main__":
    app.run(debug=True)
