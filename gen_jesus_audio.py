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
 },
 'zhCN':{
  'j1Narr':'天使加百列去向馬利亞報信，告訴她將要生一個特別的BB，衕要名叫耶穌。',
  'j1Hint':'試着點擊天使三次，讓天使飛到馬利亞身邊。',
  'j1Fail':'再試一次，點擊天使吧。',
  'j1Success':'太棒了！你幫助天使向馬利亞報信了！',
  'j2Narr':'馬利亞去探望她的表姐伊利沙伯，路途很遠，但她很開心。',
  'j2Hint':'點擊馬利亞，讓她走去伊利沙伯的家。',
  'j2Fail':'點擊馬利亞，讓她繼續前進吧。',
  'j2Success':'馬利亞見到了伊利沙伯，她肚裏的BB在跳動，真是太神奇了！',
  'j3Narr':'約瑟做夢，夢中有天使前來，告訴他馬利亞的BB是從聖靈來的，不用擔心。',
  'j3Hint':'點擊約瑟，讓他做夢見到天使。',
  'j3Fail':'再點擊一次約瑟吧。',
  'j3Success':'約瑟醒了，他決定好好照顧馬利亞和耶穌。',
  'j4Narr':'羅馬皇帝下令所有人回鄉，約瑟带着馬利亞騎着驢子前往伯利恆，路途很遠。',
  'j4Hint':'拖着驢子從拿撒勒走到伯利恆吧。',
  'j4Fail':'用力拖着驢子繼續前進吧。',
  'j4Success':'終於到了伯利恆！約瑟和馬利亞準備迎接BB的到來。',
  'j5Narr':'伯利恆沒有旅館，馬利亞在馬棚裏生下了BB，她把耶穌放在馬槽裏。',
  'j5Hint':'點擊天上最亮的那顆星，讓它引導你找到耶穌。',
  'j5Fail':'點擊更亮的星試試看。',
  'j5Success':'耶穌降生了！天使在天上唱歌，歡迎這世界的救主！',
  'j6Narr':'天使在伯利恆郊外向牧羊人報信，說救主耶穌已經降生，牧羊人就去尋找耶穌。',
  'j6Hint':'點擊羊群，讓牧羊人出發去找耶穌。',
  'j6Fail':'再點擊一次羊群吧。',
  'j6Success':'牧羊人見到了耶穌，好開心！他們將好消息告訴了所有人。',
  'j7Narr':'東方有博士觀星，看到一顆很特別的星，就跟着它找到了耶穌，送給他黃金、乳香、沒藥。',
  'j7Hint':'點擊跟着星星，從耶路撒冷走到伯利恆。',
  'j7Fail':'跟着星星走吧。',
  'j7Success':'博士見到耶穌，俯伏敬拜他，奉上寶貴的禮物！',
  'summary':'耶穌降生是一個充滿愛與希望的故事。天使報喜訊，牧羊人和博士都來朝拜。耶穌是上帝的兒子，來到世界帶給我們愛和希望。'
 },
 'en':{
  'j1Narr':'The angel Gabriel comes to Mary and tells her she will give birth to a very special baby, and his name will be Jesus.',
  'j1Hint':'Try clicking the angel three times to make it fly to Mary.',
  'j1Fail':'Try again! Click the angel.',
  'j1Success':'Well done! You helped the angel deliver the message to Mary!',
  'j2Narr':'Mary goes to visit her cousin Elizabeth. The journey is long, but Mary is very happy.',
  'j2Hint':'Click Mary to make her walk to Elizabeth\'s house.',
  'j2Fail':'Click Mary to make her keep walking.',
  'j2Success':'Mary meets Elizabeth, and she can feel the baby jumping inside her tummy. How wonderful!',
  'j3Narr':'Joseph has a dream. An angel appears and tells him the baby in Mary is from the Holy Spirit, so he should not worry.',
  'j3Hint':'Click Joseph to make him dream and see the angel.',
  'j3Fail':'Click Joseph again.',
  'j3Success':'Joseph wakes up. He decides to take good care of Mary and Baby Jesus.',
  'j4Narr':'The Roman emperor orders everyone to return to their hometown. Joseph takes Mary on a donkey to Bethlehem. The journey is long.',
  'j4Hint':'Drag the donkey from Nazareth all the way to Bethlehem.',
  'j4Fail':'Drag the donkey carefully to keep going.',
  'j4Success':'At last they arrived in Bethlehem! Joseph and Mary are ready to welcome Baby Jesus.',
  'j5Narr':'There was no room at the inn in Bethlehem. Mary gave birth to Baby Jesus in a stable and laid him in a manger.',
  'j5Hint':'Click the brightest star in the sky to find Baby Jesus.',
  'j5Fail':'Try clicking a brighter star.',
  'j5Success':'Jesus is born! The angels sing in heaven, welcoming the Savior of the world!',
  'j6Narr':'An angel appears to the shepherds in the fields near Bethlehem, telling them the Savior Jesus is born. The shepherds go to find Jesus.',
  'j6Hint':'Click the sheep to make the shepherds set off to find Jesus.',
  'j6Fail':'Click the sheep again.',
  'j6Success':'The shepherds find Baby Jesus and are so happy! They tell everyone the good news.',
  'j7Narr':'Wise men from the East see a very special star. They follow it and find Baby Jesus, bringing gifts of gold, frankincense, and myrrh.',
  'j7Hint':'Click to follow the star, from Jerusalem all the way to Bethlehem.',
  'j7Fail':'Follow the star.',
  'j7Success':'The wise men find Jesus, bow down to worship him, and offer their precious gifts!',
  'summary':'The birth of Jesus is a wonderful story of love and hope. The angel brought good news, and the shepherds and wise men came to worship. Jesus is the Son of God, who came into the world to bring us love and hope.'
 },
 'zhHK':{
  'j1Narr':'天使加百列去見馬利亞，話佢將會生一個好特別既BB，佢既名要叫耶穌。',
  'j1Hint':'試下點擊天使三次，等佢飛去馬利亞身邊。',
  'j1Fail':'試多一次，點擊天使。',
  'j1Success':'好棒！你幫助天使報信俾馬利亞！',
  'j2Narr':'馬利亞去探訪佢表姐伊利沙伯，路途好遠，但係佢好開心。',
  'j2Hint':'點擊馬利亞，等佢行去伊利沙伯屋企。',
  'j2Fail':'點擊馬利亞，等佢行過去。',
  'j2Success':'耶！馬利亞見到伊利沙伯，佢個BB喺肚裏面跳動，真係好神奇！',
  'j3Narr':'約瑟發夢，夢到有天使話俾佢知，馬利亞既BB係從聖靈嚟嘅，唔使擔心。',
  'j3Hint':'點擊約瑟，等佢發夢見到天使。',
  'j3Fail':'點擊約瑟，等佢發夢。',
  'j3Success':'約瑟醒咗，佢知道要好好照顧馬利亞同耶穌。',
  'j4Narr':'羅馬皇帝叫所有人回鄉，約瑟帶住馬利亞騎驢仔去伯利恆，路途好遠。',
  'j4Hint':'拖住驢仔由拿撒勒去到伯利恆。',
  'j4Fail':'拖住驢仔繼續行。',
  'j4Success':'終於到咗伯利恆！約瑟同馬利亞準備迎接BB既嚟到。',
  'j5Narr':'伯利恆冇酒店，馬利亞喺馬棚裏面生咗BB，佢將耶穌放喺馬槽裏面。',
  'j5Hint':'點擊天上最光嗰粒星，等佢引導你搵到耶穌。',
  'j5Fail':'點擊更光嗰粒星。',
  'j5Success':'耶穌降生咗！天使喺天上唱歌，歡迎呢個世界嘅救主！',
  'j6Narr':'天使喺伯利恆郊外向牧羊人報信，話救主耶穌已經降生，牧羊人就去搵耶穌。',
  'j6Hint':'點擊羊群，等牧羊人出發去找耶穌。',
  'j6Fail':'點擊羊群，等牧羊人出發。',
  'j6Success':'牧羊人見到耶穌，好開心！佢哋將好消息告訴所有人。',
  'j7Narr':'東方有博士觀星，見到一顆好特別既星，就跟住佢搵到耶穌，送俾佢黃金、乳香、沒藥。',
  'j7Hint':'點擊跟隨星星，由耶路撒冷去到伯利恆。',
  'j7Fail':'跟住星星行。',
  'j7Success':'博士見到耶穌，俯伏拜佢，奉上寶貴既禮物！',
  'summary':'耶穌降生係一個好特別既故事。天使報喜訊，牧羊人同博士都來朝拜。耶穌係上帝既兒子，嚟到世界帶畀我哋愛同希望。'
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

for lang in LANGS.keys():
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
