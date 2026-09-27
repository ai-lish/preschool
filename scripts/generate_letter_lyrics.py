"""
generate_letter_lyrics.py — Phase 1: lyrics for letters C-Z (24 songs).
Reads API key from secrets.json directly (no shell env dependency).

Per Zach 2026-08-06:
- 24 lyrics (C-Z), Word from ALPHABET_DATA
- English, short, 3-6 yo singable, [Verse]/[Chorus]/[Outro] structure
- Chorus must repeat '{Letter} is for {Word}'
- Batch 6 letters per run (C-H, I-N, O-T, U-Z); 10s sleep between batches
- 429 / "overloaded" → exponential backoff (5s, 15s, 30s), 3 retries
"""

from __future__ import annotations
import os, sys, json, time, urllib.request, urllib.error, pathlib, re

# ─── Setup ─────────────────────────────────────────────────────────────────
SECRETS_PATH = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
API_KEY = os.environ.get("MINIMAX_API_KEY")
if not API_KEY:
    API_KEY = json.load(open(SECRETS_PATH))["minimax-api-key"]
print(f"[setup] key length: {len(API_KEY)} (from {'env' if os.environ.get('MINIMAX_API_KEY') else 'secrets.json'})")
BASE = "https://api.minimax.io/v1"

ALPHABET_DATA = {
    "A": {"word": "Adam", "phrase": "The first man God made."},
    "B": {"word": "Bible", "phrase": "God's special book."},
    "C": {"word": "Creation", "phrase": "God made the world."},
    "D": {"word": "David", "phrase": "A brave boy who trusted God."},
    "E": {"word": "Eden", "phrase": "God's beautiful garden."},
    "F": {"word": "Fish", "phrase": "God made the fish in the sea."},
    "G": {"word": "God", "phrase": "God loves you so much."},
    "H": {"word": "Heaven", "phrase": "God's home above the sky."},
    "I": {"word": "Isaac", "phrase": "God's promise son."},
    "J": {"word": "Jesus", "phrase": "God's Son who loves us."},
    "K": {"word": "King", "phrase": "The King of kings."},
    "L": {"word": "Lamb", "phrase": "Jesus is the Lamb of God."},
    "M": {"word": "Moses", "phrase": "He led God's people."},
    "N": {"word": "Noah", "phrase": "He built a big boat."},
    "O": {"word": "Olive", "phrase": "A tree of peace."},
    "P": {"word": "Prayer", "phrase": "Talking to God."},
    "Q": {"word": "Queen", "phrase": "Queen Esther was brave."},
    "R": {"word": "Rainbow", "phrase": "God's promise in the sky."},
    "S": {"word": "Star", "phrase": "Twinkling up above."},
    "T": {"word": "Temple", "phrase": "God's house to pray."},
    "U": {"word": "Universe", "phrase": "God made everything."},
    "V": {"word": "Vine", "phrase": "Jesus is the true vine."},
    "W": {"word": "Water", "phrase": "From the river of life."},
    "X": {"word": "foX", "phrase": "Samson's tricky friend."},
    "Y": {"word": "Youth", "phrase": "Young and strong for God."},
    "Z": {"word": "Zion", "phrase": "God's holy mountain."},
}


