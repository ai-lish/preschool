#!/usr/bin/env python3
"""Generate the alphabet game's expressive MiniMax TTS voice pack.

The browser loads these MP3s as static assets.  No API key is ever shipped to
GitHub Pages, and the page does not need Web Speech API support.
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
OUTPUT_DIR = ROOT / "alphabet" / "audio" / "voices"
MANIFEST = ROOT / "alphabet" / "audio" / "voice-manifest.json"
SECRETS_PATH = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
BASE = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimax.io/v1")
MODEL = "speech-2.8-hd"
VOICE_ID = os.environ.get("MINIMAX_VOICE_ID", "English_expressive_narrator")

LETTER_DATA = {
    "A": ("Adam", "the first man God made", "short A"),
    "B": ("Bible", "God's special book", "B"),
    "C": ("Creation", "God made the world", "K"),
    "D": ("David", "a brave boy who trusted God", "D"),
    "E": ("Eden", "God's beautiful garden", "long E"),
    "F": ("Fish", "God made fish in the sea", "F"),
    "G": ("God", "God loves you so much", "G"),
    "H": ("Heaven", "God's home above the sky", "H"),
    "I": ("Isaac", "God's promise son", "short I"),
    "J": ("Jesus", "God's Son who loves us", "J"),
    "K": ("King", "the King of kings", "K"),
    "L": ("Lamb", "Jesus is the Lamb", "L"),
    "M": ("Moses", "he led God's people", "M"),
    "N": ("Noah", "he built a big boat", "N"),
    "O": ("Olive", "a tree of peace", "short O"),
    "P": ("Prayer", "talking to God", "P"),
    "Q": ("Queen", "Queen Esther was brave", "Q"),
    "R": ("Rainbow", "God's promise in the sky", "R"),
    "S": ("Star", "twinkling up above", "S"),
    "T": ("Temple", "God's house to pray", "T"),
    "U": ("Universe", "God made everything", "long U"),
    "V": ("Vine", "Jesus is the true vine", "V"),
    "W": ("Water", "from the river of life", "W"),
    "X": ("foX", "Samson's tricky friend", "X"),
    "Y": ("Youth", "young and strong for God", "Y"),
    "Z": ("Zion", "God's holy mountain", "Z"),
}


def get_key() -> str:
    key = os.environ.get("MINIMAX_API_KEY")
    if not key:
        key = json.loads(SECRETS_PATH.read_text(encoding="utf-8"))["minimax-api-key"]
    print(f"[setup] MiniMax key loaded ({len(key)} chars)")
    return key


KEY = get_key()


def request_tts(text: str, emotion: str = "happy") -> bytes:
    payload = {
        "model": MODEL,
        "text": text,
        "stream": False,
        "language_boost": "English",
        "output_format": "hex",
        "emotion": emotion,
        "voice_setting": {
            "voice_id": VOICE_ID,
            "speed": 0.92,
            "vol": 1.0,
            "pitch": 1,
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
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {KEY}",
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
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
            "-ac", "1", "-ar", "32000", "-b:a", "64k",
            "-codec:a", "libmp3lame", "-id3v2_version", "3", str(dest),
        ],
        check=True,
    )


def build_assets() -> list[dict]:
    assets: list[dict] = []
    for letter, (word, phrase, sound) in LETTER_DATA.items():
        assets.extend([
            {
                "name": f"phonics-{letter.lower()}",
                "text": (
                    f"Letter {letter}! <#0.15#> It makes the {sound} sound! "
                    f"<#0.15#> {word}! {phrase}."
                ),
                "emotion": "happy",
                "group": "phonics",
                "letter": letter,
            },
            {
                "name": f"challenge-{letter.lower()}",
                "text": f"Pop the letter {letter}! (laughs) {letter} is for {word}!",
                "emotion": "happy",
                "group": "challenge",
                "letter": letter,
            },
            {
                "name": f"say-{letter.lower()}",
                "text": f"Letter {letter}. {word}.",
                "emotion": "calm",
                "group": "say",
                "letter": letter,
            },
        ])

    generic = [
        ("feedback-success", "Wonderful! You completed it!", "happy"),
        ("feedback-try-again", "Try again! You can do it!", "happy"),
        ("feedback-great-job", "Great job!", "happy"),
        ("feedback-awesome", "Awesome!", "happy"),
        ("feedback-star", "You're a star!", "happy"),
        ("feedback-incredible", "Incredible!", "surprised"),
        ("feedback-fantastic", "Fantastic!", "happy"),
        ("feedback-practice-complete", "Great job! You finished your letter practice!", "happy"),
        ("feedback-one-more-star", "Amazing! One more star!", "surprised"),
        ("feedback-next-letter", "You are a Bible Star! Let's learn the next letter!", "surprised"),
        ("feedback-ready", "Ready to practise!", "happy"),
        ("prompt-match", "Find the small letter that matches!", "happy"),
        ("prompt-sound", "Find the word for this letter!", "happy"),
        ("prompt-x-sound", "Which word has the X sound at the end?", "surprised"),
        ("prompt-order", "What letter comes next?", "surprised"),
        ("feedback-correct", "Yes! Great choice!", "happy"),
    ]
    assets.extend(
        {"name": name, "text": text, "emotion": emotion, "group": "feedback"}
        for name, text, emotion in generic
    )
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
        last_error = None
        for attempt in range(4):
            try:
                raw = dest.with_suffix(".raw.mp3")
                raw.write_bytes(request_tts(asset["text"], asset["emotion"]))
                normalize_audio(raw, dest)
                raw.unlink(missing_ok=True)
                completed.append({**asset, "file": dest.relative_to(ROOT).as_posix()})
                print(f"    ✓ {dest.stat().st_size // 1024}KB")
                break
            except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError, OSError) as error:
                last_error = error
                if attempt == 3:
                    raise RuntimeError(f"Failed {asset['name']}: {error}") from error
                wait = (2, 5, 12)[attempt]
                print(f"    retry {attempt + 1}/3 in {wait}s: {error}")
                time.sleep(wait)
        time.sleep(0.35)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    manifest = {
        "model": MODEL,
        "voice_id": VOICE_ID,
        "emotion_support": True,
        "audio": completed,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"DONE: {len(completed)} assets; manifest={MANIFEST}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Generate one asset first, e.g. phonics-a")
    parser.add_argument("--force", action="store_true", help="Regenerate existing assets")
    args = parser.parse_args()
    generate(args.only, args.force)
