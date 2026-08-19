#!/usr/bin/env python3
"""Force-regenerate every A-Z alphabet song with an expressive MiniMax prompt."""

from __future__ import annotations

import importlib.util
import json
import pathlib
import sys
import time


ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE_SCRIPT = pathlib.Path(__file__).with_name("generate_letter_songs.py")
SPEC = importlib.util.spec_from_file_location("openclaw_music_generator", BASE_SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise ImportError(f"Cannot load {BASE_SCRIPT}")
base = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(base)


LETTERS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
SONGS_DIR = ROOT / "alphabet" / "songs"
LYRICS_DIR = SONGS_DIR / "lyrics"
PROGRESS_FILE = SONGS_DIR / "_songs_progress.json"


def clean_lyrics(text: str) -> str:
    """Remove the old intro marker so the first lyric is sung immediately."""
    text = base.normalize_lyrics(text)
    lines = [line for line in text.splitlines() if line.strip().lower() != "[intro]"]
    return "\n".join(lines).strip()


def expressive_style(letter: str, word: str, phrase: str) -> str:
    return (
        "Expressive, joyful children's Bible nursery rhyme for ages 3-6. "
        "Start singing the first lyric within the first beat. "
        "Absolutely no instrumental intro, no spoken intro, no count-in, "
        "no prelude, and no long opening before the first vocal. "
        "Use a warm, smiling, emotionally expressive female vocal with clear "
        "child-friendly pronunciation. Make the verse playful and gentle; "
        "make every chorus brighter, more joyful, and easy for children to "
        "sing along with. Add light ukulele, hand claps, and soft xylophone. "
        f"Bible learning theme about {word}: {phrase}. "
        f"Emphasize the letter {letter} and the word {word}. "
        "Keep the melody memorable, upbeat, and emotionally warm."
    )


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    return {}


def main() -> None:
    SONGS_DIR.mkdir(parents=True, exist_ok=True)
    progress = load_progress()
    results = {}

    print("=" * 60)
    print("A-Z expressive MiniMax music regeneration")
    print("=" * 60)

    for index, letter in enumerate(LETTERS, start=1):
        word, phrase = base.ALPHABET_DATA[letter]
        lyrics_file = LYRICS_DIR / f"{letter.lower()}-{word.lower()}.txt"
        destination = SONGS_DIR / f"{letter.lower()}-song.mp3"
        print(f"\n[{index}/{len(LETTERS)}] {letter} ({word})")

        if not lyrics_file.exists():
            print(f"    ✗ missing lyrics: {lyrics_file}")
            results[letter] = {"word": word, "status": "fail", "error": "no lyrics"}
            continue

        lyrics = clean_lyrics(lyrics_file.read_text(encoding="utf-8"))
        prompt = expressive_style(letter, word, phrase)
        print(f"    lyrics: {len(lyrics.split())} words")
        print("    submitting expressive no-intro track to music-2.6...")
        try:
            base.music_generate_with_retry(prompt, lyrics, destination)
            size_kb = destination.stat().st_size // 1024
            print(f"    ✓ replaced {size_kb}KB → {destination.name}")
            results[letter] = {
                "word": word,
                "status": "ok",
                "size_kb": size_kb,
                "model": "music-2.6",
                "no_intro": True,
                "expressive": True,
            }
        except Exception as error:
            print(f"    ✗ FAIL: {error}")
            results[letter] = {"word": word, "status": "fail", "error": str(error)}

        progress.update(results)
        PROGRESS_FILE.write_text(
            json.dumps(progress, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        time.sleep(1)

    ok = sum(1 for result in results.values() if result["status"] == "ok")
    fail = sum(1 for result in results.values() if result["status"] == "fail")
    print(f"\nDONE: {ok} generated, {fail} fail")


if __name__ == "__main__":
    main()
