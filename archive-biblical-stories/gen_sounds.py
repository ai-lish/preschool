#!/usr/bin/env python3
import subprocess
import os
import json

API_KEY = os.environ.get("MINIMAX_API_KEY", "")
BASE = "/Users/zachli/.openclaw/workspace/preschool/audio/noah/sounds"

languages = {
    "zhHK": {"voice_id": "Cantonese_ProfessionalHost（M)", "dir": "zhHK"},
    "zhCN": {"voice_id": "female-tianmei", "dir": "zhCN"},
    "en": {"voice_id": "English_Trustworthy_Man", "dir": "en"},
    "ja": {"voice_id": "Japanese_LoyalKnight", "dir": "ja"},
}

# animal sounds per language: (name, text)
sounds = {
    "zhHK": [
        ("elephant", "嗚～好大聲！"),
        ("lion", "嚤～好威猛！"),
        ("wolf", "嗷嗚～好寂寞！"),
        ("sheep", "咩～好可愛！"),
        ("cow", "哞～好悠閒！"),
        ("horse", "嘶～跑得快！"),
        ("rabbit", "咕咕～好跳脫！"),
        ("deer", "呦～好優雅！"),
    ],
    "zhCN": [
        ("elephant", "啊～好大聲！"),
        ("lion", "嗷～好威猛！"),
        ("wolf", "嗷嗚～好孤單！"),
        ("sheep", "咩～好可愛！"),
        ("cow", "哞～好悠閒！"),
        ("horse", "嘶～跑得快！"),
        ("rabbit", "咕咕～好靈活！"),
        ("deer", "呦～好優雅！"),
    ],
    "en": [
        ("elephant", "Trumpet! So loud!"),
        ("lion", "Roar! So mighty!"),
        ("wolf", "Awooo! So lonely!"),
        ("sheep", "Baa! So cute!"),
        ("cow", "Moo! So peaceful!"),
        ("horse", "Neigh! So fast!"),
        ("rabbit", "Pitter patter! So bouncy!"),
        ("deer", "Bleat! So graceful!"),
    ],
    "ja": [
        ("elephant", "ぱおん！おおきなおと！"),
        ("lion", "がおう！すごい！"),
        ("wolf", "あぉぅう！さみしい！"),
        ("sheep", "めええ！かわいい！"),
        ("cow", "もおお！ゆうえん！"),
        ("horse", "ひひん！かけっこ！"),
        ("rabbit", "ちゅんちゅん！じゃんぷ！"),
        ("deer", "呦きい！ゆうが！"),
    ],
}

for lang, cfg in languages.items():
    voice_id = cfg["voice_id"]
    out_dir = os.path.join(BASE, cfg["dir"])
    os.makedirs(out_dir, exist_ok=True)
    lang_sounds = sounds.get(lang, sounds["zhHK"])
    
    for name, text in lang_sounds:
        out_file = os.path.join(out_dir, f"{name}.mp3")
        if os.path.exists(out_file) and os.path.getsize(out_file) > 5000:
            print(f"{lang}/{name}: already exists ✅")
            continue
        
        payload = {
            "model": "speech-2.8-hd",
            "text": text,
            "stream": False,
            "voice_setting": {"voice_id": voice_id, "speed": 1.1, "vol": 1.0},
            "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": "mp3"}
        }
        
        result = subprocess.run([
            "curl", "-s", "--location", "https://api.minimax.io/v1/t2a_v2",
            "-H", f"Authorization: Bearer {API_KEY}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload),
            "-o", out_file
        ], capture_output=True, text=True, timeout=30)
        
        size = os.path.getsize(out_file) if os.path.exists(out_file) else 0
        if size > 5000:
            print(f"{lang}/{name}: ✅ {size} bytes")
        else:
            print(f"{lang}/{name}: ❌ {size} bytes - {open(out_file).read()[:100] if os.path.exists(out_file) else 'no file'}")

print("\nDone!")
