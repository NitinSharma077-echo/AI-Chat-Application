from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.db.memory import ping

app = FastAPI(title="AI Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/")
def root():
    return {"message": "AI Chat Backend Running"}


@app.get("/health")
def health():
    db_ok = ping()
    return {
        "status": "ok" if db_ok else "degraded",
        "mongodb": "connected" if db_ok else "unreachable",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
