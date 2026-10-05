// Ported 1:1 from your Python detectors/ (same thresholds, same landmark indexes, same status strings).
// Angles use normalized x,y exactly like core/base_exercise.py.
const pt = (lm, i) => [lm[i].x, lm[i].y];
function angle(a, b, c) {
    const ax = a[0] - b[0], ay = a[1] - b[1], cx = c[0] - b[0], cy = c[1] - b[1];
    const m = Math.hypot(ax, ay) * Math.hypot(cx, cy);
    if (m === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, (ax * cx + ay * cy) / m))) * 180 / Math.PI;
}
const vis = (lm, ...idx) => idx.every(i => lm[i].visibility > 0.7);
const visGE = (lm, ...idx) => idx.every(i => lm[i].visibility >= 0.7);
const side = (lm, l, r) => lm[l].visibility >= lm[r].visibility;

function squats() {
    let reps = 0, stage = null;
    return {
        reset() { reps = 0; stage = null; },
        process(lm) {
            const lk = angle(pt(lm, 23), pt(lm, 25), pt(lm, 27));
            const rk = angle(pt(lm, 24), pt(lm, 26), pt(lm, 28));
            const L = side(lm, 25, 26);
            const knee = L ? lk : rk;
            const [h, k, a, s] = L ? [23, 25, 27, 11] : [24, 26, 28, 12];
            const back = angle(pt(lm, s), pt(lm, h), pt(lm, k));
            if (visGE(lm, h, k, a)) {
                if (knee < 100) stage = "down";
                if (knee >= 160 && stage === "down") { stage = "up"; reps++; }
            }
            let depth = "N/A";
            if (stage === "down") depth = knee <= 100 ? "GOOD DEPTH" : "TOO HIGH";
            else if (stage === "up") depth = "STANDING";
            return { reps, knee_angle: Math.trunc(knee), back_angle: Math.trunc(back), depth_status: depth };
        }
    };
}

function pushups() {
    let reps = 0, stage = null;
    return {
        reset() { reps = 0; stage = null; },
        process(lm) {
            const [s, e, w, h, a] = side(lm, 13, 14) ? [11, 13, 15, 23, 27] : [12, 14, 16, 24, 28];
            const elbow = angle(pt(lm, s), pt(lm, e), pt(lm, w));
            const body = angle(pt(lm, s), pt(lm, h), pt(lm, a));
            const dev = lm[h].y - (lm[s].y + lm[a].y) / 2;
            if (vis(lm, s, e, w, h)) {
                if (elbow < 90) stage = "down";
                if (elbow > 160 && stage === "down") { stage = "up"; reps++; }
            }
            const alignment = body > 160 ? "Straight" : body > 140 ? "Slight Bend" : "Poor Form";
            const hip = Math.abs(dev) <= 0.08 ? "LEVEL" : dev > 0.08 ? "SAGGING" : "PIKED UP";
            return { reps, elbow_angle: Math.trunc(elbow), body_alignment: alignment, hip_status: hip };
        }
    };
}

function curls() {
    let reps = 0, stage = null;
    return {
        reset() { reps = 0; stage = null; },
        process(lm) {
            const [s, e, w] = side(lm, 13, 14) ? [11, 13, 15] : [12, 14, 16];
            const elbow = angle(pt(lm, s), pt(lm, e), pt(lm, w));
            if (vis(lm, s, e, w)) {
                if (elbow < 50) stage = "up";
                if (elbow > 160 && stage === "up") { stage = "down"; reps++; }
            }
            const shoulder = Math.abs(lm[e].x - lm[s].x) <= 0.12 ? "STABLE" : "ELBOW DRIFTING";
            const dx = (lm[11].x + lm[12].x) / 2 - (lm[23].x + lm[24].x) / 2;
            const dy = (lm[11].y + lm[12].y) / 2 - (lm[23].y + lm[24].y) / 2;
            const torso = dy !== 0 ? Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI : 0;
            return {
                reps, elbow_angle: Math.trunc(elbow), shoulder_status: shoulder,
                swing_status: torso <= 15 ? "NO SWING" : "SWINGING"
            };
        }
    };
}

