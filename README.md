# Yale SOM Courses

Course catalog site with an AI chat assistant (Lecture 7 app, deployed in Lecture 8).

- `backend/` — FastAPI + PydanticAI agent (Portkey)
- `frontend/` — React + Vite
- `data/` — course data

## Run locally

```bash
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python main.py
```

```bash
cd frontend && npm install && npm run dev
```

Copy `.env.example` to `.env` and add your `PORTKEY_API_KEY`. Never commit `.env`.
