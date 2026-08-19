"""
generate_letter_songs.py — Phase 2: music generation for letters C-Z.
Reads lyrics from alphabet/songs/lyrics/*.txt → calls music-2.6 → encodes
64kbps mono 32kHz mp3 → writes alphabet/songs/{letter}-song.mp3.

Per Zach 2026-08-06:
- 64kbps mono 32kHz MP3 (target ~538KB)
- alphabet/songs/{letter}-song.mp3
- Batch 6 letters per run; 10s sleep between batches
- 429 / overloaded / failed → exponential backoff (5s, 15s, 30s), 3 retries
- ffmpeg re-encode to enforce bitrate
- DON'T overwrite existing files (safe to re-run)
- Track progress in _songs_progress.json
"""

from __future__ import annotations
import os, sys, json, time, subprocess, pathlib, urllib.request, urllib.error

# ─── Setup ─────────────────────────────────────────────────────────────────
SECRETS_PATH = pathlib.Path(os.path.expanduser("~/.openclaw/secrets.json"))
KEY = os.environ.get("MINIMAX_API_KEY")
if not KEY:
    KEY = json.load(open(SECRETS_PATH))["minimax-api-key"]
print(f"[setup] key length: {len(KEY)} (from {'env' if os.environ.get('MINIMAX_API_KEY') else 'secrets.json'})")
BASE = "https://api.minimax.io/v1"

ALPHABET_DATA = {
    "A": ("Adam", "the first man God made"),
    "B": ("Bible", "God's special book"),
    "C": ("Creation", "God made the world"),
    "D": ("David", "a brave boy who trusted God"),
    "E": ("Eden", "God's beautiful garden"),
    "F": ("Fish", "God made fish in the sea"),
    "G": ("God", "God loves you so much"),
    "H": ("Heaven", "God's home above the sky"),
    "I": ("Isaac", "God's promise son"),
    "J": ("Jesus", "God's Son who loves us"),
    "K": ("King", "the King of kings"),
    "L": ("Lamb", "Jesus is the Lamb"),
    "M": ("Moses", "he led God's people"),
    "N": ("Noah", "he built a big boat"),
    "O": ("Olive", "a tree of peace"),
    "P": ("Prayer", "talking to God"),
    "Q": ("Queen", "Queen Esther was brave"),
    "R": ("Rainbow", "God's promise in the sky"),
    "S": ("Star", "twinkling up above"),
    "T": ("Temple", "God's house to pray"),
    "U": ("Universe", "God made everything"),
    "V": ("Vine", "Jesus is the true vine"),
    "W": ("Water", "from the river of life"),
    "X": ("foX", "Samson's tricky friend"),
    "Y": ("Youth", "young and strong for God"),
    "Z": ("Zion", "God's holy mountain"),
}

