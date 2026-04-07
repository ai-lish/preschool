#!/usr/bin/env python3
import os, json, subprocess, time, base64
BASE = os.path.dirname(__file__)
OUT = os.path.join(BASE, 'audio','jesus')
LANGS = {
 'ja': {'voice':'Japanese_KindLady','dir':'ja'},
 'zhCN':{'voice':'female-tianmei','dir':'zhCN'},
 'en':{'voice':'English_Trustworthy_Man','dir':'en'},
 'zhHK':{'voice':'Cantonese_GentleLady','dir':'zhHK'}
}
keys = [
  'j1Narr','j1Hint','j1Fail','j1Success',
  'j2Narr','j2Hint','j2Fail','j2Success',
  'j3Narr','j3Hint','j3Fail','j3Success',
  'j4Narr','j4Hint','j4Fail','j4Success',
  'j5Narr','j5Hint','j5Fail','j5Success',
  'j6Narr','j6Hint','j6Fail','j6Success',
  'j7Narr','j7Hint','j7Fail','j7Success',
  'summary'
]
# sample short texts for testing (Japanese)
texts = {
 'ja':{
  'j1Narr':'天使ガブリエルがマリアに会い、特別な赤ちゃんが生まれることを告げます。名前はイエスです。',
  'j1Hint':'天使を3回クリックして、マリアに近づけてみましょう。',
  'j1Fail':'もう一度試してね。天使をクリックしてね。',
  'j1Success':'よくできました！天使がマリアに知らせました。',
  'j2Narr':'マリアはエリサベツを訪ねます。道は遠いけど、マリアは嬉しいです。',
  'j2Hint':'マリアをクリックして、歩かせてみましょう。',
  'j2Fail':'マリアをクリックして、先へ進めてね。',
  'j2Success':'マリアはエリサベツに会い、赤ちゃんが元気に動いているのを感じます。',
  'j3Narr':'ヨセフは夢を見ます。天使が来て、この赤ちゃんは聖霊によるものだと告げます。',
  'j3Hint':'ヨセフをクリックして、夢を見るのを見てみよう。',
  'j3Fail':'もう一度ヨセフをクリックしてみてね。',
  'j3Success':'ヨセフは目を覚まし、マリアと赤ちゃんを大事にすると決めます。',
  'j4Narr':'ローマの皇帝が帰省令を出し、ヨセフはロバに乗りマリアを連れてベツレヘムへ向かいます。',
  'j4Hint':'ロバをドラッグして、ナザレからベツレヘムまで連れて行ってね。',
  'j4Fail':'ロバをしっかりドラッグしてね。',
  'j4Success':'ついにベツレヘムに到着しました！',
  'j5Narr':'宿屋が満室で、マリアは馬小屋で赤ちゃんを産み、イエスを飼い葉おけに寝かせます。',
  'j5Hint':'空の一番明るい星をクリックして、イエスを見つけてね。',
  'j5Fail':'もっと明るい星をクリックしてみてね。',
  'j5Success':'イエスが生まれました！天使たちが歌います。',
  'j6Narr':'羊飼いたちに天使が知らせ、彼らはイエスを見に行きます。',
  'j6Hint':'羊をクリックして、羊飼いを前に進めてね。',
  'j6Fail':'羊をもう一度クリックしてね。',
  'j6Success':'羊飼いたちはイエスを見つけ、喜びます。',
  'j7Narr':'東の博士たちは星を見て、特別な星を追ってイエスに会います。',
  'j7Hint':'星をクリックして、博士たちを導いてね。',
  'j7Fail':'星についていってね。',
  'j7Success':'博士たちはイエスを見つけ、贈り物をささげます。',
  'summary':'イエスの誕生は愛と希望の物語です。'
 }
}

API_KEY = os.environ.get('MINIMAX_API_KEY','')
# Fallback: try to read from ~/.zshrc
if not API_KEY:
    try:
        with open(os.path.expanduser('~/.zshrc')) as f:
            for line in f:
                if 'MINIMAX_API_KEY' in line and '=' in line:
                    API_KEY = line.split('=',1)[1].strip().strip('\"').strip("'")
                    break
    except Exception:
        pass
if not API_KEY:
    print('MINIMAX_API_KEY not set. Abort.'); exit(1)

import pathlib

for lang in ['ja']:
    cfg = LANGS[lang]
    outdir = os.path.join(OUT,cfg['dir'])
    pathlib.Path(outdir).mkdir(parents=True,exist_ok=True)
    voice = cfg['voice']
    for k in keys:
        text = texts[lang].get(k, '...')
        out_file = os.path.join(outdir,f"{k}.mp3")
        if os.path.exists(out_file) and os.path.getsize(out_file)>2000:
            print(f'{lang}/{k}: exists')
            continue
        payload = {"model":"speech-2.8-hd","text":text,"stream":False,"voice_setting":{"voice_id":voice,"speed":1.0,"vol":1.0},"audio_setting":{"sample_rate":32000,"bitrate":128000,"format":"mp3"}}
        # call API and decode returned base64 audio
        cmd = ['curl','-s','--location','https://api.minimax.io/v1/t2a_v2','-H',f'Authorization: Bearer {API_KEY}','-H','Content-Type: application/json','-d',json.dumps(payload)]
        print('-> request',k)
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=40, check=True)
            data = json.loads(r.stdout)
            audio_b64 = data.get('data', {}).get('audio')
            if not audio_b64:
                print('no audio for',k, data.get('base_resp') or data.get('extra_info') or data)
                continue
            # fix base64 padding
            missing_padding = len(audio_b64) % 4
            if missing_padding:
                audio_b64 += '=' * (4 - missing_padding)
            audio_bytes = base64.b64decode(audio_b64)
            with open(out_file, 'wb') as f:
                f.write(audio_bytes)
            print(k, '->', len(audio_bytes), 'bytes')
            time.sleep(0.2)
        except Exception as e:
            print('error', e)

print('done')
