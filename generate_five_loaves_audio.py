#!/usr/bin/env python3
"""
Generate five_loaves audio files for all 4 languages using MiniMax TTS API.
"""
import subprocess
import json
import os
import time

API_KEY = "sk-cp-CNrQtXcYz6dieW7vUVGQY7iZA8L2SE37Dz3jtH6J9b2LkgwXvwGZM8EP-L8eiBx3r7UWwulYCS9v3eKkKO3Fb2TVJHH3-nujRXEZz1_oEGVaS_rnrWg8_gU"
ENDPOINT = "https://api.minimax.io/v1/t2a_v2"

# Voice IDs per language
VOICE_IDS = {
    "zhHK": 61,   # Cantonese_ProfessionalHost(M)
    "zhCN": 3,    # female-tianmei
    "enUS": 26,   # English_Trustworthy_Man
    "jaJP": 29,   # Japanese_KindLady
}

# All scripts: {audioKey: {lang: text}}
SCRIPTS = {
    # Day 1
    "f1Narr": {
        "zhHK": "耶穌教導群眾好多道理。群眾越來越多，有男有女，有老有嫩！小朋友，你數數看在場有幾多人？",
        "zhCN": "耶稣教导群众很多道理。群众越来越多，有男有女，有老有少！小朋友，你数数看在场有几个人？",
        "enUS": "Jesus taught the crowd many teachings. More and more people gathered, men and women, old and young! Children, can you count how many people are here?",
        "jaJP": "イエスは群衆に 많은 가르침을 전파されました。群衆は越来越多し、男性も女性も、年寄りも子供も！小朋友、あなたはここに何人いるか数えてみませんか？",
    },
    "f1Hint": {
        "zhHK": "試下點擊每一個人物，睇下佢哋係邊個！",
        "zhCN": "试着点击每一个人物，看看他们是谁！",
        "enUS": "Try clicking on each character to see who they are!",
        "jaJP": "それぞれのキャラクターをクリックして、誰か確かめてみましょう！",
    },
    "f1Fail": {
        "zhHK": "未數完喎，再試多次！",
        "zhCN": "还没数完哦，再试多次！",
        "enUS": "Not finished counting yet, try again!",
        "jaJP": "まだ数え終わってないよ、もう一度試して！",
    },
    "f1Success": {
        "zhHK": "真係好多人呀！有五千個男人，女人同小朋友就更加多喇！",
        "zhCN": "真的好多人呀！有五千个男人，女人和小朋友就更多喇！",
        "enUS": "So many people! There were five thousand men, and even more women and children!",
        "jaJP": "本当にたくさん人がいたね！五千人の男性、女性と子供はもっと多くいたよ！",
    },
    # Day 2
    "f2Narr": {
        "zhHK": "有一個小朋友帶咗自己嘅午餐——5個餅，同2條魚。不過群眾咁多人，這啲食物點夠食呢？",
        "zhCN": "有一个小朋友带了自己的午餐——5个饼，和2条鱼。不过群众这么多人，这些食物怎么够吃呢？",
        "enUS": "A little child brought their own lunch — 5 loaves of bread and 2 fish. But with so many people, how could this food possibly be enough?",
        "jaJP": "ある子供が自分の lunch を持参しました——5つのパンと2匹の魚。でも群衆がこんなに多いと、この食べ物で足りますか？",
    },
    "f2Hint": {
        "zhHK": "試下點擊個籃子，睇下入面有咩！",
        "zhCN": "试着点击篮子，看看里面有什么！",
        "enUS": "Try clicking on the basket to see what's inside!",
        "jaJP": "バスケットをクリックして、中身を見てみよう！",
    },
    "f2Fail": {
        "zhHK": "再點一次個籃子啦！",
        "zhCN": "再点一次篮子啦！",
        "enUS": "Click on the basket again!",
        "jaJP": "もう一度バスケットをクリックして！",
    },
    "f2Success": {
        "zhHK": "5個餅、2條魚！就係呢啲嘢，餵飽咗五千人！",
        "zhCN": "5个饼、2条鱼！就是这些东西，喂饱了五千人！",
        "enUS": "5 loaves and 2 fish! This was enough to feed five thousand people!",
        "jaJP": "5つのパンと2匹の魚！これで五千人を食べさせたんだよ！",
    },
    # Day 3
    "f3Narr": {
        "zhHK": "門徒將食物送到耶穌面前。耶穌望住天，祝福呢啲食物，然後擘開——奇蹟就發生喇！",
        "zhCN": "门徒将食物送到耶稣面前。耶稣望着天，祝福这些食物，然后掰开——奇迹就发生了！",
        "enUS": "The disciples brought the food to Jesus. Jesus looked up to heaven, blessed the food, and broke it — and the miracle happened!",
        "jaJP": "弟子たちが食べ物をイエスの前に持ってきました。イエスは天を見上げ、食べ物に祝福を祈り、そして裂きました——奇跡が起きたのです！",
    },
    "f3Hint": {
        "zhHK": "點擊個餅同魚，睇下耶穌做啲咩！",
        "zhCN": "点击饼和鱼，看看耶稣做什么！",
        "enUS": "Click on the bread and fish to see what Jesus does!",
        "jaJP": "パンと魚をクリックして、イエスが何をするか見てみよう！",
    },
    "f3Fail": {
        "zhHK": "試下再點擊食物！",
        "zhCN": "试着再点击食物！",
        "enUS": "Try clicking on the food again!",
        "jaJP": "もう一度食べ物をクリックして！",
    },
    "f3Success": {
        "zhHK": "耶穌祝福完，餅同魚越分越多，多到分不完！",
        "zhCN": "耶稣祝福完，饼和鱼越分越多，多到分不完！",
        "enUS": "After Jesus blessed it, the bread and fish multiplied so much that there was more than enough!",
        "jaJP": "イエスの祝福の後、パンと魚は分けるほど増え続けて、終わりもなく余ったよ！",
    },
    # Day 4
    "f4Narr": {
        "zhHK": "群眾人人都食飽咗！小朋友，試下將食物分俾每個小朋友，睇下佢哋笑唔笑！",
        "zhCN": "群众人人都吃饱了！小朋友，试着将食物分给每个小朋友，看看他们笑不笑！",
        "enUS": "Everyone in the crowd was filled! Children, try sharing the food with each child and see them smile!",
        "jaJP": "群衆のみんながみんなお腹一杯になったよ！小朋友、食べ物たちを他の子供たちに分けてみて、彼らが笑うか見てね！",
    },
    "f4Hint": {
        "zhHK": "將食物拖去每個小朋友度！",
        "zhCN": "将食物拖到每个小朋友那里！",
        "enUS": "Drag the food to each child!",
        "jaJP": "食べ物をそれぞれの子供たちのところにドラッグしてね！",
    },
    "f4Fail": {
        "zhHK": "記得每個小朋友都要分到嘢食！",
        "zhCN": "记得每个小朋友都要分到吃的！",
        "enUS": "Remember, every child needs to get some food!",
        "jaJP": "すべての子供たちに行き渡るように気をつけてね！",
    },
    "f4Success": {
        "zhHK": "每個人都食飽咗！仲要剩低好多添！",
        "zhCN": "每个人都吃饱了！还要剩下好多呢！",
        "enUS": "Everyone was fed, and there were leftovers — lots of them!",
        "jaJP": "みんなが皆お腹一杯になったよ！それでもまだたくさん余ったよ！",
    },
}

