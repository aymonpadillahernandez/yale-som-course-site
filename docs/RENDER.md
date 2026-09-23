# Deploying on Render (two separate services)

Easiest: **New → Blueprint** and pick this repo. `render.yaml` fills in everything.
Doing it by hand instead? Create these two, backend first.

## 1. Web Service (backend)

| Field | Value |
|---|---|
| Language | Python 3 |
| Root Directory | *(leave blank)* |
| Build Command | `pip install -r backend/requirements.txt` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |
| Env var | `PORTKEY_API_KEY` = your key |

Copy the URL it gives you (e.g. `https://yale-som-courses-api.onrender.com`).

## 2. Static Site (frontend)

| Field | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Env var | `VITE_API_URL` = the backend URL from step 1 |
