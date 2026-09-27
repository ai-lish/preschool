#!/usr/bin/env python3
"""
Phase 3：把 26 首字母歌接上 alphabet/index.html。

修三件事：

1. LETTER_SONGS 只有 A、B 兩個 entry —— 改成從 ALPHABET_DATA 動態生成，
   跟 CHARACTER_IMAGES 同一個寫法。

2. fallback 是 `|| 'adam-song-v2.mp3'` —— 所以 C 到 Z 全部在播「A is for
   Adam」。小朋友按 M is for Moses，聽到的是 Adam 的歌。改成沒有對應歌曲
   就靜音，寧可不播也不要播錯。

3. `bgMusic.src !== songFile` 永遠成立 —— .src 回傳的是解析後的絕對網址
   （https://…/alphabet/songs/c-song.mp3），songFile 是相對路徑，兩者永不
   相等，所以每次 toggle 都重建 Audio 物件、音樂從頭播。改成記字母。

用法（在 repo 根目錄）：
    python3 scripts/wire_songs.py            # 套用
    python3 scripts/wire_songs.py --dry-run  # 只看會改什麼
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parents[1]
HTML = REPO / "alphabet" / "index.html"

OLD_MAP = """    const LETTER_SONGS = {
      A: 'adam-song-v2.mp3',
      B: 'bible-song.mp3'
    };"""

NEW_MAP = """    // 由 ALPHABET_DATA 動態生成，與 CHARACTER_IMAGES 同一個做法。
    // 檔案不存在的字母會 fetch 失敗，交由 initMusic() 靜音處理。
    const LETTER_SONGS = Object.fromEntries(
      Object.keys(ALPHABET_DATA).map(L => [
        L,
        `songs/${L.toLowerCase()}-song.mp3`
      ])
    );"""

OLD_INIT = """    function initMusic() {
      const songFile = LETTER_SONGS[currentLetterKey] || 'adam-song-v2.mp3';
      if (!bgMusic || bgMusic.src !== songFile) {
        if (bgMusic) { bgMusic.pause(); bgMusic = null; }
        bgMusic = new Audio(songFile);
        bgMusic.loop = true;
        bgMusic.volume = 0.6;
      }
    }"""

NEW_INIT = """    // 記住目前載入的是哪個字母。不要比對 bgMusic.src —— 它回傳解析後的
    // 絕對網址，跟相對路徑永遠不相等，會導致每次 toggle 都重建 Audio。
    let loadedSongKey = null;

    function initMusic() {
      const songFile = LETTER_SONGS[currentLetterKey];

      // 沒有對應歌曲就靜音。寧可不播，也不要播成另一個字母的歌。
      if (!songFile) {
        if (bgMusic) { bgMusic.pause(); bgMusic = null; }
        loadedSongKey = null;
        musicPlaying = false;
        return;
      }

      if (loadedSongKey !== currentLetterKey) {
        if (bgMusic) { bgMusic.pause(); bgMusic = null; }
        bgMusic = new Audio(songFile);
        bgMusic.loop = true;
        bgMusic.volume = 0.6;
        bgMusic.addEventListener('error', () => {
          console.warn(`No song for ${currentLetterKey}, staying silent`);
          bgMusic = null;
          loadedSongKey = null;
          musicPlaying = false;
          updateMusicUI();
        });
        loadedSongKey = currentLetterKey;
      }
    }"""

OLD_TOGGLE = """    function toggleMusic() {
      initMusic();
      if (musicPlaying) {"""

NEW_TOGGLE = """    function toggleMusic() {
      initMusic();
      if (!bgMusic) { updateMusicUI(); return; }   // 這個字母沒有歌
      if (musicPlaying) {"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if not HTML.exists():
        sys.exit(f"找不到 {HTML}，請在 preschool repo 根目錄執行。")

    html = HTML.read_text(encoding="utf-8")
    original = html
    applied, skipped = [], []

    for label, old, new in (
        ("LETTER_SONGS 動態 map", OLD_MAP, NEW_MAP),
        ("initMusic 靜音 fallback + 修 src 比對", OLD_INIT, NEW_INIT),
        ("toggleMusic 空歌保護", OLD_TOGGLE, NEW_TOGGLE),
    ):
        if old in html:
            html = html.replace(old, new, 1)
            applied.append(label)
        elif new.split("\n")[0].strip() in html or "loadedSongKey" in html:
            skipped.append(f"{label}（已套用過）")
        else:
            skipped.append(f"{label}  ← 找不到預期區塊，需手動處理")

    for x in applied:
        print(f"  ✓ {x}")
    for x in skipped:
        print(f"  - {x}")

    # 確認 LETTER_SONGS 在 ALPHABET_DATA 之後才宣告，否則載入時 ReferenceError
    i_data = html.find("const ALPHABET_DATA")
    i_songs = html.find("const LETTER_SONGS")
    if -1 < i_songs < i_data:
        sys.exit("\n中止：LETTER_SONGS 宣告在 ALPHABET_DATA 之前，會在載入時丟 "
                 "ReferenceError。請先調換順序。")

    if html == original:
        print("\n沒有變更。")
        return

    if a.dry_run:
        print("\n--dry-run，未寫入。")
        return

    HTML.write_text(html, encoding="utf-8")
    print(f"\n{HTML.relative_to(REPO)} 已更新。")
    print("建議接著：本機開 alphabet/index.html，逐個字母按播放鍵，"
          "確認唱的字母對得上、沒有歌的字母安靜不報錯。")


if __name__ == "__main__":
    main()
