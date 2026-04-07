#!/usr/bin/env python3
"""Generate moses audio files for all 4 languages."""
import os
import requests
import json
import time

API_KEY = os.environ.get("MINIMAX_API_KEY")
BASE_DIR = "/Users/zachli/.openclaw/workspace/preschool/audio/moses"
os.makedirs(BASE_DIR, exist_ok=True)

VOICES = {
    "zhHK": "Cantonese_GentleLady",
    "zhCN": "female-tianmei",
    "en":   "English_Trustworthy_Man",
    "ja":   "Japanese_KindLady",
}

# All audio content per key
AUDIO_CONTENT = {
    # Cantonese
    "m1Narr": "埃及法老不讓以色列人離開，神降下十個災殃。",
    "m1Success": "瘟疫都離開了！",
    "m2Narr": "摩西帶領以色列人離開埃及，過紅海到應許之地。",
    "m2Success": "以色列人離開埃及！",
    "m3Narr": "以色列人來到紅海前，法老的軍隊追趕上來。",
    "m3Success": "摩西向神祈禱，神叫紅海分開。",
    "m4Narr": "海水真的分开了！以色列人從中間走過。",
    "m4Success": "全以色列人都安全過海！",
    "m5Narr": "以色列人終於到了米甸，摩西的姐姐在井邊。",
    "m5Success": "姐姐認出摩西，以色列人安全了！",
    "m6Narr": "法老的軍隊追到海邊，海水突然合起來，軍隊全部被淹沒。",
    "m6Success": "以色列人得救了！感謝神！",
    "summary": "摩西帶領以色列人出埃及過紅海，係聖經入面好重要既神蹟。",
    "mosesLearn1": "第一日：學習數十個災殃。埃及法老唔肯放以色列人走，神就降下十個大災殃。",
    "mosesLearn2": "第二日：認識以色列人。以色列人係神的子民，佢哋要離開埃及去應許之地。",
    "mosesLearn3": "第三日：學習祈禱。摩西帶領以色列人向神祈禱，神就為佢哋開路。",
    "mosesLearn4": "第四日：過紅海。以色列人走過紅海，海水喺佢哋兩邊分開，真係好神奇！",
    "mosesLearn5": "第五日：數吓有幾多人過紅海。以色列人好多好多人，一齊行過紅海。",
    "mosesLearn6": "第六日：分辨好野與壞野。法老軍隊追嚟，但係神保護以色列人！",
    # Mandarin
    "m1Narr_zhCN": "埃及法老不让以色列人离开，神降下十个灾殃。",
    "m1Success_zhCN": "瘟疫都离开了！",
    "m2Narr_zhCN": "摩西带领以色列人离开埃及，过红海到应许之地。",
    "m2Success_zhCN": "以色列人离开埃及！",
    "m3Narr_zhCN": "以色列人来到红海前，法老的军队追赶上来。",
    "m3Success_zhCN": "摩西向神祈祷，神叫红海分开。",
    "m4Narr_zhCN": "海水真的分开了！以色列人从中间走过。",
    "m4Success_zhCN": "全以色列人都安全过海！",
    "m5Narr_zhCN": "以色列人终于到了米甸，摩西的姐姐在井边。",
    "m5Success_zhCN": "姐姐认出摩西，以色列人安全了！",
    "m6Narr_zhCN": "法老的军队追到海边，海水突然合起来，军队全部被淹没。",
    "m6Success_zhCN": "以色列人得救了！感谢神！",
    "summary_zhCN": "摩西带领以色列人出埃及过红海，是圣经里面好重要的神迹。",
    "mosesLearn1_zhCN": "第一日：学习十个灾殃。埃及法老不肯放以色列人走，神就降下十个大灾殃。",
    "mosesLearn2_zhCN": "第二日：认识以色列人。以色列人是神的子民，他们要离开埃及去应许之地。",
    "mosesLearn3_zhCN": "第三日：学习祈祷。摩西带领以色列人向神祈祷，神就为他们开路。",
    "mosesLearn4_zhCN": "第四日：过红海。以色列人走过红海，海水在他们两边分开，真是好神奇！",
    "mosesLearn5_zhCN": "第五日：数一下有多少人过红海。以色列人好多好多人，一起走过红海。",
    "mosesLearn6_zhCN": "第六日：分辨好东西与坏东西。法老军队追来，但是神保护以色列人！",
    # English
    "m1Narr_en": "The Pharaoh of Egypt would not let the Israelites go, so God sent ten plagues.",
    "m1Success_en": "The plagues are over!",
    "m2Narr_en": "Moses led the Israelites out of Egypt, crossing the Red Sea to the promised land.",
    "m2Success_en": "The Israelites left Egypt!",
    "m3Narr_en": "The Israelites came to the Red Sea, and Pharaoh's army chased after them.",
    "m3Success_en": "Moses prayed to God, and God made the Red Sea part.",
    "m4Narr_en": "The water truly parted! The Israelites walked right through the middle.",
    "m4Success_en": "All the Israelites crossed the sea safely!",
    "m5Narr_en": "The Israelites finally arrived at Midian. Moses' sister was by the well.",
    "m5Success_en": "His sister recognized Moses! The Israelites were safe!",
    "m6Narr_en": "Pharaoh's army chased to the sea. The waters suddenly closed. The whole army was drowned.",
    "m6Success_en": "The Israelites were saved! Praise God!",
    "summary_en": "Moses led the Israelites out of Egypt and through the Red Sea. This is one of the most important miracles in the Bible.",
    "mosesLearn1_en": "Day One: Learn about the Ten Plagues. Pharaoh refused to let God's people go, so God sent ten powerful plagues.",
    "mosesLearn2_en": "Day Two: Meet the Israelites. God's people were leaving Egypt to go to the land God promised them.",
    "mosesLearn3_en": "Day Three: Learn to pray. Moses led the people in prayer, and God made a way for them.",
    "mosesLearn4_en": "Day Four: Crossing the Red Sea. The Israelites walked through the sea with water on both sides!",
    "mosesLearn5_en": "Day Five: Count how many people crossed. There were so many people crossing the Red Sea together!",
    "mosesLearn6_en": "Day Six: Tell good from bad. Pharaoh's army chased them, but God protected His people!",
    # Japanese
    "m1Narr_ja": "EgyptのファラオがIsrael人を行かせなかった。神様は十の災いを送った。",
    "m1Success_ja": "疫病が全て終わった！",
    "m2Narr_ja": "モーセがIsrael人を率いてEgyptを出発し、紅海を渡って約束の地へ向かった。",
    "m2Success_ja": "Israel人がEgyptを離れた！",
    "m3Narr_ja": "Israel人が紅海の前に着くと、ファラオの軍隊が追いかけてきた。",
    "m3Success_ja": "モーセが神様に祈ると、神様は紅海を分けた。",
    "m4Narr_ja": "海は本当に分かれた！Israel人が真中を通り過ぎた。",
    "m4Success_ja": "Israelの民 모두가無事に海を渡った！",
    "m5Narr_ja": "Israel人がついにMidianに着いた。モーセの姉が井戸のそばにいた。",
    "m5Success_ja": "姉がモーセを識別した！Israel人が安全だった！",
    "m6Narr_ja": "ファラオの軍が海まで追いかけてきた。海が突然閉じた。軍全部が溺れた。",
    "m6Success_ja": "Israel人が救われた！神様に感謝！",
    "summary_ja": "モーセがIsrael人をEgyptから紅海へ導いた。これは聖書の中でもとても大切な不思議です。",
    "mosesLearn1_ja": "一日目：十の災いを学ぶ。ファラオが神の子らを行かせなかった。神様は十の強力な災いを送った。",
    "mosesLearn2_ja": "二日目：Israel人を知る。神の子らがEgypt離れて、神様が約束した地向かっている。",
    "mosesLearn3_ja": "三日目：祈りを学ぶ。モーセが民を率いて祈ると、神様が道を開いてくださった。",
    "mosesLearn4_ja": "四日目：紅海を渡る。Israel人が海の中を歩いて渡った。両側に水があった！",
    "mosesLearn5_ja": "五日目：何人渡ったか数える。紅海を渡る人がとても多かった！",
    "mosesLearn6_ja": "六日目：良いことと悪いことを区別する。ファラオの軍が追いかけてきたが、神様が民を守った！",
}

