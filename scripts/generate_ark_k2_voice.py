#!/usr/bin/env python3
"""Generate the Ark K2 Cantonese and Mandarin voice assets with MiniMax."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import tempfile
import urllib.error
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ark-k2.json"
OUTPUT_DIR = ROOT / "audio" / "ark-k2"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
SECRETS_PATH = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
LOCAL_KEY_PATH = pathlib.Path(os.path.expanduser("~/.minimax-api-key"))
ENDPOINT = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimax.io/v1/t2a_v2")
QUOTA_ENDPOINT = "https://www.minimax.io/v1/token_plan/remains"
QUOTA_RESERVE_PERCENT = 10
MODEL = "speech-2.8-hd"
DEFAULT_VOICE_IDS = {
    "zhHK": "Cantonese_GentleLady",
    "zhCN": "Chinese (Mandarin)_Warm_Girl",
}
VOICE_ENV = {
    "zhHK": "ARK_K2_VOICE_ZHHK",
    "zhCN": "ARK_K2_VOICE_ZHCN",
}
VOICE_IDS = {
    language: os.environ.get(VOICE_ENV[language], DEFAULT_VOICE_IDS[language]).strip()
    or DEFAULT_VOICE_IDS[language]
    for language in ("zhHK", "zhCN")
}
LANGUAGE_BOOSTS = {"zhHK": "Chinese,Yue", "zhCN": "Chinese"}
LANGUAGE_NAMES = {"zhHK": "粵語", "zhCN": "普通話"}
VOICE_CATALOG_SOURCE = "https://platform.minimax.io/docs/faq/system-voice-id"
VOICE_API_SOURCE = "https://api.minimax.io/v1/get_voice"
VOICE_PROFILES = {"zhHK": "Gentle Lady", "zhCN": "Warm Girl"}


class SafeGenerationError(Exception):
    """An error whose message contains no request text, key, or response body."""


def load_data() -> dict:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def ensure_included_quota(key: str) -> None:
    request = urllib.request.Request(
        QUOTA_ENDPOINT,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.loads(response.read())
    except urllib.error.HTTPError as error:
        raise SafeGenerationError(
            f"Included MiniMax quota check returned HTTP {error.code}; no synthesis request made."
        ) from None
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        raise SafeGenerationError("Included MiniMax quota could not be checked; no synthesis request made.") from None

    if (result.get("base_resp") or {}).get("status_code") != 0:
        raise SafeGenerationError("Included MiniMax quota check failed; no synthesis request made.")
    general = next(
        (item for item in result.get("model_remains", []) if item.get("model_name") == "general"),
        None,
    )
    if not general:
        raise SafeGenerationError("Included audio quota was not reported; no synthesis request made.")
    interval = general.get("current_interval_remaining_percent")
    weekly = general.get("current_weekly_remaining_percent")
    if not isinstance(interval, (int, float)) or not isinstance(weekly, (int, float)):
        raise SafeGenerationError("Included audio quota was not measurable; no synthesis request made.")
    if min(interval, weekly) <= QUOTA_RESERVE_PERCENT:
        raise SafeGenerationError(
            f"Included audio quota is at or below the {QUOTA_RESERVE_PERCENT}% reserve; stopped before synthesis."
        )


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
        for item in data["copybook"]["sets"][0]["items"]:
            add(item["voiceKey"], item["label"][language])
        for chapter in data["story"]["chapters"]:
            add(chapter["audio"], chapter["text"][language])
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


def read_generated_details() -> dict[str, dict]:
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    details = {}
    for entry in manifest.get("assets", []):
        if entry.get("status") == "generated" and entry.get("key") and entry.get("language"):
            details[f"{entry['language']}:{entry['key']}"] = {
                "status": "generated",
                "generatedAt": entry.get("generatedAt", "previously generated"),
            }
    return details


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
        "voiceProfiles": VOICE_PROFILES,
        "voiceIdSource": {
            "catalog": VOICE_CATALOG_SOURCE,
            "api": VOICE_API_SOURCE,
            "request": {"voice_type": "system"},
            "responseField": "system_voice[].voice_id",
        },
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
        key = LOCAL_KEY_PATH.read_text(encoding="utf-8").strip()
    except OSError:
        key = ""
    if key:
        return key

    try:
        secrets = json.loads(SECRETS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        secrets = {}
    if isinstance(secrets, dict):
        for name in ("MINIMAX_API_KEY", "minimax-api-key"):
            key = secrets.get(name, "")
            if isinstance(key, str) and key.strip():
                return key.strip()

    raise SafeGenerationError(
        "No MiniMax key found in MINIMAX_API_KEY, ~/.minimax-api-key, or ~/.openclaw/secrets.json."
    )


def request_audio(text: str, language: str, key: str) -> tuple[bytes, int]:
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
            status = response.status
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
    return audio, status


def run_sample_test(data: dict, output_dir: pathlib.Path, key: str) -> int:
    phrase = data["story"]["chapters"][0]["text"]
    output_dir.mkdir(parents=True, exist_ok=True)
    for language in ("zhHK", "zhCN"):
        ensure_included_quota(key)
        audio, status = request_audio(phrase[language], language, key)
        destination = output_dir / f"{language}_story_01.mp3"
        destination.write_bytes(audio)
        print(f"Story sample {language}: HTTP {status}; bytes={len(audio)}; file={destination}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--test", action="store_true", help="generate one story_01 sample in each language")
    action.add_argument("--generate", action="store_true", help="make one API request per pending voice clip")
    parser.add_argument(
        "--test-output-dir",
        type=pathlib.Path,
        default=pathlib.Path(tempfile.gettempdir()) / "ark-k2-voice-tests",
        help="directory outside the repository for the two sample MP3s",
    )
    parser.add_argument("--confirm-monthly-quota", action="store_true", help="confirm included monthly voice quota is available")
    args = parser.parse_args()

    data = load_data()
    assets = build_assets(data)
    if args.test:
        if not args.confirm_monthly_quota:
            raise SafeGenerationError("Sample generation requires --confirm-monthly-quota; no API requests made.")
        return run_sample_test(data, args.test_output_dir, get_key())

    generated_details = read_generated_details()
    write_manifest(assets, generated_details)
    if not args.generate:
        print(f"Plan only: {len(assets)} clips across zhHK/zhCN; no API requests made.")
        print(f"Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
        return 0
    if not args.confirm_monthly_quota:
        raise SafeGenerationError("Generation requires --confirm-monthly-quota; no API requests made.")

    key = get_key()
    for index, asset in enumerate(assets, start=1):
        destination = ROOT / asset["path"]
        if has_audio(destination):
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            ensure_included_quota(key)
            audio, _status = request_audio(asset["text"], asset["language"], key)
        except SafeGenerationError:
            generated_details[f"{asset['language']}:{asset['key']}"] = {
                "status": "failed",
                "failureCode": "SafeGenerationError",
            }
            write_manifest(assets, generated_details)
            raise
        temporary = destination.with_suffix(".mp3.tmp")
        temporary.write_bytes(audio)
        temporary.replace(destination)
        generated_details[f"{asset['language']}:{asset['key']}"] = {
            "status": "generated",
            "generatedAt": utc_now(),
        }
        write_manifest(assets, generated_details)
        print(f"Generated asset {index}/{len(assets)}.")

    write_manifest(assets, generated_details)
    generated_count = sum(has_audio(ROOT / asset["path"]) for asset in assets)
    print(f"Complete: {generated_count}/{len(assets)} clips are present. Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SafeGenerationError as error:
        raise SystemExit(str(error)) from None
