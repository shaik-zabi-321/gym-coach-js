# Apna AI Coach (Flask)

## Setup
1. Copy your `services/` folder (coaching/llm.py, coaching/tts.py, config/workout_config.py) into this folder.
   Add empty `__init__.py` files in each services subfolder if imports fail.
2. `python -m venv venv` then activate it
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and add your GROQ_API_KEY
5. `python app.py` and open http://127.0.0.1:5000

## Test the API without the page
curl -X POST http://127.0.0.1:5000/api/feedback -H "Content-Type: application/json" -d "{\"event\":\"rep_completed\",\"issue\":\"back rounded\"}"

## Deploy (Render/Railway)
Start command: gunicorn app:app
Set GROQ_API_KEY and SECRET_KEY as environment variables.
