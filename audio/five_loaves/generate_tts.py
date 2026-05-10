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
    "f1Narr": "耶穌教導群眾好多道理。群眾越來越多，有男有女，有老有嫩！小朋友，你數數看在場有幾多人？",
    "f1Hint": "試下點擊每一個人物，睇下佢哋係邊個！",
    "f1Fail": "未數完喎，再試多次！",
    "f1Success": "真係好多人呀！有五千個男人，女人同小朋友就更加多喇！",
    "f2Narr": "有一個小朋友帶咗自己嘅午餐——5個餅，同2條魚。不過群眾咁多人，這啲食物點夠食呢？",
    "f2Hint": "試下點擊個籃子，睇下入面有咩！",
    "f2Fail": "再點一次個籃子啦！",
    "f2Success": "5個餅、2條魚！就係呢啲嘢，餵飽咗五千人！",
    "f3Narr": "門徒將食物送到耶穌面前。耶穌望住天，祝福呢啲食物，然後擘開——奇蹟就發生喇！",
    "f3Hint": "點擊個餅同魚，睇下耶穌做啲咩！",
    "f3Fail": "試下再點擊食物！",
    "f3Success": "耶穌祝福完，餅同魚越分越多，多到分不完！",
    "f4Narr": "群眾人人都食飽咗！小朋友，試下將食物分俾每個小朋友，睇下佢哋笑唔笑！",
    "f4Hint": "將食物拖去每個小朋友度！",
    "f4Fail": "記得每個小朋友都要分到嘢食！",
    "f4Success": "每個人都食飽咗！仲要剩低好多添！",
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
