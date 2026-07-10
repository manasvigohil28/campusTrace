from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import uvicorn
import os
import numpy as np
from typing import List

app = FastAPI(
    title="CampusTrace AI NLP Service",
    description="Microservice for semantic similarity scoring (Phase 4 claims) and embedding generation (Phase 5 matching).",
    version="2.0.0"
)

# Load model globally on startup to prevent reload latency
model_name = "all-MiniLM-L6-v2"
model = None

@app.on_event("startup")
def load_model():
    global model
    print(f"Loading SentenceTransformer model '{model_name}'...")
    try:
        model = SentenceTransformer(model_name)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Failed to load SentenceTransformer model: {str(e)}")

class SimilarityRequest(BaseModel):
    finderText: str
    claimantText: str

class SimilarityResponse(BaseModel):
    similarity: float

# ── Phase 5: Embedding generation ────────────────────────────────────────────
class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]   # L2-normalized 384-dim vector
    dimension: int           # always 384 for all-MiniLM-L6-v2

@app.post("/similarity", response_model=SimilarityResponse)
async def get_similarity(request: SimilarityRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="AI Model is not loaded or initialized yet.")
    
    if not request.finderText.strip() or not request.claimantText.strip():
        # Edge case: empty texts
        return SimilarityResponse(similarity=0.0)
    
    try:
        # Encode strings to embeddings
        emb1 = model.encode(request.finderText, convert_to_tensor=True)
        emb2 = model.encode(request.claimantText, convert_to_tensor=True)
        
        # Calculate Cosine Similarity
        cosine_score = util.cos_sim(emb1, emb2)
        val = float(cosine_score.item())
        
        # Clip to [0.0, 1.0] since negative similarity means no match, and score represents percentage
        val = max(0.0, min(1.0, val))
        
        # Round similarity to 4 decimal places
        return SimilarityResponse(similarity=round(val, 4))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity calculation failed: {str(e)}")

@app.post("/embed", response_model=EmbedResponse)
async def get_embedding(request: EmbedRequest):
    """Phase 5 — Generate a L2-normalized embedding for an item's search text.
    Node.js stores this vector and later computes cosine similarity as a
    plain dot-product (no magnitude calculation needed).
    """
    if model is None:
        raise HTTPException(status_code=503, detail="AI Model not loaded yet.")
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty.")

    try:
        raw = model.encode(request.text, convert_to_numpy=True, normalize_embeddings=False)
        # L2 normalise so dot(a,b) == cosine_sim(a,b)
        norm = np.linalg.norm(raw)
        if norm == 0:
            normalized = raw.tolist()
        else:
            normalized = (raw / norm).tolist()
        return EmbedResponse(embedding=normalized, dimension=len(normalized))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model": model_name if model else None,
        "aiVersion": "2.0",
        "capabilities": ["similarity", "embed"]
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
