"""Form-issue wording ported from your VoicePipeline._find_form_issue.
No streamlit import, so Flask can use it."""


def _norm(value):
    return str(value or "").strip().upper()


def find_form_issue(exercise, metrics):
    metrics = metrics or {}
    if "issue" in metrics:
        return metrics["issue"]

    if exercise == "Squats":
        depth = _norm(metrics.get("depth_status"))
        back = metrics.get("back_angle")
        if depth == "TOO HIGH":
            return "Squat depth is not deep enough. Bend your knees more."
        if isinstance(back, (int, float)) and back > 130:
            return "You are leaning forward too much. Keep your back straight and chest up."

    elif exercise == "Push-ups":
        body = _norm(metrics.get("body_alignment"))
        hip = _norm(metrics.get("hip_status"))
        if body == "POOR FORM":
            return "Your body is not straight. Keep your back and legs aligned."
        if hip == "SAGGING":
            return "Your hips are sagging. Engage your core and keep your body straight."
        if hip == "PIKED UP":
            return "Your hips are too high. Lower your hips to maintain a straight line from head to heels."

    elif exercise == "Biceps Curls (Dumbbell)":
        if _norm(metrics.get("swing_status")) == "SWINGING":
            return "You are swinging your body. Keep your elbows close to your torso and avoid using momentum."
        if _norm(metrics.get("shoulder_status")) == "ELBOW DRIFTING":
            return "Your elbows are drifting away from your sides. Keep them close to your torso."

    elif exercise == "Shoulder Press":
        arch = _norm(metrics.get("back_arch_status"))
        if arch == "EXCESSIVE ARCH":
            return "Your back is arching too much. Engage your core and keep your back straight."
        if arch == "SLIGHT ARCH":
            return "Your back is arching slightly. Focus on keeping your core tight and back straight."

    elif exercise == "Lunges":
        if _norm(metrics.get("balance_status")) == "OFF BALANCE":
            return "You are off balance. Keep your weight centered and maintain a stable stance."

    return None