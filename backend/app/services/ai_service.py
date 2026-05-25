import requests
from app.core.config import OLLAMA_URL, MODEL_NAME, HF_TOKEN
from app.db.memory import get_history

_HF_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
_HF_URL   = f"https://api-inference.huggingface.co/models/{_HF_MODEL}/v1/chat/completions"


def generate(
    session_id: str,
    user_message: str,
    images: list[str] | None = None,
    model: str | None = None,
    project_context: str | None = None,
) -> str:
    history = get_history(session_id)

    if HF_TOKEN:
        return _hf_generate(history, project_context)
    return _ollama_generate(history, images, model, project_context)


def _hf_generate(history: list, project_context: str | None) -> str:
    messages = []
    if project_context and project_context.strip():
        messages.append({"role": "system", "content": project_context.strip()})
    messages.extend(history)

    try:
        res = requests.post(
            _HF_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={"model": _HF_MODEL, "messages": messages, "max_tokens": 512},
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
