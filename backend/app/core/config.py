import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL   = os.getenv("OLLAMA_URL",   "http://localhost:11434")
MODEL_NAME   = os.getenv("MODEL_NAME",   "llama3")
MONGODB_URI  = os.getenv("MONGODB_URI",  "mongodb://localhost:27017")
DB_NAME      = os.getenv("DB_NAME",      "chatapp")

JWT_SECRET                  = os.getenv("JWT_SECRET",                  "change-me-in-production")
JWT_ALGORITHM               = os.getenv("JWT_ALGORITHM",               "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS",   "7"))
