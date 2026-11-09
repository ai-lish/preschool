#!/usr/bin/env python3
"""Decode MiniMax JSON-wrapped Noah animal sounds into their MP3 bytes.

Run without options to inspect every file. Pass --apply to replace the wrappers.
All inputs are validated before the first file is written.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import stat
import tempfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOUND_DIR = ROOT / "audio" / "noah" / "sounds"


def is_mp3(data: bytes) -> bool:
    return data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)


def decode_input(path: pathlib.Path) -> tuple[bytes | None, str | None]:
    content = path.read_bytes()
    if is_mp3(content):
        return None, None
    try:
        wrapper = json.loads(content.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, "not an MP3 or valid JSON wrapper"
    payload = wrapper.get("data") if isinstance(wrapper, dict) else None
    audio_hex = payload.get("audio") if isinstance(payload, dict) else None
    if not isinstance(audio_hex, str) or not audio_hex:
        return None, "JSON response has no data.audio payload"
    if len(audio_hex) % 2 or not re.fullmatch(r"[0-9a-fA-F]+", audio_hex):
        return None, "data.audio is not even-length hexadecimal"
    audio = bytes.fromhex(audio_hex)
    if not is_mp3(audio):
        return None, "decoded data.audio does not have an MP3 header"
    return audio, None


def replace_atomically(path: pathlib.Path, data: bytes) -> None:
    mode = stat.S_IMODE(path.stat().st_mode)
    handle, temporary_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(handle, "wb") as temporary:
            temporary.write(data)
            temporary.flush()
            os.fsync(temporary.fileno())
        os.chmod(temporary_name, mode)
        os.replace(temporary_name, path)
    except BaseException:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="replace JSON wrappers after all files pass validation")
    args = parser.parse_args()

    files = sorted(SOUND_DIR.glob("*/*.mp3"))
    if not files:
        print("No sound files found under audio/noah/sounds/. No files changed.")
        return 1

    decoded: list[tuple[pathlib.Path, bytes]] = []
    invalid: list[tuple[pathlib.Path, str]] = []
    already_mp3 = 0
    for path in files:
        try:
            audio, error = decode_input(path)
        except OSError as error:
            invalid.append((path, "file could not be read"))
            continue
        if error:
            invalid.append((path, error))
        elif audio is None:
            already_mp3 += 1
        else:
            decoded.append((path, audio))

    for path, error in invalid:
        print("INVALID " + path.relative_to(ROOT).as_posix() + ": " + error)
    print(f"Preflight: {len(files)} files, {len(decoded)} wrappers ready, {already_mp3} already decoded, {len(invalid)} invalid.")
    if invalid:
        print("No files changed; resolve the listed files before retrying.")
        return 1
    if not args.apply:
        print("Inspection only. Add --apply to replace the validated wrappers.")
        return 0

    for path, audio in decoded:
        replace_atomically(path, audio)
        print("Decoded " + path.relative_to(ROOT).as_posix() + f" ({len(audio)} bytes).")
    print(f"Complete: {len(decoded)} files decoded; {already_mp3} were already MP3.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
