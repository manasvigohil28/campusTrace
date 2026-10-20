---
title: CampusTrace AI
emoji: 🔎
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# CampusTrace AI NLP Service

FastAPI microservice using `all-MiniLM-L6-v2` (sentence-transformers).

- `POST /embed` — 384-dim L2-normalized embedding for an item
- `POST /similarity` — cosine similarity between two texts (claim verification)
- `GET /health` — model status

The YAML header above configures Hugging Face Spaces (Docker SDK, port 7860).

## Run locally

```bash
pip install -r requirements.txt
python app.py        # http://127.0.0.1:8000
```