# ─── MiniMax API ───────────────────────────────────────────────────────────
def _post(path: str, payload: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        f"{BASE}/{path}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def _get(path: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        f"{BASE}/{path}",
        headers={"Authorization": f"Bearer {KEY}"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def music_submit(prompt: str, lyrics: str) -> str:
    """Submit music task. Returns task_id."""
    r = _post("music_generation", {
        "model": "music-2.6",
        "prompt": prompt,
        "lyrics": lyrics,
        "audio_setting": {"sample_rate": 32000, "bitrate": 64000, "format": "mp3"},
    })
    base = r.get("base_resp") or {}
    if base.get("status_code") != 0:
        raise RuntimeError(f"music submit error: {base.get('status_msg')}")
    tid = r.get("task_id") or r.get("data", {}).get("task_id")
    if not tid:
        raise RuntimeError(f"no task_id in response: {r}")
    return tid


def music_poll(tid: str, poll: int = 10, max_tries: int = 60) -> dict:
    """Poll until success/failed. Returns final API response dict."""
    for i in range(max_tries):
        time.sleep(poll)
        s = _get(f"music_generation/{tid}")
        status = (s.get("status") or s.get("data", {}).get("status") or "").lower()
        if status in ("success", "succeeded", "finished"):
            return s
        if status in ("failed", "error"):
            raise RuntimeError(f"music task {tid} failed: {s}")
        if i % 3 == 0:
            print(f"    [poll {i+1}/{max_tries}] status={status}")
    raise TimeoutError(f"music task {tid} timed out after {poll*max_tries}s")


def music_save(api_response: dict, dest: pathlib.Path) -> pathlib.Path:
    """Save audio from API response (hex or URL) to dest."""
    d = api_response.get("data", api_response)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if d.get("audio"):
        dest.write_bytes(bytes.fromhex(d["audio"]))
        return dest
    url = d.get("audio_url") or d.get("download_url")
    if not url:
        raise RuntimeError(f"no audio in response: {api_response}")
    with urllib.request.urlopen(url, timeout=300) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def music_generate_with_retry(prompt: str, lyrics: str, dest: pathlib.Path,
                              max_retries: int = 3) -> pathlib.Path:
    """Submit + (poll or sync) + save with retry on transient errors.

    Note: music-2.6 may return audio synchronously OR return task_id (async).
    Try sync first; if no audio, fall back to polling.
    """
    backoffs = [5, 15, 30]
    last_err = None
    for attempt in range(max_retries + 1):
        try:
            # Submit (synchronous or async — both endpoints return within 80s)
            r = _post("music_generation", {
                "model": "music-2.6",
                "prompt": prompt,
                "lyrics": lyrics,
                "audio_setting": {"sample_rate": 32000, "bitrate": 64000, "format": "mp3"},
            }, timeout=180)
            base = r.get("base_resp") or {}
            if base.get("status_code") != 0:
                raise RuntimeError(f"music submit error: {base.get('status_msg')}")
            data = r.get("data", {})
            # Case 1: audio returned synchronously
            if data.get("audio"):
                tmp = dest.with_suffix(".raw.mp3")
                tmp.write_bytes(bytes.fromhex(data["audio"]))
                reencode(tmp, dest)
                tmp.unlink()
                return dest
            # Case 2: task_id returned, poll
            tid = data.get("task_id") or r.get("task_id")
            if not tid:
                raise RuntimeError(f"no audio and no task_id: {r}")
            print(f"    task_id={tid} (async)")
            final = music_poll(tid, poll=10, max_tries=60)
            tmp = dest.with_suffix(".raw.mp3")
            music_save(final, tmp)
            reencode(tmp, dest)
            tmp.unlink()
            return dest
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            last_err = f"HTTP {e.code}: {body[:200]}"
            is_rate = (e.code == 429
                       or "overloaded" in body.lower()
                       or "temporarily" in body.lower())
            if not is_rate or attempt == max_retries:
                raise RuntimeError(last_err) from e
            wait = backoffs[attempt]
            print(f"    ⚠ {last_err} → retry {attempt+1}/{max_retries} in {wait}s")
            time.sleep(wait)
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt == max_retries:
                raise RuntimeError(last_err) from e
            wait = backoffs[attempt]
            print(f"    ⚠ {last_err} → retry {attempt+1}/{max_retries} in {wait}s")
            time.sleep(wait)
            # After backoff, reconnect to be safe
            time.sleep(1)
    raise RuntimeError(last_err)


# ─── ffmpeg ────────────────────────────────────────────────────────────────
def reencode(src: pathlib.Path, dest: pathlib.Path) -> pathlib.Path:
    """Re-encode MP3 to 64kbps mono 32kHz using ffmpeg."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(src),
        "-ac", "1",
        "-ar", "32000",
        "-b:a", "64k",
        "-codec:a", "libmp3lame",
        "-id3v2_version", "3",
        str(dest),
    ]
    subprocess.run(cmd, check=True)
    return dest


def make_style_prompt(letter: str, word: str, phrase: str) -> str:
    """Style/instrument prompt for music-2.6."""
    return (
        f"Happy children's nursery rhyme song for ages 3-6. "
        f"Cheerful, playful, gentle ukulele, simple clapping rhythm, "
        f"warm acoustic, sweet female child vocal, slow tempo, "
        f"Biblical theme about {word}: {phrase}. "
        f"Instrumental intro, clear pronunciation for letter learning."
    )


def normalize_lyrics(text: str) -> str:
    """Defense in depth: convert literal \\n (2 chars) to real newline."""
    return text.replace("\\n", "\n")


def run_batch(letters: list[str], songs_dir: pathlib.Path,
              lyrics_dir: pathlib.Path, progress: dict) -> dict:
    """Run a batch of letters. Returns results dict."""
    results = {}
    for L in letters:
        word, phrase = ALPHABET_DATA[L]
        lyrics_file = lyrics_dir / f"{L.lower()}-{word.lower()}.txt"
        mp3_file = songs_dir / f"{L.lower()}-song.mp3"

        if mp3_file.exists() and mp3_file.stat().st_size > 100_000:
            size_kb = mp3_file.stat().st_size // 1024
            print(f"\n=== {L} ({word}) === ✓ already exists ({size_kb}KB)")
            results[L] = {"word": word, "status": "ok", "skipped": True, "size_kb": size_kb}
            continue

        if not lyrics_file.exists():
            print(f"\n=== {L} ({word}) === ✗ lyrics file missing: {lyrics_file}")
            results[L] = {"word": word, "status": "fail", "error": "no lyrics"}
            continue

        lyrics = normalize_lyrics(lyrics_file.read_text())
        style = make_style_prompt(L, word, phrase)

        print(f"\n=== {L} ({word}) ===")
        print(f"    lyrics: {len(lyrics.split())} words")
        print(f"    submitting to music-2.6...")
        try:
            music_generate_with_retry(style, lyrics, mp3_file)
            size_kb = mp3_file.stat().st_size // 1024
            print(f"    ✓ saved {size_kb}KB → {mp3_file.name}")
            results[L] = {"word": word, "status": "ok", "size_kb": size_kb}
        except Exception as e:
            print(f"    ✗ FAIL: {e}")
            results[L] = {"word": word, "status": "fail", "error": str(e)}
        time.sleep(1)
    return results


def main():
    songs_dir = pathlib.Path("alphabet/songs")
    songs_dir.mkdir(parents=True, exist_ok=True)
    lyrics_dir = pathlib.Path("alphabet/songs/lyrics")

    if len(sys.argv) > 1:
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
        elif "-" in arg:
            start, end = arg.split("-")
            start_idx = "CDEFGHIJKLMNOPQRSTUVWXYZ".index(start)
            end_idx = "CDEFGHIJKLMNOPQRSTUVWXYZ".index(end)
            batches = [list("CDEFGHIJKLMNOPQRSTUVWXYZ"[start_idx:end_idx+1])]
        else:
            print(f"Unknown arg: {arg}")
            sys.exit(1)
    else:
        batches = [list("CDEFGH")]

    progress_file = songs_dir / "_songs_progress.json"
    if progress_file.exists():
        progress = json.load(open(progress_file))
    else:
        progress = {}

    all_results = {}
    for i, batch in enumerate(batches):
        print(f"\n{'='*60}")
        print(f"BATCH {i+1}/{len(batches)}: {' '.join(batch)}")
        print(f"{'='*60}")
        results = run_batch(batch, songs_dir, lyrics_dir, progress)
        all_results.update(results)
        progress.update(results)
        progress_file.write_text(json.dumps(progress, indent=2, ensure_ascii=False))
        if i < len(batches) - 1:
            print(f"\n[batch] sleeping 10s before next batch...")
            time.sleep(10)

    ok = sum(1 for r in all_results.values() if r["status"] == "ok" and not r.get("skipped"))
    skip = sum(1 for r in all_results.values() if r.get("skipped"))
    fail = sum(1 for r in all_results.values() if r["status"] == "fail")
    print(f"\n{'='*60}")
    print(f"DONE: {ok} generated, {skip} skipped, {fail} fail")
    print(f"Progress: {progress_file}")


if __name__ == "__main__":
    main()
