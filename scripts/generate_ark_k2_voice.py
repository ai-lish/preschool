#!/usr/bin/env python3
"""Generate the Ark K2 Cantonese and Mandarin voice assets with MiniMax."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import urllib.error
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ark-k2.json"
OUTPUT_DIR = ROOT / "audio" / "ark-k2"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
SECRETS_PATH = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
ENDPOINT = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimax.io/v1/t2a_v2")
MODEL = "speech-2.8-hd"
VOICE_IDS = {"zhHK": "61", "zhCN": "3"}
LANGUAGE_BOOSTS = {"zhHK": "Chinese,Yue", "zhCN": "Chinese"}
LANGUAGE_NAMES = {"zhHK": "粵語", "zhCN": "普通話"}


class SafeGenerationError(Exception):
    """An error whose message contains no request text, key, or response body."""


def load_data() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def build_assets(data: dict) -> list[dict]:
    assets: list[dict] = []
    for language in ("zhHK", "zhCN"):
        def add(key: str, phrase: str) -> None:
            filename = f"{key}.mp3"
            assets.append({
                "key": key,
                "language": language,
                "languageName": LANGUAGE_NAMES[language],
                "languageBoost": LANGUAGE_BOOSTS[language],
                "voiceId": VOICE_IDS[language],
                "filename": filename,
                "path": f"audio/ark-k2/{language}/{filename}",
                "text": phrase,
            })

        for level in data["levels"]:
            add(level["voiceKey"], level["instruction"][language])
        for animal in data["animals"]:
            add(animal["voiceKey"], animal["label"][language])
        for character in data["characters"]:
            add(character["voiceKey"], character["label"][language])
        for number in range(1, 11):
            add(f"number_{number}", data["numberWords"][language][number])
        for clip in data["voice"]["clips"]:
            add(clip["key"], clip["text"][language])
    return assets


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def has_audio(path: pathlib.Path) -> bool:
    if not path.is_file() or path.stat().st_size < 1024:
        return False
    with path.open("rb") as stream:
        header = stream.read(4)
    return header.startswith(b"ID3") or (len(header) >= 2 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0)


def write_manifest(assets: list[dict], generated: dict[str, dict] | None = None) -> None:
    generated = generated or {}
    entries = []
    for asset in assets:
        path = ROOT / asset["path"]
        details = generated.get(f"{asset['language']}:{asset['key']}", {})
        status = "generated" if has_audio(path) else details.get("status", "pending")
        entry = {
            "key": asset["key"],
            "language": asset["language"],
            "languageBoost": asset["languageBoost"],
            "voiceId": asset["voiceId"],
            "filename": asset["filename"],
            "path": asset["path"],
            "text": asset["text"],
            "status": status,
        }
        if status == "generated":
            entry["sizeBytes"] = path.stat().st_size
            entry["generatedAt"] = details.get("generatedAt", "previously generated")
        if details.get("failureCode"):
            entry["failureCode"] = details["failureCode"]
        entries.append(entry)

    manifest = {
        "version": 1,
        "model": MODEL,
        "voiceIds": VOICE_IDS,
        "monthlyQuotaOnly": True,
        "generatedCount": sum(entry["status"] == "generated" for entry in entries),
        "plannedCount": len(entries),
        "updatedAt": utc_now(),
        "assets": entries,
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    temporary = MANIFEST_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(MANIFEST_PATH)


def get_key() -> str:
    key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if key:
        return key
    try:
        secrets = json.loads(SECRETS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raise SafeGenerationError("No key found in MINIMAX_API_KEY or ~/.openclaw/secrets.json.") from None
    key = secrets.get("minimax-api-key", "") if isinstance(secrets, dict) else ""
    if not isinstance(key, str) or not key.strip():
        raise SafeGenerationError("The expected minimax-api-key entry is missing from ~/.openclaw/secrets.json.")
    return key.strip()


def request_audio(text: str, language: str, key: str) -> bytes:
    payload = {
        "model": MODEL,
        "text": text,
        "stream": False,
        "language_boost": LANGUAGE_BOOSTS[language],
        "output_format": "hex",
        "voice_setting": {
            "voice_id": VOICE_IDS[language],
            "speed": 1.0,
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
        ENDPOINT,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.loads(response.read())
    except urllib.error.HTTPError as error:
        raise SafeGenerationError(f"MiniMax returned HTTP {error.code}; stopped without retrying.") from None
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        raise SafeGenerationError("The MiniMax request failed; stopped without retrying.") from None

    if (result.get("base_resp") or {}).get("status_code") != 0:
        raise SafeGenerationError("MiniMax returned an unsuccessful response; stopped without retrying.")
    audio_hex = (result.get("data") or {}).get("audio")
    if not isinstance(audio_hex, str):
        raise SafeGenerationError("MiniMax response contained no audio; stopped without retrying.")
    try:
        audio = bytes.fromhex(audio_hex)
    except ValueError:
        raise SafeGenerationError("MiniMax returned invalid audio data; stopped without retrying.") from None
    if len(audio) < 1024 or not (audio.startswith(b"ID3") or (audio[0] == 0xFF and audio[1] & 0xE0 == 0xE0)):
        raise SafeGenerationError("MiniMax returned an invalid MP3; stopped without retrying.")
    return audio


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate", action="store_true", help="make one API request per pending voice clip")
    parser.add_argument("--confirm-monthly-quota", action="store_true", help="confirm the account has enough included monthly TTS quota")
    args = parser.parse_args()

    data = load_data()
    assets = build_assets(data)
    write_manifest(assets)
    if not args.generate:
        print(f"Plan only: {len(assets)} clips across zhHK/zhCN; no API requests made.")
        print(f"Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
        return 0
    if not args.confirm_monthly_quota:
        raise SafeGenerationError("Generation requires --confirm-monthly-quota; no API requests made.")

    key = get_key()
    completed = 0
    for index, asset in enumerate(assets, start=1):
        destination = ROOT / asset["path"]
        if has_audio(destination):
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            audio = request_audio(asset["text"], asset["language"], key)
        except SafeGenerationError as error:
            write_manifest(assets, {f"{asset['language']}:{asset['key']}": {
                "status": "failed",
                "failureCode": type(error).__name__,
            }})
            raise
        temporary = destination.with_suffix(".mp3.tmp")
        temporary.write_bytes(audio)
        temporary.replace(destination)
        completed += 1
        write_manifest(assets, {f"{asset['language']}:{asset['key']}": {
            "status": "generated",
            "generatedAt": utc_now(),
        }})
        print(f"Generated {completed} new clips; processed asset {index}/{len(assets)}.")

    write_manifest(assets)
    generated_count = sum(has_audio(ROOT / asset["path"]) for asset in assets)
    print(f"Complete: {generated_count}/{len(assets)} clips are present. Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SafeGenerationError as error:
        raise SystemExit(str(error)) from None
