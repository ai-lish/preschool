#!/usr/bin/env python3
"""Re-generate the C-Z alphabet songs with no musical or spoken intro.

This deliberately reuses the existing OpenClaw/MiniMax music workflow so the
API key stays in ~/.openclaw/secrets.json and the output format stays aligned
with the existing alphabet tracks.
"""

from __future__ import annotations

import pathlib
import sys
import time
import importlib.util


_BASE_SCRIPT = pathlib.Path(__file__).with_name("generate_letter_songs.py")
_BASE_SPEC = importlib.util.spec_from_file_location("openclaw_letter_song_generator", _BASE_SCRIPT)
if _BASE_SPEC is None or _BASE_SPEC.loader is None:
    raise ImportError(f"Cannot load {_BASE_SCRIPT}")
base = importlib.util.module_from_spec(_BASE_SPEC)
_BASE_SPEC.loader.exec_module(base)


LETTERS = list("CDEFGHIJKLMNOPQRSTUVWXYZ")


def clean_lyrics(text: str) -> str:
    """Remove an explicit intro marker and leading blank lines."""
    text = base.normalize_lyrics(text)
    lines = [line for line in text.splitlines() if line.strip().lower() != "[intro]"]
    return "\n".join(lines).strip()


def no_intro_style(letter: str, word: str, phrase: str) -> str:
    return (
        "Happy children's nursery rhyme for ages 3-6. "
        "Start singing the first lyric within the first beat. "
        "Absolutely no instrumental intro, no spoken intro, no count-in, "
        "no prelude, and no long opening before the first vocal. "
        "Cheerful ukulele, light clapping rhythm, warm acoustic sound, "
        "sweet clear child-friendly female vocal, slow and easy to sing. "
        f"Bible learning theme about {word}: {phrase}. "
        "Keep the letter and word pronunciation very clear."
    )


def force_batch(letters: list[str], songs_dir: pathlib.Path,
                lyrics_dir: pathlib.Path, progress: dict) -> dict:
    """Generate every requested letter, replacing existing files on success."""
    results = {}
    for letter in letters:
        word, phrase = base.ALPHABET_DATA[letter]
        lyrics_file = lyrics_dir / f"{letter.lower()}-{word.lower()}.txt"
        dest = songs_dir / f"{letter.lower()}-song.mp3"

        if not lyrics_file.exists():
            print(f"\n=== {letter} ({word}) === ✗ missing lyrics: {lyrics_file}")
            results[letter] = {"word": word, "status": "fail", "error": "no lyrics"}
            continue

        lyrics = clean_lyrics(lyrics_file.read_text(encoding="utf-8"))
        prompt = no_intro_style(letter, word, phrase)
        print(f"\n=== {letter} ({word}) ===")
        print(f"    lyrics: {len(lyrics.split())} words")
        print("    submitting no-intro track to music-2.6...")
        try:
            base.music_generate_with_retry(prompt, lyrics, dest)
            size_kb = dest.stat().st_size // 1024
            print(f"    ✓ replaced {size_kb}KB → {dest.name}")
            results[letter] = {"word": word, "status": "ok", "size_kb": size_kb,
                              "no_intro": True}
        except Exception as error:
            print(f"    ✗ FAIL: {error}")
            results[letter] = {"word": word, "status": "fail", "error": str(error)}
        time.sleep(1)
    return results


def main() -> None:
    songs_dir = pathlib.Path("alphabet/songs")
    lyrics_dir = songs_dir / "lyrics"
    songs_dir.mkdir(parents=True, exist_ok=True)

    original_args = sys.argv[:]
    try:
        # Reuse the existing batch/progress writer, but force all C-Z files.
        base.run_batch = force_batch
        sys.argv = [sys.argv[0], "C-Z"]
        base.main()
    finally:
        sys.argv = original_args


if __name__ == "__main__":
    main()
