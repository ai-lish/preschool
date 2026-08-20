#!/usr/bin/env python3
"""Generate the MiniMax voice pack shared by the K2 learning pages.

The browser only loads the generated MP3 files. API credentials stay outside
the repository, and the pages do not use the Web Speech API.
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
OUTPUT_DIR = ROOT / "audio" / "core-voices"
MANIFEST = OUTPUT_DIR / "manifest.json"
BASE = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimax.io/v1")
MODEL = "speech-2.8-hd"
VOICE_IDS = {
    "Chinese": os.environ.get("MINIMAX_ZH_VOICE_ID", "female-tianmei"),
    "English": os.environ.get("MINIMAX_EN_VOICE_ID", "English_expressive_narrator"),
}


NUMBER_WORDS = [
    "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
]

# This is the union of the K2 writing page and the character flashcard page.
CHARACTER_DATA = [
    ("yi", "一", "數字一", "one"),
    ("er", "二", "數字二", "two"),
    ("san", "三", "數字三", "three"),
    ("si", "四", "數字四", "four"),
    ("wu", "五", "數字五", "five"),
    ("ren", "人", "人", "person"),
    ("da", "大", "大", "big"),
    ("xiao", "小", "小", "small"),
    ("ri", "日", "太陽／日子", "sun or day"),
    ("yue", "月", "月亮", "moon"),
    ("shui", "水", "水", "water"),
    ("huo", "火", "火", "fire"),
    ("shan", "山", "山", "mountain"),
    ("mu", "木", "樹木", "tree or wood"),
    ("kou", "口", "口", "mouth"),
    ("tian", "天", "天空", "sky or day"),
    ("di", "地", "大地", "earth or ground"),
    ("shang", "上", "上面", "up or above"),
    ("xia", "下", "下面", "down or below"),
    ("zuo", "左", "左面", "left"),
    ("you", "右", "右面", "right"),
]


def get_key() -> str:
    key = os.environ.get("MINIMAX_API_KEY")
    if not key:
        secrets_path = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
        key = json.loads(secrets_path.read_text(encoding="utf-8"))["minimax-api-key"]
    return key


def request_tts(text: str, language: str, emotion: str) -> bytes:
    payload = {
        "model": MODEL,
        "text": text,
        "stream": False,
        "language_boost": language,
        "output_format": "hex",
        "emotion": emotion,
        "voice_setting": {
            "voice_id": VOICE_IDS[language],
            "speed": 0.9,
            "vol": 1.0,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 64000,
            "format": "mp3",
            "channel": 1,
        },
    }
    request = urllib.request.Request(
        f"{BASE}/t2a_v2",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {get_key()}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.loads(response.read())

    base = result.get("base_resp") or {}
    if base.get("status_code") != 0:
        raise RuntimeError(f"TTS error: {base.get('status_msg') or result}")
    audio_hex = (result.get("data") or {}).get("audio")
    if not audio_hex:
        raise RuntimeError(f"TTS response has no audio: {result}")
    return bytes.fromhex(audio_hex)


def normalize_audio(raw: pathlib.Path, dest: pathlib.Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
            "-ac", "1", "-ar", "32000", "-b:a", "64k",
            "-codec:a", "libmp3lame", "-id3v2_version", "3", str(dest),
        ],
        check=True,
    )


def build_assets() -> list[dict]:
    assets = []
    for index, word in enumerate(NUMBER_WORDS, start=1):
        assets.append({
            "name": f"number-{index}",
            "text": f"{word}，數字 {index}。",
            "language": "Chinese",
            "emotion": "calm",
            "group": "numbers",
            "number": index,
        })

    for key, char, chinese, english in CHARACTER_DATA:
        assets.extend([
            {
                "name": f"character-{key}-zh",
                "text": f"{char}，{chinese}。",
                "language": "Chinese",
                "emotion": "happy",
                "group": "characters",
                "character": char,
                "voice_key": key,
                "variant": "zh",
            },
            {
                "name": f"character-{key}-en",
                "text": f"{english}.",
                "language": "English",
                "emotion": "calm",
                "group": "characters",
                "character": char,
                "voice_key": key,
                "variant": "en",
            },
        ])

    assets.extend([
        {
            "name": "feedback-correct-zh",
            "text": "好棒，答對了！",
            "language": "Chinese",
            "emotion": "happy",
            "group": "feedback",
        },
        {
            "name": "feedback-match-complete-zh",
            "text": "全部配對！太棒了！",
            "language": "Chinese",
            "emotion": "happy",
            "group": "feedback",
        },
    ])
    return assets


def generate(only: str | None = None, force: bool = False) -> None:
    assets = build_assets()
    if only:
        assets = [asset for asset in assets if asset["name"] == only]
        if not assets:
            raise SystemExit(f"Unknown asset: {only}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    completed = []
    for index, asset in enumerate(assets, start=1):
        dest = OUTPUT_DIR / f"{asset['name']}.mp3"
        if dest.exists() and dest.stat().st_size > 1000 and not force:
            print(f"[{index}/{len(assets)}] skip {dest.name}")
            completed.append({**asset, "file": dest.relative_to(ROOT).as_posix(), "skipped": True})
            continue

        print(f"[{index}/{len(assets)}] MiniMax {asset['name']}: {asset['emotion']}")
        for attempt in range(4):
            raw = dest.with_suffix(".raw.mp3")
            try:
                raw.write_bytes(request_tts(asset["text"], asset["language"], asset["emotion"]))
                normalize_audio(raw, dest)
                raw.unlink(missing_ok=True)
                completed.append({**asset, "file": dest.relative_to(ROOT).as_posix()})
                print(f"    ✓ {dest.stat().st_size // 1024}KB")
                break
            except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError, OSError) as error:
                raw.unlink(missing_ok=True)
                if attempt == 3:
                    raise RuntimeError(f"Failed {asset['name']}: {error}") from error
                wait = (2, 5, 12)[attempt]
                print(f"    retry {attempt + 1}/3 in {wait}s: {error}")
                time.sleep(wait)
        time.sleep(0.35)

    MANIFEST.write_text(json.dumps({
        "model": MODEL,
        "voice_ids": VOICE_IDS,
        "emotion_support": True,
        "audio": completed,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"DONE: {len(completed)} assets; manifest={MANIFEST}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Generate one asset first, e.g. number-1")
    parser.add_argument("--force", action="store_true", help="Regenerate existing assets")
    args = parser.parse_args()
    generate(args.only, args.force)
