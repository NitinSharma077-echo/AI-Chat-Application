import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat     import router as chat_router
from app.api.auth     import router as auth_router
from app.api.sessions import router as sessions_router
from app.api.projects import router as projects_router
from app.db.memory    import ping, close, ensure_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not ping():
        raise RuntimeError(
            "Cannot connect to MongoDB. "
            "Check MONGODB_URI in your .env file."
        )
    ensure_indexes()
    yield
    close()


app = FastAPI(title="AI Chat API", lifespan=lifespan)

# CORS — allow origins from env var (comma-separated) or default to all
_raw_origins = os.getenv("CORS_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(projects_router)
app.include_router(chat_router)


@app.get("/")
def root():
    return {"message": "AI Chat Backend Running"}


@app.get("/health")
def health():
    db_ok = ping()
    return {
        "status":  "ok" if db_ok else "degraded",
        "mongodb": "connected" if db_ok else "unreachable",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
