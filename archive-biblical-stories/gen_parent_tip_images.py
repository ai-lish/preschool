#!/usr/bin/env python3
"""Generate parent tip images using MiniMax Image-01 API."""
import subprocess
import json
import os
import base64

API_KEY = "sk-cp-CNrQtXcYz6dieW7vUVGQY7iZA8L2SE37Dz3jtH6J9b2LkgwXvwGZM8EP-L8eiBx3r7UWwulYCS9v3eKkKO3Fb2TVJHH3-nujRXEZz1_oEGVaS_rnrWg8_gU"
MODEL = "image-01"
URL = "https://api.minimax.io/v1/image_generation"
OUT_DIR = "/Users/zachli/.openclaw/workspace/preschool/images/parent-tips"

IMAGES = [
    ("parent-tip-creation-d1.png", "☀️", "這個年紀的孩子正在建立時間概念，光與暗的體驗有助他們理解晝夜交替。", "香港教育局 K1-K3 課程指引", "#FFF9E6", "sun and stars"),
    ("parent-tip-creation-d2.png", "☁️", "幼兒透過觀察天空變化，培養對大自然的好奇心。", "Montessori 教學法", "#FFF9E6", "clouds and birds"),
    ("parent-tip-creation-d3.png", "🌱", "種植活動能讓孩子理解生命成長過程，培養責任感。", "WHO 幼兒身體活動指引", "#FFF9E6", "plants and leaves"),
    ("parent-tip-creation-d4.png", "🐾", "與孩子一起數數身邊的動物，建立數字概念。", "Piaget 認知發展論", "#FFF9E6", "cute animals"),
    ("parent-tip-creation-d5.png", "👋", "認識身體各部位有助幼兒建立自我意識。", "美國兒科學會", "#FFF9E6", "friendly child figure"),
    ("parent-tip-creation-d6.png", "🌙", "休息日教孩子：工作需要休息，休息也是神的祝福。", "香港教育局 K1-K3 課程指引", "#FFF9E6", "moon and stars"),
    ("parent-tip-creation-summary.png", "📖", "用故事鞏固所學，孩子需要重複來加深印象。", "Piaget 認知發展論", "#FFF9E6", "book and children"),
    ("parent-tip-noah-d1.png", "⚖️", "2-4歲幼兒正在學習分辨對錯，故事是很好的道德教育工具。", "香港教育局 K1-K3 課程指引", "#E8F4FD", "scales of justice"),
    ("parent-tip-noah-d2.png", "🐘", "配對遊戲有助幼兒建立分類概念，為數學打基礎。", "Piaget 認知發展論", "#E8F4FD", "animals pairing"),
    ("parent-tip-noah-d3.png", "🧮", "數數活動配合動物主題能增加幼兒學習興趣。", "Montessori 教學法", "#E8F4FD", "counting animals"),
    ("parent-tip-noah-d4.png", "🌧️", "水類遊戲有助幼兒理解自然現象的威力。", "WHO 幼兒身體活動指引", "#E8F4FD", "rain and water"),
    ("parent-tip-noah-d5.png", "🔢", "排序活動訓練幼兒的邏輯思維。", "Piaget 認知發展論", "#E8F4FD", "sequence and order"),
    ("parent-tip-noah-d6.png", "🌈", "彩虹象徵神的應許，幫助孩子理解希望與信任。", "美國兒科學會", "#E8F4FD", "rainbow"),
    ("parent-tip-noah-summary.png", "💬", "每個故事都是與孩子對話的起點，別錯過這個機會。", "香港教育局 K1-K3 課程指引", "#E8F4FD", "parent and child talking"),
    ("parent-tip-moses-d1.png", "👶", "嬰兒哭聲是正常需求表達，回應有助建立安全感。", "美國兒科學會", "#FDE8E8", "cute baby"),
    ("parent-tip-moses-d2.png", "🌾", "水的觸感體驗有助幼兒感官發展。", "Montessori 教學法", "#FDE8E8", "reeds and water"),
    ("parent-tip-moses-d3.png", "🙌", "模仿動作有助粗大動作發展，同時建立正確的身體意識。", "WHO 幼兒身體活動指引", "#FDE8E8", "child doing movements"),
    ("parent-tip-moses-d4.png", "⏳", "等待測試孩子的忍耐力，適度延遲滿足有助自我控制。", "Piaget 認知發展論", "#FDE8E8", "hourglass waiting"),
    ("parent-tip-moses-d5.png", "🏃", "角色扮演遊戲有助孩子理解勇氣與信任。", "香港教育局 K1-K3 課程指引", "#FDE8E8", "child crossing water bravely"),
    ("parent-tip-moses-d6.png", "🎉", "慶祝成功能建立孩子的自信心。", "美國兒科學會", "#FDE8E8", "celebration success"),
    ("parent-tip-moses-summary.png", "🙏", "Bible故事教導我們，即使困難，神也會看顧。", "香港教育局 K1-K3 課程指引", "#FDE8E8", "faith and hope"),
]

PROMPT_TEMPLATE = (
    "A cute kawaii children's book illustration on a soft {bg} pastel background. "
    "White background with small decorative {decor} elements. "
    "In the center, a warm and friendly parenting tip displayed in bold Chinese characters with an emoji icon {emoji}. "
    "The text reads: '{text}'. "
    "Bottom-right corner has a small attribution text '📚 {source}'. "
    "Soft rounded corners, gentle colors, child-friendly aesthetic. "
    "No realistic photos. Clean and simple design suitable for toddlers and parents."
)

def generate_one(filename, emoji, text, source, bg, decor):
    outpath = os.path.join(OUT_DIR, filename)
    if os.path.exists(outpath):
        print(f"  [SKIP] {filename} already exists")
        return True

    prompt = PROMPT_TEMPLATE.format(bg=bg, emoji=emoji, text=text, source=source, decor=decor)
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "aspect_ratio": "4:3",
        "response_format": "base64"
    })

    cmd = [
        "curl", "-s", "--location", URL,
        "--header", f"Authorization: Bearer {API_KEY}",
        "--header", "Content-Type: application/json",
        "--data", payload
    ]

    print(f"  Generating {filename}...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)

    try:
        data = json.loads(result.stdout)
        # MiniMax returns {"data":{"image_base64":["<b64>"]}}
        b64_str = data["data"]["image_base64"][0]
        img_data = base64.b64decode(b64_str)
        with open(outpath, "wb") as f:
            f.write(img_data)
        print(f"  ✓ {filename} done ({len(img_data)} bytes)")
        return True
    except Exception as exc:
        print(f"  ✗ {filename} failed: {exc}")
        preview = result.stdout[:150] if result.stdout else "(empty stdout)"
        print(f"    stdout preview: {preview}")
        if result.stderr:
            print(f"    stderr: {result.stderr[:150]}")
        return False

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    results = []
    for i, row in enumerate(IMAGES):
        filename, emoji, text, source, bg, decor = row
        print(f"[{i+1}/{len(IMAGES)}] {filename}")
        ok = generate_one(filename, emoji, text, source, bg, decor)
        results.append((filename, ok))

    print("\n--- Summary ---")
    passed = failed = 0
    for fname, ok in results:
        print(f"  {'✓' if ok else '✗'} {fname}")
        if ok: passed += 1
        else: failed += 1
    print(f"\nPassed: {passed}/{len(IMAGES)}, Failed: {failed}")
    if failed:
        print(f"Failed: {[f for f,ok in results if not ok]}")

if __name__ == "__main__":
    main()
