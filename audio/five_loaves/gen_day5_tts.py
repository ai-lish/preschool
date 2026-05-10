#!/usr/bin/env python3
import json
import urllib.request
import os
import sys

API_KEY = "sk-cp-CNrQtXcYz6dieW7vUVGQY7iZA8L2SE37Dz3jtH6J9b2LkgwXvwGZM8EP-L8eiBx3r7UWwulYCS9v3eKkKO3Fb2TVJHH3-nujRXEZz1_oEGVaS_rnrWg8_gU"
ENDPOINT = "https://api.minimax.io/v1/t2a_v2"
OUTPUT_DIR = "/Users/zachli/repos/preschool/audio/five_loaves"

# Confirmed working voice IDs
VOICE_IDS = {
    "zhHK": "cantonese_female",
    "zhCN": "female-tianmei",
    "enUS": "English_Trustworthy_Man",
    "jaJP": "Japanese_KindLady",
}

SCRIPTS = {
    "f5Narr": "耶穌叫門徒收集剩低的食物。十二個籃子，全部都裝得滿滿嘅！小朋友，你幫手數下有幾多個籃子？",
    "f5Hint": "試下點擊每一個籃子，睇下佢有幾多嘢！",
    "f5Fail": "再數多次，睇下係咪12個籃子？",
    "f5Success": "12個籃子，全部都係滿嘅！耶穌真係好神奇！",
}

LANGUAGES = ["zhHK", "zhCN", "enUS", "jaJP"]


def generate_tts(text, voice_id, output_path):
    payload = json.dumps({
        "model": "speech-2.8-hd",
        "text": text,
        "stream": False,
        "voice_setting": {"voice_id": voice_id}
    })

    req = urllib.request.Request(
        ENDPOINT,
        data=payload.encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            response_text = resp.read().decode("utf-8")
    except Exception as e:
        return {"success": False, "error": str(e)}

    try:
        d = json.loads(response_text)
        if d.get("base_resp", {}).get("status_code") != 0:
            return {"success": False, "error": f"API: {d.get('base_resp', {}).get('status_msg', 'unknown')}"}

        audio_hex = d["data"]["audio"]
        audio_bytes = bytes.fromhex(audio_hex)

        with open(output_path, "wb") as f:
            f.write(audio_bytes)

        return {"success": True, "size": len(audio_bytes)}
    except Exception as e:
        return {"success": False, "error": f"Parse: {str(e)}"}


def main():
    total = len(SCRIPTS) * len(LANGUAGES)
    success_count = 0
    fail_count = 0
    fails = []

    for audio_key, text in SCRIPTS.items():
        for lang in LANGUAGES:
            voice_id = VOICE_IDS[lang]
            filename = f"{audio_key}_{lang}.mp3"
            output_path = os.path.join(OUTPUT_DIR, filename)

            result = generate_tts(text, voice_id, output_path)

            if result["success"]:
                success_count += 1
                print(f"ok {filename} {result.get('size')} bytes")
            else:
                fail_count += 1
                fails.append((filename, result["error"]))
                print(f"FAIL {filename}: {result['error']}", flush=True)

    print(f"\n=== SUMMARY: {success_count}/{total} success, {fail_count}/{total} failed ===")
    if fails:
        for f, e in fails:
            print(f"  {f}: {e}")
    return fail_count == 0


if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)