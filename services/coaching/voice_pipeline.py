import time
import traceback

import streamlit as st


def _norm(value):
    return str(value or "").strip().upper()


class voicepipeline:
    def __init__(self, llm, tts):
        self.llm = llm
        self.tts = tts
        self.last_spoken_at = 0

    def _find_form_issue(self, exercise, metrics):
        if "issue" in metrics:
            return metrics["issue"]

        if exercise == "Squats":
            depth = _norm(metrics.get("depth_status"))
            back_angle = metrics.get("back_angle")

            if depth == "TOO HIGH":
                return "Squat depth is not deep enough. Bend your knees more."
            if isinstance(back_angle, (int, float)) and back_angle > 130:
                return "You are leaning forward too much. Keep your back straight and chest up."

        elif exercise == "Push-ups":
            body_alignment = _norm(metrics.get("body_alignment"))
            hip_status = _norm(metrics.get("hip_status"))

            if body_alignment == "POOR FORM":
                return "Your body is not straight. Keep your back and legs aligned."
            if hip_status == "SAGGING":
                return "Your hips are sagging. Engage your core and keep your body straight."
            if hip_status == "PIKED UP":
                return "Your hips are too high. Lower your hips to maintain a straight line from head to heels."

        elif exercise == "Biceps Curls (Dumbbell)":
            swing_status = _norm(metrics.get("swing_status"))
            shoulder_status = _norm(metrics.get("shoulder_status"))

            if swing_status == "SWINGING":
                return "You are swinging your body. Keep your elbows close to your torso and avoid using momentum."
            if shoulder_status == "ELBOW DRIFTING":
                return "Your elbows are drifting away from your sides. Keep them close to your torso."

        elif exercise == "Shoulder Press":
            back_arch_status = _norm(metrics.get("back_arch_status"))

            if back_arch_status == "EXCESSIVE ARCH":
                return "Your back is arching too much. Engage your core and keep your back straight."
            if back_arch_status == "SLIGHT ARCH":
                return "Your back is arching slightly. Focus on keeping your core tight and back straight."

        elif exercise == "Lunges":
            balance_status = _norm(metrics.get("balance_status"))

            if balance_status == "OFF BALANCE":
                return "You are off balance. Keep your weight centered and maintain a stable stance."

        return None

    def process_event(self, event, exercise, metrics):
        issue = self._find_form_issue(exercise, metrics)
        now = time.time()

        is_major = event in (
            "workout_started", "set_completed", "workout_completed")

        if not is_major:
            if not issue:
                return None
            if now - self.last_spoken_at < 5:
                return None

        print(
            f"[voice] event={event} exercise={exercise} issue={issue!r}", flush=True)

        # Set before the network calls so a failing API isn't retried 4x per second
        self.last_spoken_at = now

        try:
            text = self.llm.give_feedback(event, issue)
            if not text:
                return None
            voice = self.tts.speak(text)
            if not voice:
                return None
            return voice, text
        except Exception:
            traceback.print_exc()
            return None


def autoplay_audio(audio_bytes):

    if not audio_bytes:
        return

    st.markdown(
        "<style>[data-testid='stAudio']{display:none;}</style>",
        unsafe_allow_html=True,
    )
    st.audio(audio_bytes, format="audio/mp3", autoplay=True)