function press() {
    let reps = 0, stage = null;
    return {
        reset() { reps = 0; stage = null; },
        process(lm) {
            const [s, e, w, h, k] = side(lm, 13, 14) ? [11, 13, 15, 23, 25] : [12, 14, 16, 24, 26];
            const elbow = angle(pt(lm, s), pt(lm, e), pt(lm, w));
            if (vis(lm, s, e, w)) {
                // NEW: arm must be extended with the hand ABOVE the shoulder, so a bicep curl is not counted as a press
                if (elbow > 160 && lm[w].y < lm[s].y) stage = "up";
                if (elbow < 90 && stage === "up") { stage = "down"; reps++; }
            }
            const ext = elbow >= 160 ? "FULL EXTENSION" : elbow >= 130 ? "NEARLY EXTENDED"
                : elbow >= 90 ? "PRESSING" : "START POSITION";
            const back = angle(pt(lm, s), pt(lm, h), pt(lm, k));
            const arch = back >= 160 ? "Neutral" : back >= 140 ? "Slight Arch" : "Excessive Arch";
            return { reps, elbow_angle: Math.trunc(elbow), extension_status: ext, back_arch_status: arch };
        }
    };
}

function lunges() {
    let reps = 0, stage = null;
    return {
        reset() { reps = 0; stage = null; },
        process(lm) {
            const lk = angle(pt(lm, 23), pt(lm, 25), pt(lm, 27));
            const rk = angle(pt(lm, 24), pt(lm, 26), pt(lm, 28));
            const L = lk <= rk;
            const front = L ? lk : rk;
            const [h, k, a, s] = L ? [23, 25, 27, 11] : [24, 26, 28, 12];
            if (vis(lm, h, k, a)) {
                if (front < 100) stage = "down";
                if (front > 160 && stage === "down") { stage = "up"; reps++; }
            }
            const torso = angle(pt(lm, s), pt(lm, h), pt(lm, k));
            const off = Math.abs((lm[11].x + lm[12].x) / 2 - (lm[23].x + lm[24].x) / 2);
            return {
                reps, front_knee_angle: Math.trunc(front), torso_angle: Math.trunc(torso),
                balance_status: off <= 0.10 ? "BALANCED" : "OFF BALANCE"
            };
        }
    };
}


// =====================================================================
// DEADLIFT  (SIDE VIEW ONLY: the camera must see you from the side)
// Every line is explained so you can learn from it and change it.
// =====================================================================
function deadlifts() {
    // ---- Numbers you can tune. Change them, save, refresh, test again. ----
    const HIP_BOTTOM = 110;   // hip angle below this = you are down at the bar
    const HIP_LOCKOUT = 165;   // hip angle above this = you are standing tall (lockout)
    const NECK_MIN = 140;   // ear-shoulder-hip angle below this = back/neck line is breaking
    const BAR_MAX = 0.35;  // how far the hands may be from the ankles (as a share of torso length)
    const MIN_REP_MS = 1200;  // a rep cannot be counted faster than this (blocks false counts)

    // ---- Memory: values that survive from one video frame to the next ----
    let reps = 0;              // total reps so far (let = a value that can change)
    let stage = "up";          // "up" = standing, "down" = at the bottom
    let lastRepAt = 0;         // the time the last rep was counted

    return {                   // this object has two functions: reset and process
        reset() {                // called when a new workout starts
            reps = 0;
            stage = "up";
            lastRepAt = 0;
        },

        process(lm) {            // called for every frame. lm = the 33 body points
            // Pick the side of the body the camera sees best (left or right).
            const left = side(lm, 23, 24);
            // Choose the point numbers for that side: ear, shoulder, wrist, hip, knee, ankle.
            // [a, b, c] = [1, 2, 3] means "put the first value in a, second in b, third in c".
            const [ear, sh, wr, hip, knee, ank] = left ? [7, 11, 15, 23, 25, 27]
                : [8, 12, 16, 24, 26, 28];

            // angle(A, B, C) = the angle at B. pt(lm, n) = the x,y position of point n.
            const hipAngle = angle(pt(lm, sh), pt(lm, hip), pt(lm, knee));  // hinge at the hip
            const neckAngle = angle(pt(lm, ear), pt(lm, sh), pt(lm, hip));  // head-to-hip line

            // Length of the torso (shoulder to hip), measured as a straight-line distance.
            const torsoLen = Math.hypot(lm[sh].x - lm[hip].x, lm[sh].y - lm[hip].y);
            // How far the hands are from the ankles sideways. A bar should stay over mid-foot.
            // Math.abs removes the minus sign. We divide by torsoLen so it works at any distance.
            const barOffset = torsoLen > 0 ? Math.abs(lm[wr].x - lm[ank].x) / torsoLen : 0;

            const now = Date.now();  // the current time in milliseconds

            // ---- Rep counting ----
            if (hipAngle < HIP_BOTTOM) {               // you reached the bottom
                stage = "down";
            }
            if (hipAngle > HIP_LOCKOUT && stage === "down") {   // you came back up to lockout
                stage = "up";
                if (now - lastRepAt > MIN_REP_MS) {      // only count if enough time passed
                    reps++;                                // reps = reps + 1
                    lastRepAt = now;
                }
            }

            // ---- Form checks ----
            const hinged = hipAngle < 150;             // true when you are bent over
            // Only judge the back while you are hinged. The ? : is a short if/else.
            const backStatus = !hinged ? "STANDING" : neckAngle >= NECK_MIN ? "NEUTRAL" : "ROUNDING";
            const barStatus = barOffset <= BAR_MAX ? "CLOSE" : "DRIFTING";

            // Send the results back. Math.trunc cuts off the decimals.
            return { reps, hip_angle: Math.trunc(hipAngle), back_status: backStatus, bar_status: barStatus };
        }
    };
}