def generate_audio(text, voice_id, output_path):
    """Generate audio using MiniMax T2A API."""
    # Skip if file already exists
    if os.path.exists(output_path):
        print(f"  EXISTS: {os.path.basename(output_path)}")
        return True
    
    url = "https://api.minimax.io/v1/t2a_v2"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    payload = {
        "model": "speech-2.8-hd",
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": 0.85,
            "vol": 1.0,
            "pitch": 0
        },
        "output_format": "url"
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        data = resp.json()
        
        if resp.status_code != 200 or data.get("base_resp", {}).get("status_code") != 0:
            print(f"  ERROR {resp.status_code}: {data}")
            return False
        
        audio_url = data.get("data", {}).get("audio_url")
        if not audio_url:
            print(f"  NO URL in response: {data}")
            return False
        
        # Download the audio file
        audio_resp = requests.get(audio_url, timeout=30)
        if audio_resp.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(audio_resp.content)
            print(f"  SAVED: {os.path.basename(output_path)}")
            return True
        else:
            print(f"  DOWNLOAD FAILED {audio_resp.status_code}")
            return False
            
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return False

def main():
    print("Generating moses audio files...")
    
    # Cantonese (zhHK)
    zhHK_keys = ["m1Narr","m1Success","m2Narr","m2Success","m3Narr","m3Success",
                 "m4Narr","m4Success","m5Narr","m5Success","m6Narr","m6Success",
                 "summary","mosesLearn1","mosesLearn2","mosesLearn3","mosesLearn4","mosesLearn5","mosesLearn6"]
    for key in zhHK_keys:
        text = AUDIO_CONTENT[key]
        voice = VOICES["zhHK"]
        filename = f"{key}_zhHK.mp3"
        output_path = os.path.join(BASE_DIR, filename)
        print(f"[zhHK] {key}")
        ok = generate_audio(text, voice, output_path)
        if ok:
            time.sleep(0.5)  # Rate limit protection
    
    # Mandarin (zhCN)
    zhCN_keys = ["m1Narr","m1Success","m2Narr","m2Success","m3Narr","m3Success",
                 "m4Narr","m4Success","m5Narr","m5Success","m6Narr","m6Success",
                 "summary","mosesLearn1","mosesLearn2","mosesLearn3","mosesLearn4","mosesLearn5","mosesLearn6"]
    for key in zhCN_keys:
        text = AUDIO_CONTENT[f"{key}_zhCN"]
        voice = VOICES["zhCN"]
        filename = f"{key}_zhCN.mp3"
        output_path = os.path.join(BASE_DIR, filename)
        print(f"[zhCN] {key}")
        ok = generate_audio(text, voice, output_path)
        if ok:
            time.sleep(0.5)
    
    # English
    en_keys = ["m1Narr","m1Success","m2Narr","m2Success","m3Narr","m3Success",
               "m4Narr","m4Success","m5Narr","m5Success","m6Narr","m6Success",
               "summary","mosesLearn1","mosesLearn2","mosesLearn3","mosesLearn4","mosesLearn5","mosesLearn6"]
    for key in en_keys:
        text = AUDIO_CONTENT[f"{key}_en"]
        voice = VOICES["en"]
        filename = f"{key}_en.mp3"
        output_path = os.path.join(BASE_DIR, filename)
        print(f"[en] {key}")
        ok = generate_audio(text, voice, output_path)
        if ok:
            time.sleep(0.5)
    
    # Japanese
    ja_keys = ["m1Narr","m1Success","m2Narr","m2Success","m3Narr","m3Success",
               "m4Narr","m4Success","m5Narr","m5Success","m6Narr","m6Success",
               "summary","mosesLearn1","mosesLearn2","mosesLearn3","mosesLearn4","mosesLearn5","mosesLearn6"]
    for key in ja_keys:
        text = AUDIO_CONTENT[f"{key}_ja"]
        voice = VOICES["ja"]
        filename = f"{key}_ja.mp3"
        output_path = os.path.join(BASE_DIR, filename)
        print(f"[ja] {key}")
        ok = generate_audio(text, voice, output_path)
        if ok:
            time.sleep(0.5)
    
    print(f"\nDone! Files in: {BASE_DIR}")
    print(f"Total files: {len(os.listdir(BASE_DIR))}")

if __name__ == "__main__":
    main()
