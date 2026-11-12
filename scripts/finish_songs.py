#!/usr/bin/env python3
"""
把 Alphabet Park 剩下的字母歌做完，然後收尾。

設計成可以隨時中斷、隨時重跑：已經存在的檔案會跳過，每首成功就立刻 commit +
push。所以就算中途斷網、關機、或是跑到一半失敗，再執行一次就從斷點繼續。

用法（在 ~/Documents/preschool 底下）：

    python3 scripts/finish_songs.py              # 做完剩下的
    python3 scripts/finish_songs.py --dry-run    # 只列出要做什麼，不呼叫 API
    python3 scripts/finish_songs.py --only U,V   # 只做指定字母
    python3 scripts/finish_songs.py --no-push    # 只 commit 不 push

金鑰讀取順序：環境變數 MINIMAX_API_KEY → secrets.json 裡任何看起來像金鑰的欄位。
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

REPO = pathlib.Path(__file__).resolve().parents[1]
SONGS = REPO / "alphabet" / "songs"
LYRICS = SONGS / "lyrics"
BASE = os.environ.get("MINIMAX_API_HOST", "https://api.minimax.io").rstrip("/")

# 與 ALPHABET_DATA 一致
WORDS = {
    "A": "Adam", "B": "Bible", "C": "Creation", "D": "David", "E": "Eden",
    "F": "Fish", "G": "God", "H": "Heaven", "I": "Isaac", "J": "Jesus",
    "K": "King", "L": "Lamb", "M": "Moses", "N": "Noah", "O": "Olive",
    "P": "Prayer", "Q": "Queen", "R": "Rainbow", "S": "Star", "T": "Temple",
    "U": "Universe", "V": "Vine", "W": "Water", "X": "foX", "Y": "Youth",
    "Z": "Zion",
}

MUSIC_PROMPT = (
    "Cheerful children's nursery rhyme, simple ukulele and glockenspiel, "
    "gentle sweet child-friendly female vocal, slow tempo, warm and playful, "
    "singable by 3-6 year olds"
)


def lyrics_path(letter: str) -> pathlib.Path | None:
    """歌詞檔名是 {字母}-{單字}.txt，例如 u-universe.txt、x-fox.txt。
    先照 WORDS 推算，推不中就用 glob 兜底（避免命名微調就整個失效）。"""
    low = letter.lower()
    exact = LYRICS / f"{low}-{WORDS[letter].lower()}.txt"
    if exact.exists():
        return exact
    hits = sorted(LYRICS.glob(f"{low}-*.txt")) or sorted(LYRICS.glob(f"{low}.txt"))
    return hits[0] if hits else None


# ── 金鑰 ────────────────────────────────────────────────────────────────

def find_key() -> str:
    key = os.environ.get("MINIMAX_API_KEY")
    if key:
        return key.strip()

    for name in ("secrets.json", ".secrets.json", "config/secrets.json"):
        path = REPO / name
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text())
        except Exception:
            continue
        # 遞迴找出第一個像 MiniMax 金鑰的字串
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
            elif isinstance(node, str) and re.fullmatch(r"(sk-|eyJ)[\w.\-]{20,}", node):
                print(f"  金鑰取自 {name}（{len(node)} 字元）")
                return node

    sys.exit(
        "找不到 MiniMax 金鑰。\n"
        "  export MINIMAX_API_KEY=... 之後再跑，\n"
        "  或確認 secrets.json 在 repo 根目錄。"
    )


# ── HTTP ───────────────────────────────────────────────────────────────

def post(path: str, payload: dict, key: str, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        f"{BASE}/v1/{path}",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def get(path: str, key: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        f"{BASE}/v1/{path}", headers={"Authorization": f"Bearer {key}"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def dig(node, *names):
    """在巢狀 dict/list 裡找第一個符合的鍵——回應結構各版本略有差異。"""
    stack = [node]
    while stack:
        cur = stack.pop(0)
        if isinstance(cur, dict):
            for n in names:
                if cur.get(n):
                    return cur[n]
            stack.extend(cur.values())
        elif isinstance(cur, list):
            stack.extend(cur)
    return None


# ── 音樂生成 ────────────────────────────────────────────────────────────

def generate(letter: str, lyrics: str, key: str, dest: pathlib.Path) -> None:
    task = post("music_generation", {
        "model": "music-2.6",
        "prompt": MUSIC_PROMPT,
        "lyrics": lyrics,
        "audio_setting": {"sample_rate": 32000, "bitrate": 64000, "format": "mp3"},
    }, key)

    task_id = dig(task, "task_id", "taskId")
    if not task_id:
        raise RuntimeError(f"沒拿到 task_id：{json.dumps(task)[:300]}")
    print(f"    task {task_id}，等待中", end="", flush=True)

    for _ in range(90):          # 最多 15 分鐘
        time.sleep(10)
        print(".", end="", flush=True)
        s = get(f"music_generation/{task_id}", key)
        status = str(dig(s, "status") or "").lower()

        if status in ("success", "succeeded", "finished", "completed"):
            print(" 完成")
            audio_hex = dig(s, "audio")
            if audio_hex:
                dest.write_bytes(bytes.fromhex(audio_hex))
                return
            url = dig(s, "audio_url", "download_url", "url")
            if not url:
                raise RuntimeError(f"完成但找不到音檔：{json.dumps(s)[:300]}")
            with urllib.request.urlopen(url, timeout=300) as r:
                dest.write_bytes(r.read())
            return

        if status in ("failed", "error", "fail"):
            raise RuntimeError(f"任務失敗：{json.dumps(s)[:300]}")

    raise TimeoutError(f"task {task_id} 逾時")


def reencode(path: pathlib.Path) -> None:
    """統一成 64kbps mono 32kHz。沒有 ffmpeg 就跳過。"""
    if not shutil_which("ffmpeg"):
        print("    （沒有 ffmpeg，跳過重新編碼）")
        return
    tmp = path.with_suffix(".tmp.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
         "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "32000", str(tmp)],
        check=True,
    )
    tmp.replace(path)


def shutil_which(cmd: str):
    from shutil import which
    return which(cmd)


# ── git ────────────────────────────────────────────────────────────────

def git(*args, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(REPO), *args],
                          check=check, capture_output=True, text=True)


def commit_push(paths: list[str], message: str, push: bool) -> None:
    git("add", *paths)
    if not git("diff", "--cached", "--quiet", check=False).returncode:
        print("    （沒有變更，略過 commit）")
        return
    git("commit", "-m", message)
    print(f"    committed: {message}")
    if push:
        r = git("push", check=False)
        print("    pushed" if r.returncode == 0 else f"    push 失敗：{r.stderr.strip()[:200]}")


# ── 收尾：A/B 改名、刪舊檔 ──────────────────────────────────────────────

def tidy_ab(push: bool) -> None:
    moved = []
    pairs = [
        (REPO / "alphabet" / "adam-song-v2.64k.mp3", SONGS / "a-song.mp3",
         REPO / "alphabet" / "adam-song-v2.mp3"),
        (REPO / "alphabet" / "bible-song.64k.mp3", SONGS / "b-song.mp3",
         REPO / "alphabet" / "bible-song.mp3"),
    ]
    for src, dst, old in pairs:
        if dst.exists():
            continue
        if src.exists():
            src.replace(dst)
            moved.append(str(dst.relative_to(REPO)))
            print(f"  {src.name} → {dst.relative_to(REPO)}")
        elif old.exists():
            # 沒有 .64k 版本就直接從原檔重新編碼一份
            dst.write_bytes(old.read_bytes())
            reencode(dst)
            moved.append(str(dst.relative_to(REPO)))
            print(f"  {old.name} → {dst.relative_to(REPO)}（重新編碼）")

    removed = []
    for old in ("alphabet/adam-song-v2.mp3", "alphabet/bible-song.mp3",
                "alphabet/adam-song-v2.64k.mp3", "alphabet/bible-song.64k.mp3"):
        if (REPO / old).exists():
            git("rm", "-q", "--ignore-unmatch", old, check=False)
            (REPO / old).unlink(missing_ok=True)
            removed.append(old)
            print(f"  移除 {old}")

    if moved or removed:
        commit_push(["-A", "alphabet"],
                    "chore(alphabet): normalise A/B song filenames, drop oversized originals",
                    push)


# ── 主流程 ──────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="逗號分隔字母，例：U,V,W")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--skip-tidy", action="store_true")
    a = ap.parse_args()

    if not (REPO / "alphabet").is_dir():
        sys.exit(f"這裡看起來不是 preschool repo：{REPO}")

    SONGS.mkdir(parents=True, exist_ok=True)
    push = not a.no_push

    letters = [c.strip().upper() for c in a.only.split(",")] if a.only else list(WORDS)
    pending = [L for L in letters if not (SONGS / f"{L.lower()}-song.mp3").exists()]
    todo = [L for L in pending if lyrics_path(L)]
    missing_lyrics = [L for L in pending if not lyrics_path(L)]

    print(f"repo: {REPO}")
    print(f"已完成: {26 - len([L for L in WORDS if not (SONGS / f'{L.lower()}-song.mp3').exists()])}/26")
    print(f"要生成: {' '.join(todo) if todo else '（無）'}")
    if missing_lyrics:
        print(f"缺歌詞、無法生成: {' '.join(missing_lyrics)}"
              f"  → A/B 由現有檔案處理，其餘需先跑 lyrics_generation")

    if a.dry_run:
        print("\n--dry-run，沒有呼叫 API。")
        return

    key = find_key() if todo else ""

    for L in todo:
        dest = SONGS / f"{L.lower()}-song.mp3"
        lyrics = lyrics_path(L).read_text()
        # MiniMax 有時把換行 escape 成字面 \n，會影響段落結構
        lyrics = lyrics.replace("\\n", "\n").strip()

        print(f"\n[{L}] {WORDS[L]}")
        for attempt in range(1, 4):
            try:
                generate(L, lyrics, key, dest)
                reencode(dest)
                print(f"    {dest.name}  {dest.stat().st_size // 1024} KB")
                commit_push([f"alphabet/songs/{dest.name}"],
                            f"feat(alphabet): add {L} song ({WORDS[L]})", push)
                break
            except Exception as e:
                dest.unlink(missing_ok=True)
                wait = 15 * (2 ** (attempt - 1))
                print(f"    第 {attempt} 次失敗：{type(e).__name__}: {str(e)[:160]}")
                if attempt == 3:
                    print(f"    {L} 放棄，繼續下一個（重跑本腳本會再試）")
                else:
                    print(f"    {wait}s 後重試")
                    time.sleep(wait)

    if not a.skip_tidy:
        print("\n收尾 A/B：")
        tidy_ab(push)

    done = [L for L in WORDS if (SONGS / f"{L.lower()}-song.mp3").exists()]
    print(f"\n完成 {len(done)}/26")
    left = [L for L in WORDS if L not in done]
    if left:
        print(f"仍缺: {' '.join(left)}  → 再跑一次本腳本即可續做")


if __name__ == "__main__":
    main()