export const DETECTORS = {
    "Squats": squats(), "Push-ups": pushups(), "Biceps Curls (Dumbbell)": curls(),
    "Shoulder Press": press(), "Lunges": lunges(), "Deadlift": deadlifts()
};

// Sidebar metric labels from your app.py
export const METRIC_LABELS = {
    "Squats": [["knee_angle", "Knee Angle", "°"], ["back_angle", "Back Angle", "°"], ["depth_status", "Depth Status"]],
    "Push-ups": [["elbow_angle", "Elbow Angle", "°"], ["body_alignment", "Body Alignment"], ["hip_status", "Hip Position"]],
    "Biceps Curls (Dumbbell)": [["elbow_angle", "Elbow Angle", "°"], ["shoulder_status", "Shoulder Stability"], ["swing_status", "Swing Detection"]],
    "Shoulder Press": [["elbow_angle", "Elbow Angle", "°"], ["extension_status", "Arm Extension"], ["back_arch_status", "Back Arch"]],
    "Deadlift": [["hip_angle", "Hip Angle", "°"], ["back_status", "Back Position"], ["bar_status", "Bar Path"]],
    "Lunges": [["front_knee_angle", "Front Knee Angle", "°"], ["torso_angle", "Torso Angle", "°"], ["balance_status", "Balance Status"]]
};
export const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
    [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

// Is the body part this exercise needs actually visible? (stops garbage readings when you are just standing there)
const NEED = {
    "Squats": [[23, 25, 27], [24, 26, 28]],
    "Push-ups": [[11, 13, 15, 23, 27], [12, 14, 16, 24, 28]],
    "Biceps Curls (Dumbbell)": [[11, 13, 15, 23], [12, 14, 16, 24]],
    "Shoulder Press": [[11, 13, 15, 23, 25], [12, 14, 16, 24, 26]],
    "Deadlift": [[7, 11, 15, 23, 25, 27], [8, 12, 16, 24, 26, 28]],
    "Lunges": [[23, 24, 25, 26, 27, 28], [23, 24, 25, 26, 27, 28]]
};
export function bodyVisible(ex, lm) {
    return NEED[ex].some(set => set.every(i => lm[i].visibility > 0.6));
}

// Status text your Streamlit version drew on the video
export function statusText(ex, m) {
    if (!m) return "";
    switch (ex) {
        case "Squats": return `DEPTH: ${m.depth_status}`;
        case "Push-ups": return `BODY: ${m.body_alignment} | HIP: ${m.hip_status}`;
        case "Biceps Curls (Dumbbell)": return `SWING: ${m.swing_status}`;
        case "Shoulder Press": return `EXT: ${m.extension_status} | BACK: ${m.back_arch_status}`;
        case "Deadlift": return `BACK: ${m.back_status} | BAR: ${m.bar_status}`;
        case "Lunges": return `BALANCE: ${m.balance_status}`;
    }
    return "";
}