def _post(path: str, payload: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        f"{BASE}/{path}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def lyrics_generation(prompt: str, title: str) -> dict:
    """Calls MiniMax /v1/lyrics_generation. Returns {song_title, style_tags, lyrics}."""
    r = _post("lyrics_generation", {
        "mode": "write_full_song",
        "prompt": prompt,
        "title": title,
    })
    base = r.get("base_resp") or {}
    if base.get("status_code") != 0:
        raise RuntimeError(f"lyrics API error: {base.get('status_msg')} (full: {r})")
    return {
        "song_title": r.get("song_title", title),
        "style_tags": r.get("style_tags", ""),
        "lyrics": r.get("lyrics", ""),
    }


def make_prompt(letter: str, word: str, phrase: str) -> str:
    return (
        f"A short, cheerful children's Bible alphabet song for ages 3-6. "
        f"Letter '{letter}' stands for '{word}'. Theme: {phrase}. "
        f"REQUIRED structure: [Verse] [Chorus] [Verse] [Chorus] [Outro]. "
        f"REQUIRED: chorus must repeat the line '{letter} is for {word}' at least twice. "
        f"Maximum length: 60 words total. Use simple, short lines. Easy English words. "
        f"Singable rhythm. No extra sections like Bridge, Pre-Chorus, Post-Chorus, Break."
    )


def call_with_retry(prompt: str, title: str, max_retries: int = 3) -> dict:
    """3 retries with exponential backoff (5s, 15s, 30s) on 429/overloaded."""
    backoffs = [5, 15, 30]
    last_err = None
    for attempt in range(max_retries + 1):  # 0,1,2,3 = 4 total tries
        try:
            return lyrics_generation(prompt, title)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            last_err = f"HTTP {e.code}: {body[:200]}"
            is_rate = e.code == 429 or "overloaded" in body.lower() or "temporarily" in body.lower()
            if not is_rate or attempt == max_retries:
                raise RuntimeError(last_err) from e
            wait = backoffs[attempt]
            print(f"  ⚠ {last_err} → retry {attempt+1}/{max_retries} in {wait}s")
            time.sleep(wait)
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt == max_retries:
                raise RuntimeError(last_err) from e
            wait = backoffs[attempt]
            print(f"  ⚠ {last_err} → retry {attempt+1}/{max_retries} in {wait}s")
            time.sleep(wait)
    raise RuntimeError(last_err)


def run_batch(letters: list[str], out_dir: pathlib.Path) -> dict:
    """Run a batch of letters; return results dict."""
    results = {}
    for L in letters:
        info = ALPHABET_DATA[L]
        word = info["word"]
        prompt = make_prompt(L, word, info["phrase"])
        title = f"{L} is for {word}"
        print(f"\n=== {L} ({word}) ===")
        try:
            result = call_with_retry(prompt, title)
            lyrics = result["lyrics"]
            out_file = out_dir / f"{L.lower()}-{word.lower()}.txt"
            out_file.write_text(lyrics)
            n = len(lyrics.split())
            results[L] = {
                "word": word,
                "song_title": result["song_title"],
                "style_tags": result["style_tags"],
                "lyrics": lyrics,
                "word_count": n,
                "status": "ok",
            }
            print(f"  ✓ {n} words → {out_file.name}")
        except Exception as e:
            print(f"  ✗ FAIL: {e}")
            results[L] = {"word": word, "error": str(e), "status": "fail"}
        time.sleep(0.5)  # gentle within-batch
    return results


def main():
    out_dir = pathlib.Path("alphabet/songs/lyrics")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Parse batch from argv
    if len(sys.argv) > 1:
        # Single letter C..Z
        arg = sys.argv[1].upper()
        if arg == "ALL":
            batches = [
                list("CDEFGH"),
                list("IJKLMN"),
                list("OPQRST"),
                list("UVWXYZ"),
            ]
        elif len(arg) == 1 and arg in "CDEFGHIJKLMNOPQRSTUVWXYZ":
            batches = [[arg]]
        else:
            # Range, e.g. "C-H" or "I-N"
            if "-" in arg:
                start, end = arg.split("-")
                start_idx = "CDEFGHIJKLMNOPQRSTUVWXYZ".index(start)
                end_idx = "CDEFGHIJKLMNOPQRSTUVWXYZ".index(end)
                batches = [list("CDEFGHIJKLMNOPQRSTUVWXYZ"[start_idx:end_idx+1])]
            else:
                print(f"Unknown arg: {arg}")
                sys.exit(1)
    else:
        # Default: C-H
        batches = [list("CDEFGH")]
    
    all_results = {}
    
    for i, batch in enumerate(batches):
        print(f"\n{'='*60}")
        print(f"BATCH {i+1}/{len(batches)}: {' '.join(batch)}")
        print(f"{'='*60}")
        results = run_batch(batch, out_dir)
        all_results.update(results)
        # Save partial after each batch
        summary_file = out_dir / "_all_lyrics.json"
        summary_file.write_text(json.dumps(all_results, indent=2, ensure_ascii=False))
        if i < len(batches) - 1:
            print(f"\n[batch] sleeping 10s before next batch...")
            time.sleep(10)
    
    ok = sum(1 for r in all_results.values() if r["status"] == "ok")
    fail = sum(1 for r in all_results.values() if r["status"] == "fail")
    print(f"\n{'='*60}")
    print(f"DONE: {ok} ok, {fail} fail")
    print(f"Summary: {out_dir}/_all_lyrics.json")
    
    # Print all lyrics for review
    print(f"\n{'='*60}")
    print("ALL LYRICS (paste for review):")
    print(f"{'='*60}")
    for L in sorted(all_results.keys()):
        r = all_results[L]
        print(f"\n--- {L} ({r['word']}) — {r.get('word_count', '?')} words ---")
        if r["status"] == "ok":
            print(r["lyrics"])
        else:
            print(f"FAILED: {r.get('error')}")


if __name__ == "__main__":
    main()
