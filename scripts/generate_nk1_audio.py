#!/usr/bin/env python3
"""Generate the six N/K1 Cantonese clips using the included MiniMax quota only."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import tempfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "audio" / "nk1"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
MODEL = "speech-2.8-hd"
VOICE_ID = "Cantonese_GentleLady"
LANGUAGE = "zhHK"
LANGUAGE_BOOST = "Chinese,Yue"
CLIPS = [
    ("welcome", "揀一樣嚟玩"),
    ("alphabet_song", "字母唱歌"),
    ("shapes", "形狀"),
    ("recognize_picture_words", "認圖認字"),
    ("counting", "數一數"),
    ("doodle_drawing", "塗鴉畫畫"),
]


def generated_at() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate", action="store_true", help="synthesize missing audio files")
    parser.add_argument("--confirm-monthly-quota", action="store_true", help="confirm use of the included monthly voice quota")
    args = parser.parse_args()

    assets = [{
        "key": key,
        "language": LANGUAGE,
        "languageName": "粵語",
        "languageBoost": LANGUAGE_BOOST,
        "voiceId": VOICE_ID,
        "filename": key + ".mp3",
        "path": "audio/nk1/" + key + ".mp3",
        "text": phrase,
    } for key, phrase in CLIPS]

    if not args.generate:
        print("Plan only: six Cantonese clips; no API requests made.")
        print("Model: " + MODEL + "; voice_id: " + VOICE_ID + "; language_boost: " + LANGUAGE_BOOST)
        return 0
    if not args.confirm_monthly_quota:
        raise SystemExit("Generation requires --confirm-monthly-quota; no API requests made.")

    try:
        import generate_ark_k2_voice as ark_voice
    except ImportError:
        raise SystemExit("Could not load the shared Ark voice key and quota safeguards; no API requests made.") from None

    if ark_voice.VOICE_IDS.get(LANGUAGE) != VOICE_ID:
        raise SystemExit("The configured Cantonese voice differs from the approved N/K1 voice; no API requests made.")

    key = ark_voice.get_key()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = {}
    try:
        old_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        existing = {item.get("key"): item for item in old_manifest.get("assets", []) if item.get("status") == "generated"}
    except (OSError, json.JSONDecodeError):
        pass

    for index, asset in enumerate(assets, start=1):
        destination = ROOT / asset["path"]
        if ark_voice.has_audio(destination):
            existing[asset["key"]] = {
                **asset,
                "status": "generated",
                "sizeBytes": destination.stat().st_size,
                "generatedAt": existing.get(asset["key"], {}).get("generatedAt", "previously generated"),
            }
            continue
        try:
            ark_voice.ensure_included_quota(key)
            audio, status = ark_voice.request_audio(asset["text"], LANGUAGE, key)
        except ark_voice.SafeGenerationError as error:
            raise SystemExit(str(error)) from None
        temporary = destination.with_suffix(".mp3.tmp")
        temporary.write_bytes(audio)
        temporary.replace(destination)
        existing[asset["key"]] = {
            **asset,
            "status": "generated",
            "sizeBytes": len(audio),
            "generatedAt": generated_at(),
        }
        print("Generated asset " + str(index) + "/" + str(len(assets)) + "; HTTP " + str(status) + ".")

    entries = []
    for asset in assets:
        details = existing.get(asset["key"], {})
        destination = ROOT / asset["path"]
        status = "generated" if ark_voice.has_audio(destination) else "pending"
        entry = {**asset, "status": status}
        if status == "generated":
            entry["sizeBytes"] = destination.stat().st_size
            entry["generatedAt"] = details.get("generatedAt", "previously generated")
        entries.append(entry)

    manifest = {
        "version": 1,
        "model": MODEL,
        "voiceIds": {LANGUAGE: VOICE_ID},
        "monthlyQuotaOnly": True,
        "voiceSource": "Existing repo-approved MiniMax system voice; no voice cloning.",
        "generatedCount": sum(item["status"] == "generated" for item in entries),
        "plannedCount": len(entries),
        "updatedAt": generated_at(),
        "assets": entries,
    }
    temporary_manifest = MANIFEST_PATH.with_suffix(".json.tmp")
    temporary_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_manifest.replace(MANIFEST_PATH)
    print("Complete: " + str(manifest["generatedCount"]) + "/" + str(manifest["plannedCount"]) + " clips.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
