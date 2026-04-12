import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL   = os.getenv("OLLAMA_URL",   "http://localhost:11434")
MODEL_NAME   = os.getenv("MODEL_NAME",   "llama3")
MONGODB_URI  = os.getenv("MONGODB_URI",  "mongodb://localhost:27017")
DB_NAME      = os.getenv("DB_NAME",      "chatapp")
