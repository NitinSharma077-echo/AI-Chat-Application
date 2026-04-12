import requests
from app.core.config import OLLAMA_URL, MODEL_NAME
from app.db.memory import get_history


def generate(
    session_id: str,
    user_message: str,
    images: list[str] | None = None,
    model: str | None = None,
    project_context: str | None = None,
) -> str:
    """
    Build a prompt from session history and call Ollama.

    Parameters
    ----------
    session_id      : UUID identifying the chat session
    user_message    : The current user message (already stored in DB by the caller)
    images          : Optional list of base64-encoded image strings (vision models only)
    model           : Model name override; falls back to MODEL_NAME env var
    project_context : Optional shared system prompt from the project folder
    """
    history      = get_history(session_id)
    active_model = model or MODEL_NAME

    # Prepend project shared context as a system-level instruction
    prompt = ""
    if project_context and project_context.strip():
        prompt += f"system: {project_context.strip()}\n\n"

    for msg in history:
        prompt += f"{msg['role']}: {msg['content']}\n"
    prompt += "assistant:"

    payload: dict = {
        "model":  active_model,
        "prompt": prompt,
        "stream": False,
    }
    if images:
        payload["images"] = images   # Ollama passes these to multimodal models

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        return f"Error: {str(e)}"
