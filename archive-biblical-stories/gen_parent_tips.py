#!/usr/bin/env python3
"""Generate parent tip images for Bible story games using MiniMax Image API."""
import requests
import os
import time

API_KEY = "sk-cp-CNrQtXcYz6dieW7vUVGQY7iZA8L2SE37Dz3jtH6J9b2LkgwXvwGZM8EP-L8eiBx3r7UWwulYCS9v3eKkKO3Fb2TVJHH3-nujRXEZz1_oEGVaS_rnrWg8_gU"
OUTPUT_DIR = "/Users/zachli/.openclaw/workspace/preschool/images/parent-tips"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Tips: (filename, emoji, chinese_text, source, bg_color_name)
TIPS = [
    # Creation (bg: warm cream #FFF9E6)
    ("parent-tip-creation-d1.png", "🌟", "這個年紀的孩子正在建立時間概念，光與暗的體驗有助他們理解晝夜交替。", "香港教育局 K1-K3 課程指引"),
    ("parent-tip-creation-d2.png", "🌈", "幼兒透過觀察天空變化，培養對大自然的好奇心。", "Montessori 教學法"),
    ("parent-tip-creation-d3.png", "🌱", "種植活動能讓孩子理解生命成長過程，培養責任感。", "WHO 幼兒身體活動指引"),
    ("parent-tip-creation-d4.png", "🐑", "與孩子一起數數身邊的動物，建立數字概念。", "Piaget 認知發展論"),
    ("parent-tip-creation-d5.png", "👋", "認識身體各部位有助幼兒建立自我意識。", "美國兒科學會"),
    ("parent-tip-creation-d6.png", "☀️", "休息日教孩子：工作需要休息，休息也是神的祝福。", "香港教育局 K1-K3 課程指引"),
    ("parent-tip-creation-summary.png", "📖", "用故事鞏固所學，孩子需要重複來加深印象。", "Piaget 認知發展論"),
    # Noah (bg: soft blue #E8F4FD)
    ("parent-tip-noah-d1.png", "🌧️", "2-4歲幼兒正在學習分辨對錯，故事是很好的道德教育工具。", "香港教育局 K1-K3 課程指引"),
    ("parent-tip-noah-d2.png", "🦒", "配對遊戲有助幼兒建立分類概念，為數學打基礎。", "Piaget 認知發展論"),
    ("parent-tip-noah-d3.png", "🐘", "數數活動配合動物主題能增加幼兒學習興趣。", "Montessori 教學法"),
    ("parent-tip-noah-d4.png", "🌊", "水類遊戲有助幼兒理解自然現象的威力。", "WHO 幼兒身體活動指引"),
    ("parent-tip-noah-d5.png", "🦒", "排序活動訓練幼兒的邏輯思維。", "Piaget 認知發展論"),
    ("parent-tip-noah-d6.png", "🌈", "彩虹象徵神的應許，幫助孩子理解希望與信任。", "美國兒科學會"),
    ("parent-tip-noah-summary.png", "📖", "每個故事都是與孩子對話的起點，別錯過這個機會。", "香港教育局 K1-K3 課程指引"),
    # Moses (bg: soft pink #FDE8E8)
    ("parent-tip-moses-d1.png", "👶", "嬰兒哭聲是正常需求表達，回應有助建立安全感。", "美國兒科學會"),
    ("parent-tip-moses-d2.png", "🌊", "水的觸感體驗有助幼兒感官發展。", "Montessori 教學法"),
    ("parent-tip-moses-d3.png", "🙏", "模仿動作有助粗大動作發展，同時建立正確的身體意識。", "WHO 幼兒身體活動指引"),
    ("parent-tip-moses-d4.png", "⏰", "等待測試孩子的忍耐力，適度延遲滿足有助自我控制。", "Piaget 認知發展論"),
    ("parent-tip-moses-d5.png", "🦋", "角色扮演遊戲有助孩子理解勇氣與信任。", "香港教育局 K1-K3 課程指引"),
    ("parent-tip-moses-d6.png", "🎉", "慶祝成功能建立孩子的自信心。", "美國兒科學會"),
    ("parent-tip-moses-summary.png", "📖", "Bible故事教導我們，即使困難，神也會看顧。", "香港教育局 K1-K3 課程指引"),
]

STYLE = "cute kawaii children's book illustration, soft pastel background, simple friendly design, clean white space, child-friendly aesthetic, warm and encouraging mood, no realistic photos"

def make_prompt(filename, emoji, text, source):
    return f"A {STYLE}. Center of image shows a friendly emoji {emoji} with the Chinese text displayed prominently: \"{text}\" In small text at bottom-right corner: 出處：{source} Clean and simple, suitable for parents and young children."

def generate_image(filename, prompt):
    url = "https://api.minimax.io/v1/image_generation"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    payload = {
        "model": "image-01",
        "prompt": prompt,
        "aspect_ratio": "4:3",
        "response_format": "url"
    }
    print(f"  Generating {filename}...")
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    data = resp.json()
    if data.get("base_resp", {}).get("status_code") != 0:
        print(f"  ERROR: {data}")
        return False
    img_url = data["data"]["image_urls"][0]
    # Download image
    img_resp = requests.get(img_url, timeout=30)
    out_path = os.path.join(OUTPUT_DIR, filename)
    with open(out_path, "wb") as f:
        f.write(img_resp.content)
    size = os.path.getsize(out_path)
    print(f"  ✓ Saved {filename} ({size} bytes)")
    return True

for i, (filename, emoji, text, source) in enumerate(TIPS):
    prompt = make_prompt(filename, emoji, text, source)
    success = generate_image(filename, prompt)
    if not success:
        print(f"  ✗ Failed {filename}, stopping")
        break
    # Rate limit: wait between requests
    if i < len(TIPS) - 1:
        time.sleep(3)

print(f"\nDone! {len(TIPS)} images generated in {OUTPUT_DIR}")
