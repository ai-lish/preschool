#!/usr/bin/env python3
"""Generate MiniMax media for the number practice page.

The browser only loads the committed PNG/MP3 assets. API credentials are read
from MINIMAX_API_KEY or the local OpenClaw secrets file and are never written
to the repository.

The page can use a newly generated MiniMax instrumental track when the Music
API is enabled for the account. If the account is not eligible, the regular
``--audio`` workflow continues to reuse the repository's existing MiniMax
Music song and generates the short interaction cues with MiniMax Speech-2.8 HD.

Examples:
  python3 scripts/generate_number_media.py --images
  python3 scripts/generate_number_media.py --audio
  python3 scripts/generate_number_media.py --music --force
  python3 scripts/generate_number_media.py --all
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import time
import urllib.error
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "img" / "numbers"
AUDIO_DIR = ROOT / "audio" / "k2-numbers"
MANIFEST = AUDIO_DIR / "media-manifest.json"
BASE = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimax.io/v1")
TTS_MODEL = "speech-2.8-hd"
TTS_VOICE = os.environ.get("MINIMAX_ZH_VOICE_ID", "female-tianmei")
MUSIC_MODEL = os.environ.get("MINIMAX_MUSIC_MODEL", "music-2.6")
MUSIC_PROMPT = (
    "Bright, gentle instrumental background music for a preschool counting game "
    "for children aged 3 to 6. Playful marimba, soft piano, light hand percussion, "
    "warm strings, simple repeating melody, cheerful and calm, suitable for looping. "
    "No vocals, no singing, no spoken words, no lyrics, no sound effects, no intro, "
    "clean ending."
)
BACKGROUND_SOURCE = ROOT / "alphabet" / "songs" / "a-song.mp3"


IMAGE_SUBJECTS = {
    "apple": "one shiny red apple",
    "orange": "one bright orange fruit",
    "star": "one cheerful golden five-point star",
    "dog": "one friendly small brown puppy",
    "cat": "one cute orange kitten",
    "lion": "one gentle golden lion cub",
    "balloon": "one bright blue party balloon",
    "flower": "one happy pink flower",
    "butterfly": "one colorful butterfly",
    "ice-cream": "one pastel ice cream cone",
}

IMAGE_STYLE = (
    "Cute preschool counting card illustration for children aged 3 to 6. "
    "Show exactly one {subject}, centered and large, with a simple soft pastel "
    "background, clean rounded cartoon shapes, warm cheerful lighting, gentle "
    "hand-painted digital illustration, no text, no numbers, no letters, no "
    "watermark, no border, no extra objects."
)

AUDIO_EFFECTS = {
    "tap": {
        "text": "叮！",
        "emotion": "happy",
    },
    "correct": {
        "text": "答對了！",
        "emotion": "happy",
    },
    "wrong": {
        "text": "再試一次！",
        "emotion": "calm",
    },
    "complete": {
        "text": "完成！太棒了！",
        "emotion": "happy",
    },
}


def get_key() -> str:
    key = os.environ.get("MINIMAX_API_KEY")
    if key:
        return key.strip()

    secrets_path = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
    if secrets_path.exists():
        data = json.loads(secrets_path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and data.get("minimax-api-key"):
            return str(data["minimax-api-key"]).strip()

    raise SystemExit("找不到 MiniMax API key；請設定 MINIMAX_API_KEY 或 OpenClaw secrets.json。")


def request(path: str, payload: dict, timeout: int = 180) -> dict:
    req = urllib.request.Request(
        f"{BASE}/{path}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {get_key()}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MiniMax HTTP {error.code}: {detail[:1000]}") from error


def request_get(path: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        f"{BASE}/{path}",
        headers={"Authorization": f"Bearer {get_key()}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MiniMax HTTP {error.code}: {detail[:1000]}") from error


def nested_value(node, *keys):
    queue = [node]
    while queue:
        current = queue.pop(0)
        if isinstance(current, dict):
            for key in keys:
                if current.get(key):
                    return current[key]
            queue.extend(current.values())
        elif isinstance(current, list):
            queue.extend(current)
    return None


def download(url: str, dest: pathlib.Path) -> None:
    with urllib.request.urlopen(url, timeout=300) as response:
        dest.write_bytes(response.read())


def normalize_image(path: pathlib.Path) -> None:
    """Image-01 may return JPEG bytes even when the requested filename is PNG."""
    normalized = path.with_suffix(".normalized.png")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-frames:v", "1", str(normalized)],
        check=True,
    )
    normalized.replace(path)


def generate_image(name: str, subject: str, force: bool) -> dict:
    dest = IMAGE_DIR / f"{name}.png"
    if dest.exists() and dest.stat().st_size > 1000 and not force:
        print(f"[skip] {dest.relative_to(ROOT)}")
        return {"name": name, "provider": "MiniMax", "model": "image-01", "file": dest.relative_to(ROOT).as_posix()}

    prompt = IMAGE_STYLE.format(subject=subject)
    print(f"[image] MiniMax Image-01 → {dest.name}")
    result = request(
        "image_generation",
        {
            "model": "image-01",
            "prompt": prompt,
            "aspect_ratio": "1:1",
            "n": 1,
            "prompt_optimizer": False,
            "response_format": "url",
        },
    )
    url = nested_value(result, "image_url", "image_urls")
    if isinstance(url, list):
        url = url[0]
    if not url:
        raise RuntimeError(f"Image response has no URL: {result}")
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    download(url, dest)
    normalize_image(dest)
    return {
        "name": name,
        "provider": "MiniMax",
        "model": "image-01",
        "prompt": prompt,
        "file": dest.relative_to(ROOT).as_posix(),
    }


def normalize_audio(source: pathlib.Path, dest: pathlib.Path, duration: float | None) -> None:
    command = [
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(source),
        "-ac", "1", "-ar", "32000", "-b:a", "64k", "-codec:a", "libmp3lame",
    ]
    if duration:
        command.extend(["-t", str(duration), "-af", f"afade=t=out:st={max(duration - 0.25, 0.1)}:d=0.25"])
    command.append(str(dest))
    subprocess.run(command, check=True)


def write_audio_hex(audio_hex: str, dest: pathlib.Path) -> None:
    try:
        dest.write_bytes(bytes.fromhex(audio_hex))
    except ValueError as error:
        raise RuntimeError("MiniMax 音樂回應的 audio 不是有效 hex 音檔") from error


def generate_instrumental_music(force: bool) -> dict:
    dest = AUDIO_DIR / "background.mp3"
    if dest.exists() and dest.stat().st_size > 1000 and not force:
        print(f"[skip] {dest.relative_to(ROOT)}")
        return {
            "name": "background",
            "provider": "MiniMax",
            "model": MUSIC_MODEL,
            "prompt": MUSIC_PROMPT,
            "is_instrumental": True,
            "file": dest.relative_to(ROOT).as_posix(),
        }

    print(f"[music] MiniMax {MUSIC_MODEL} instrumental → {dest.name}")
    result = request(
        "music_generation",
        {
            "model": MUSIC_MODEL,
            "prompt": MUSIC_PROMPT,
            "is_instrumental": True,
            "audio_setting": {
                "sample_rate": 44100,
                "bitrate": 256000,
                "format": "mp3",
            },
        },
        timeout=300,
    )

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    raw = dest.with_suffix(".raw.mp3")
    audio_hex = nested_value(result, "audio")
    if audio_hex:
        write_audio_hex(audio_hex, raw)
    else:
        task_id = nested_value(result, "task_id", "taskId")
        if not task_id:
            raise RuntimeError(f"Music response has no audio or task_id: {result}")

        print(f"[music] task {task_id}; waiting", end="", flush=True)
        for _ in range(90):
            time.sleep(10)
            print(".", end="", flush=True)
            status_result = request_get(f"music_generation/{task_id}")
            status = str(nested_value(status_result, "status") or "").lower()
            if status in {"2", "success", "succeeded", "finished", "completed"}:
                audio_hex = nested_value(status_result, "audio")
                if audio_hex:
                    write_audio_hex(audio_hex, raw)
                    print(" done")
                    break
                url = nested_value(status_result, "audio_url", "download_url")
                if url:
                    download(url, raw)
                    print(" done")
                    break
                raise RuntimeError(f"Music task completed without audio: {status_result}")
            if status in {"3", "failed", "error", "fail"}:
                raise RuntimeError(f"Music task {task_id} failed: {status_result}")
        else:
            raise TimeoutError(f"Music task {task_id} timed out")

    normalize_audio(raw, dest, None)
    raw.unlink(missing_ok=True)
    return {
        "name": "background",
        "provider": "MiniMax",
        "model": MUSIC_MODEL,
        "prompt": MUSIC_PROMPT,
        "is_instrumental": True,
        "file": dest.relative_to(ROOT).as_posix(),
    }


def reuse_background_music() -> dict:
    if not BACKGROUND_SOURCE.exists():
        raise FileNotFoundError(f"Missing existing MiniMax Music asset: {BACKGROUND_SOURCE}")
    print(f"[reuse] MiniMax Music → {BACKGROUND_SOURCE.relative_to(ROOT)}")
    return {
        "name": "background",
        "provider": "MiniMax",
        "model": "music-2.6",
        "source": "existing repository asset",
        "file": BACKGROUND_SOURCE.relative_to(ROOT).as_posix(),
    }


def generate_speech_effect(name: str, spec: dict, force: bool) -> dict:
    dest = AUDIO_DIR / f"{name}.mp3"
    if dest.exists() and dest.stat().st_size > 1000 and not force:
        print(f"[skip] {dest.relative_to(ROOT)}")
        return {"name": name, "provider": "MiniMax", "model": TTS_MODEL, "file": dest.relative_to(ROOT).as_posix()}

    print(f"[audio] MiniMax {TTS_MODEL} → {dest.name}")
    result = request(
        "t2a_v2",
        {
            "model": TTS_MODEL,
            "text": spec["text"],
            "stream": False,
            "language_boost": "Chinese",
            "emotion": spec["emotion"],
            "output_format": "hex",
            "voice_setting": {"voice_id": TTS_VOICE, "speed": 0.9, "vol": 1.0, "pitch": 0},
            "audio_setting": {"sample_rate": 32000, "bitrate": 64000, "format": "mp3", "channel": 1},
        },
    )

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    raw = dest.with_suffix(".raw.mp3")
    audio_hex = nested_value(result, "audio")
    if audio_hex:
        raw.write_bytes(bytes.fromhex(audio_hex))
    else:
        raise RuntimeError(f"TTS result has no audio: {result}")
    normalize_audio(raw, dest, None)
    raw.unlink(missing_ok=True)
    return {
        "name": name,
        "provider": "MiniMax",
        "model": TTS_MODEL,
        "text": spec["text"],
        "emotion": spec["emotion"],
        "file": dest.relative_to(ROOT).as_posix(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", action="store_true")
    parser.add_argument("--audio", action="store_true")
    parser.add_argument("--music", action="store_true", help="生成新的純音樂背景")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--only", help="comma-separated asset names")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if not (args.images or args.audio or args.music or args.all):
        parser.error("請指定 --images、--audio、--music 或 --all")

    selected = {name.strip() for name in args.only.split(",")} if args.only else None
    manifest = {"provider": "MiniMax", "images": [], "audio": []}
    if MANIFEST.exists():
        previous = json.loads(MANIFEST.read_text(encoding="utf-8"))
        manifest["images"] = previous.get("images", [])
        manifest["audio"] = previous.get("audio", [])

    if args.images or args.all:
        generated_images = []
        for name, subject in IMAGE_SUBJECTS.items():
            if selected and name not in selected:
                continue
            generated_images.append(generate_image(name, subject, args.force))
        image_map = {item["name"]: item for item in manifest["images"]}
        image_map.update({item["name"]: item for item in generated_images})
        manifest["images"] = list(image_map.values())

    if args.audio or args.music or args.all:
        generated_audio = []
        if not selected or "background" in selected:
            if args.music:
                generated_audio.append(generate_instrumental_music(args.force))
            else:
                generated_audio.append(reuse_background_music())
        if args.audio or args.all:
            for name, spec in AUDIO_EFFECTS.items():
                if selected and name not in selected:
                    continue
                generated_audio.append(generate_speech_effect(name, spec, args.force))
        audio_map = {item["name"]: item for item in manifest["audio"]}
        audio_map.update({item["name"]: item for item in generated_audio})
        manifest["audio"] = list(audio_map.values())

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"DONE: {len(manifest['images'])} images, {len(manifest['audio'])} audio assets")


if __name__ == "__main__":
    main()
