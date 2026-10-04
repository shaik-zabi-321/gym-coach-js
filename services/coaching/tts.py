from io import BytesIO
from gtts import gTTS


class TextToSpeech :
    def speak(self, text, lang="en"):
        cleaned = (text or "").strip()
        if not cleaned:
            return None
        buffer = BytesIO()
        gTTS(text=cleaned, lang=lang).write_to_fp(buffer)
        return buffer.getvalue()
