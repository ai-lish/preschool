"""共用 MiniMax 客戶端 — 金鑰一律讀環境變數，絕不硬編碼。"""
import os, time, json, base64, pathlib, urllib.request, urllib.error

BASE = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimax.io/v1")


def _key() -> str:
    k = os.environ.get("MINIMAX_API_KEY")
    if not k:
        raise SystemExit(
            "缺少 MINIMAX_API_KEY。\n"
            "  export MINIMAX_API_KEY=...   或建立 .env 後 `set -a; source .env; set +a`"
        )
    return k


def _post(path: str, payload: dict, timeout: int = 180) -> dict:
    req = urllib.request.Request(
        f"{BASE}/{path}",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {_key()}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def _get(path: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(f"{BASE}/{path}", headers={"Authorization": f"Bearer {_key()}"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def _download(url: str, dest: pathlib.Path) -> pathlib.Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=300) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def text_to_image(prompt: str, dest: pathlib.Path, aspect: str = "1:1") -> pathlib.Path:
    # prompt_optimizer 關掉：prompt 已經很詳細，讓它重寫只會製造變異與雜點
    r = _post("image_generation", {
        "model": "image-01", "prompt": prompt, "aspect_ratio": aspect,
        "n": 1, "prompt_optimizer": False, "response_format": "url",
    })
    url = r["data"]["image_urls"][0]
    return _download(url, dest)


def text_to_audio(text: str, dest: pathlib.Path, voice_id: str = "female-tianmei",
                  model: str = "speech-2.5-hd-preview") -> pathlib.Path:
    r = _post("t2a_v2", {
        "model": model, "text": text, "stream": False,
        "voice_setting": {"voice_id": voice_id, "speed": 0.9, "vol": 1.0, "pitch": 0},
        "audio_setting": {"sample_rate": 32000, "bitrate": 64000, "format": "mp3", "channel": 1},
    })
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(bytes.fromhex(r["data"]["audio"]))
    return dest


def music_generation(prompt: str, lyrics: str, dest: pathlib.Path,
                     poll: int = 10, tries: int = 60) -> pathlib.Path:
    task = _post("music_generation", {
        "model": "music-2.6", "prompt": prompt, "lyrics": lyrics,
        "audio_setting": {"sample_rate": 32000, "bitrate": 64000, "format": "mp3"},
    })
    tid = task.get("task_id") or task.get("data", {}).get("task_id")
    for _ in range(tries):
        time.sleep(poll)
        s = _get(f"music_generation/{tid}")
        status = (s.get("status") or s.get("data", {}).get("status") or "").lower()
        if status in ("success", "succeeded", "finished"):
            d = s.get("data", s)
            if d.get("audio"):
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(bytes.fromhex(d["audio"]))
                return dest
            return _download(d.get("audio_url") or d["download_url"], dest)
        if status in ("failed", "error"):
            raise RuntimeError(f"music task {tid} failed: {s}")
    raise TimeoutError(f"music task {tid} timed out")
