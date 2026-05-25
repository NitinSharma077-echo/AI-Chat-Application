import requests
from app.core.config import OLLAMA_URL, MODEL_NAME, HF_TOKEN, GROQ_API_KEY
from app.db.memory import get_history

_GROQ_URL  = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "llama-3.1-8b-instant"

_HF_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
_HF_URL   = "https://router.huggingface.co/hf-inference/v1/chat/completions"


def generate(
    session_id: str,
    user_message: str,
    images: list[str] | None = None,
    model: str | None = None,
    project_context: str | None = None,
) -> str:
    history = get_history(session_id)

    if GROQ_API_KEY:
        return _groq_generate(history, project_context)
    if HF_TOKEN:
        return _hf_generate(history, project_context)
    return _ollama_generate(history, images, model, project_context)


def _build_messages(history: list, project_context: str | None) -> list:
    messages = []
    if project_context and project_context.strip():
        messages.append({"role": "system", "content": project_context.strip()})
    messages.extend(history)
    return messages


def _groq_generate(history: list, project_context: str | None) -> str:
    try:
        res = requests.post(
            _GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": _GROQ_MODEL,
                "messages": _build_messages(history, project_context),
                "max_tokens": 1024,
            },
            timeout=60,
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"


def _hf_generate(history: list, project_context: str | None) -> str:
    try:
        res = requests.post(
            _HF_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={
                "model": _HF_MODEL,
                "messages": _build_messages(history, project_context),
                "max_tokens": 512,
            },
            timeout=60,
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"


def _ollama_generate(
    history: list,
    images: list[str] | None,
    model: str | None,
    project_context: str | None,
) -> str:
    active_model = model or MODEL_NAME

    prompt = ""
    if project_context and project_context.strip():
        prompt += f"system: {project_context.strip()}\n\n"
    for msg in history:
        prompt += f"{msg['role']}: {msg['content']}\n"
    prompt += "assistant:"

    payload: dict = {"model": active_model, "prompt": prompt, "stream": False}
    if images:
        payload["images"] = images

    try:
        res = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=120,
        )
        res.raise_for_status()
        return res.json().get("response", "")
    except Exception as e:
        return f"Error: {str(e)}"