OUTPUT_DIR = "/Users/zachli/repos/preschool/audio/five_loaves"

def generate_audio(text, voice_id, output_path):
    """Call MiniMax TTS API to generate audio file."""
    payload = {
        "model": "speech-02-hd",
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": 1.0,
            "volume": 1.0,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
        },
    }
    
    cmd = [
        "curl", "-s", "-X", "POST",
        ENDPOINT,
        "-H", f"Authorization: Bearer {API_KEY}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps(payload),
        "-o", output_path,
    ]
    
    result = subprocess.run(cmd, capture_output=True)
    return result.returncode == 0

def get_file_size(path):
    try:
        return os.path.getsize(path)
    except:
        return 0

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    results = {}
    total = 0
    success = 0
    failed = []
    
    audio_keys = ["f1Narr", "f1Hint", "f1Fail", "f1Success",
                  "f2Narr", "f2Hint", "f2Fail", "f2Success",
                  "f3Narr", "f3Hint", "f3Fail", "f3Success",
                  "f4Narr", "f4Hint", "f4Fail", "f4Success"]
    
    for audio_key in audio_keys:
        for lang in ["zhHK", "zhCN", "enUS", "jaJP"]:
            text = SCRIPTS[audio_key][lang]
            voice_id = VOICE_IDS[lang]
            filename = f"{audio_key}_{lang}.mp3"
            output_path = os.path.join(OUTPUT_DIR, filename)
            
            total += 1
            ok = generate_audio(text, voice_id, output_path)
            
            if ok and get_file_size(output_path) > 1000:
                success += 1
                print(f"✓ {filename} ({get_file_size(output_path)} bytes)")
            else:
                failed.append(filename)
                size = get_file_size(output_path)
                print(f"✗ {filename} (size={size})")
    
    print(f"\n{'='*50}")
    print(f"Total: {total}, Success: {success}, Failed: {len(failed)}")
    if failed:
        print(f"Failed files: {failed}")

if __name__ == "__main__":
    main()
