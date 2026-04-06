#!/usr/bin/env python3
"""
MiniMax TTS 批量生成腳本
用於幼兒聖經故事音頻生成

用法:
    python3 gen_audio.py --story creation --lang zhHK
    python3 gen_audio.py --story all --lang all
    python3 gen_audio.py --story jesus --lang all --dry-run
"""

import os
import sys
import json
import argparse
import requests
import time
from pathlib import Path
from urllib.parse import quote

# ============ 配置 ============
API_KEY = os.environ.get("MINIMAX_API_KEY", "sk-cp-CNrQtXcYz6dieW7vUVGQY7iZA8L2SE37Dz3jtH6J9b2LkgwXvwGZM8EP-L8eiBx3r7UWwulYCS9v3eKkKO3Fb2TVJHH3-nujRXEZz1_oEGVaS_rnrWg8_gU")
API_URL = "https://api.minimax.io/v1/t2a_v2"

# Voice ID 配置（按語言）
VOICE_IDS = {
    "zhHK": "Cantonese_GentleLady",      # 粵語
    "zhCN": "female-tianmei",              # 國語
    "en": "English_Trustworthy_Man",       # 英文
    "ja": "Japanese_KindLady",             # 日文
}

# 語速配置
SPEEDS = {
    "zhHK": 0.85,   # 粵語慢啲
    "zhCN": 0.85,
    "en": 0.8,      # 英文正常
    "ja": 0.8,      # 日文正常
}

# ============ 音頻內容 ============

# 創造遊戲音頻
CREATION_AUDIO = {
    "welcome": {
        "zhHK": "你好！歡迎嚟到創造嘅故事！我哋一齊去睇上帝點樣創造世界啦！",
        "zhCN": "你好！歡迎來到創造的故事！我們一起去看看上帝怎樣創造世界吧！",
        "en": "Hello! Welcome to the story of Creation! Let's see how God created the world!",
        "ja": "こんにちは！創造の物語へようこそ！神様がどのように世界を創られたか、一緒に見ましょう！"
    },
    "d1Narr": {
        "zhHK": "上帝說：要有光，就有了光。光係幾咁奇妙啊！",
        "zhCN": "上帝说：要有光，就有了光。光是多么奇妙啊！",
        "en": "God said: Let there be light, and there was light. How wonderful is light!",
        "ja": "神様は「光あれ」とお言いになりました。そして光がありました。光是多么美しいでしょう！"
    },
    "d1Hint": {
        "zhHK": "試下大聲啲講「要有光」！",
        "zhCN": "试着大声点说「要有光」！",
        "en": "Try saying 'Let there be light' loudly!",
        "ja": "「光あれ」を大きく言ってみましょう！"
    },
    "d1Fail": {
        "zhHK": "再大聲啲啦！上帝聽唔到你喎。",
        "zhCN": "再大声点啦！上帝听不到你哦。",
        "en": "Louder please! God can't hear you.",
        "ja": "もっと大きくしてください！神様が届かないよ。"
    },
    "d1Success": {
        "zhHK": "太好了！光出現了！世界不再係黑暗嘅了！",
        "zhCN": "太好了！光出现了！世界不再黑暗了！",
        "en": "Excellent! Light appeared! The world is no longer dark!",
        "ja": "素晴らしい！光が現れた！世界はもう暗くない！"
    },
    "d2Narr": {
        "zhHK": "上帝創造咗天空，將水分成天上地下。天上嘅雲同地下嘅水，都係上帝嘅創造！",
        "zhCN": "上帝创造了天空，将水分成天上地下。天上的云和地下的水，都是上帝的创造！",
        "en": "God created the sky, separating water above and below. The clouds and water are all God's creation!",
        "ja": "神様は空を創り、水を天と地に分けました。天の雲と地の水都是神様の創造物！"
    },
    "d2Success": {
        "zhHK": "好靚啊！藍天白雲出現了！",
        "zhCN": "好漂亮啊！蓝天白云出现了！",
        "en": "How beautiful! Blue sky and white clouds appeared!",
        "ja": "美しい！青空と白い雲が現れた！"
    },
    "d3Narr": {
        "zhHK": "上帝話要有陸地，陸地就出現了仲有植物和水果！",
        "zhCN": "上帝说要有陆地，陆地就出现了，还有植物和水果！",
        "en": "God said let there be land, and land appeared with plants and fruits!",
        "ja": "神様は「地あれ」とお言いになりました。そして陸が現れ、植物や果物も！"
    },
    "d3Success": {
        "zhHK": "好犀利！草地、樹木、花朵都出現了！",
        "zhCN": "好厉害！草地、树木、花朵都出现了！",
        "en": "Amazing! Grass, trees and flowers all appeared!",
        "ja": "すごい！草地、木、花が皆現れた！"
    },
    "d4Narr": {
        "zhHK": "上帝創造咗太陽月亮星星，照亮白天同黑夜。",
        "zhCN": "上帝创造了太阳月亮星星，照亮白天和黑夜。",
        "en": "God created the sun, moon and stars to shine during day and night.",
        "ja": "神様は太陽、月、星を創り、昼と夜を照らします。"
    },
    "d4Success": {
        "zhHK": "好靚啊！太陽伯伯話日間，星星月亮就會響夜晚出現！",
        "zhCN": "好漂亮啊！太阳公公负责白天，星星月亮就会在夜晚出现！",
        "en": "Beautiful! The sun takes care of day, and the stars and moon come out at night!",
        "ja": "美しい！太陽はお昼 담당하고、星と月は夜に現れるの！"
    },
    "d5Narr": {
        "zhHK": "上帝創造咗魚同鳥，海入面有魚，天空有雀仔！",
        "zhCN": "上帝创造了鱼和鸟，海里面有鱼，天空有鸟儿！",
        "en": "God created fish and birds. Fish swim in the sea, birds fly in the sky!",
        "ja": "神様は魚と鳥を創りました。海には魚、空には鳥がいます！"
    },
    "d5Success": {
        "zhHK": "好得意啊！魚仔游水，雀仔飛翔！",
        "zhCN": "好可爱啊！鱼儿游泳，鸟儿飞翔！",
        "en": "So cute! Fish swim and birds fly!",
        "ja": "かわいい！魚が泳ぎ、鳥が飛ぶ！"
    },
    "d6Narr": {
        "zhHK": "上帝創造咗動物，最後創造咗人類——亞當同夏娃！",
        "zhCN": "上帝创造了动物，最后创造了人类——亚当和夏娃！",
        "en": "God created animals, and finally humans — Adam and Eve!",
        "ja": "神様は動物創り、そして最後に人間——アダムとエバ！"
    },
    "d6Success": {
        "zhHK": "完美！世界萬物都創造好了！",
        "zhCN": "完美！世界万物都创造好了！",
        "en": "Perfect! All of creation is complete!",
        "ja": "完璧！すべての創造が完了しました！"
    },
    "summary": {
        "zhHK": "七日創造完成晒！上帝用七日創造咗成個世界，我哋要感謝上帝啊！",
        "zhCN": "七日创造完成了！上帝用七日创造了整个世界，我们要感谢上帝！",
        "en": "The seven days of creation are complete! God created the whole world in seven days. We should thank God!",
        "ja": "七日間の創造が完了しました！神様は七日間で世界を創られました。感謝しましょう！"
    }
}

# 挪亞方舟音頻
NOAH_AUDIO = {
    "n1Narr": {
        "zhHK": "上帝叫挪亞建造方舟，因為有大洪水要來。方舟係一隻好大好大嘅船！",
        "zhCN": "上帝叫挪亚建造方舟，因为有大洪水要来。方舟是一只好大好大的船！",
        "en": "God told Noah to build an ark because a great flood was coming. The ark was a very big boat!",
        "ja": "神様はノアに箱舟を建造するよう告げました。大洪水が来るからです。箱舟是一只很大的船！"
    },
    "n1Success": {
        "zhHK": "方舟做好了！好靚啊！",
        "zhCN": "方舟做好了！好漂亮啊！",
        "en": "The ark is ready! How beautiful!",
        "ja": "箱舟ができました！美しい！"
    },
    "n2Narr": {
        "zhHK": "動物一對對走入方舟，大象、獅子、長頸鹿...佢哋好有秩序啊！",
        "zhCN": "动物一对对走入方舟，大象、狮子、长颈鹿...它们好有秩序啊！",
        "en": "Animals went onto the ark in pairs. Elephants, lions, giraffes... they were so orderly!",
        "ja": "動物たちが二人ずつ箱舟に入りました。象、ライオン、キリン...皆有序々！"
    },
    "n2Success": {
        "zhHK": "所有動物都上船了！準備好應付洪水了！",
        "zhCN": "所有动物都上船了！准备好应付洪水了！",
        "en": "All animals are on board! Ready for the flood!",
        "ja": "すべての動物が乗船しました！洪水做好准备！"
    },
    "n3Narr": {
        "zhHK": "雨開始降落了！好大雨啊！但係挪亞一家人喺方舟入面好安全。",
        "zhCN": "雨开始降落了！好大的雨啊！但是挪亚一家人在方舟里面好安全。",
        "en": "Rain started falling! Heavy rain! But Noah's family was safe inside the ark.",
        "ja": "雨が降り始めた！激しい雨！でもノア家族は箱舟の中で安全でした。"
    },
    "n3Success": {
        "zhHK": "雨停了！洪水慢慢退卻！",
        "zhCN": "雨停了！洪水慢慢消退！",
        "en": "The rain stopped! The flood is slowly receding!",
        "ja": "雨が止んだ！洪水がだんだん引いていく！"
    },
    "n4Narr": {
        "zhHK": "方舟漂喺水面上面，挪亞放出鴿子去探路。",
        "zhCN": "方舟漂在水面上，挪亚放出鸽子去探路。",
        "en": "The ark floated on the water. Noah sent out a dove to find land.",
        "ja": "箱舟が水面に浮かび、ノアはすみかを探すために鴿を放しました。"
    },
    "n4Success": {
        "zhHK": "鴿子帶住橄欖樹葉返嚟！表示陸地出現了！",
        "zhCN": "鸽子带着橄榄树叶回来！表示陆地出现了！",
        "en": "The dove returned with an olive leaf! Land has appeared!",
        "ja": "鴿がオリーブの葉を持って帰ってきた！陸が現れた！"
    },
    "n5Narr": {
        "zhHK": "洪水完全退卻了！挪亞一家人同所有動物離開方舟，展開新生活！",
        "zhCN": "洪水完全消退了！挪亚一家人和所有动物离开方舟，展开新生活！",
        "en": "The flood completely receded! Noah and all the animals left the ark to start a new life!",
        "ja": "洪水が完全に引いた！ノアとすべての動物が箱舟を出て、新しい生活が始まった！"
    },
    "n5Success": {
        "zhHK": "安全了！大家一齊走嚟感謝上帝！",
        "zhCN": "安全了！大家一起走来感谢上帝！",
        "en": "Safe! Everyone came out to thank God!",
        "ja": "安全！皆出て神様に感謝！"
    },
    "n6Narr": {
        "zhHK": "上帝放了一道彩虹喺天空，作為不再用洪水毀滅世界的記號。",
        "zhCN": "上帝放了一道彩虹在天空，作为不再用洪水毁灭世界的记号。",
        "en": "God placed a rainbow in the sky as a sign that He would never again destroy the world with a flood.",
        "ja": "神様は空に虹を置き、もう洪水で世界を決して滅ぼさないしるしとしました。"
    },
    "n6Success": {
        "zhHK": "彩虹好靚啊！每次見到彩虹，就記得上帝嘅應許！",
        "zhCN": "彩虹好漂亮啊！每次见到彩虹，就记住上帝的应许！",
        "en": "The rainbow is so beautiful! Every time we see a rainbow, we remember God's promise!",
        "ja": "虹が美しい！虹を見るたびに、神様の約束を思い出します！"
    },
    "summary": {
        "zhHK": "挪亞方舟嘅故事教導我哋要信靠上帝，遵守祂嘅說話。方舟帶嚟平安，彩虹係上帝嘅應許——祂會一直睇住我哋。",
        "zhCN": "挪亚方舟的故事教导我们要信靠上帝，遵守祂的话。方舟带来平安，彩虹是上帝的应许——祂会一直看住我们。",
        "en": "The story of Noah's Ark teaches us to trust God and obey His words. The ark brought safety, and the rainbow is God's promise that He will always watch over us.",
        "ja": "ノアの箱舟の話は、神様を信頼し、その言葉に従うことを教えます。箱舟は安全をもたらし、虹は神様の約束——いつも私たちを見守ってくださるというしるしです。"
    }
}

# 摩西過紅海音頻
MOSES_AUDIO = {
    "m1Narr": {
        "zhHK": "埃及法老唔肯放以色列人走，上帝降下十個瘟疫。青蛙、蒼蠅、蝗蟲...法老終於肯放人走了！",
        "zhCN": "埃及法老不肯放以色列人走，上帝降下十个瘟疫。青蛙、苍蝇、蝗虫...法老终于肯放人走了！",
        "en": "The Pharaoh refused to let God's people go. God sent ten plagues. Frogs, flies, locusts... Finally, Pharaoh let them go!",
        "ja": "エジプトのファラオが神様の民を行かせませんでした。神様は十の災いを送られました。蛙、蝿、バッタ...ファラオ遂に人を去らせた！"
    },
    "m1Success": {
        "zhHK": "瘟疫結束了！以色列人終於可以離開埃及了！",
        "zhCN": "瘟疫结束了！以色列人终于可以离开埃及了！",
        "en": "The plagues ended! The Israelites could finally leave Egypt!",
        "ja": "災いが終わった！イスラエル人はやっとエジプトを離れられた！"
    },
    "m2Narr": {
        "zhHK": "摩西帶領以色列人離開埃及，紅海就喺前面。法老嘅軍隊追埋嚟了！",
        "zhCN": "摩西带领以色列人离开埃及，红海就在前面。法老的军队追来了！",
        "en": "Moses led the Israelites out of Egypt. The Red Sea was ahead! Pharaoh's army was chasing them!",
        "ja": "モーセがイスラエル人を率いてエジプトを出发。紅海が前にある！ファラオの軍隊が追ってきた！"
    },
    "m2Success": {
        "zhHK": "以色列人離開埃及了！向著自由出發！",
        "zhCN": "以色列人离开埃及了！向着自由出发！",
        "en": "The Israelites left Egypt! Heading towards freedom!",
        "ja": "イスラエル人はエジプトを離れた！自由に向かって出発！"
    },
    "m3Narr": {
        "zhHK": "紅海阻住去路，軍隊就喺後面。摩西向God祈禱！",
        "zhCN": "红海阻住去路，军队就在后面。摩西向上帝祈祷！",
        "en": "The Red Sea blocked the way. The army was behind them. Moses prayed to God!",
        "ja": "紅海が道を広げて、軍隊が後にいる。モーセが神様に祈った！"
    },
    "m3Success": {
        "zhHK": "上帝回應摩西的祈禱！準備行神蹟了！",
        "zhCN": "上帝回应摩西的祈祷！准备行神迹了！",
        "en": "God answered Moses' prayer! Getting ready to perform a miracle!",
        "ja": "神様がモーセの祈りに答えた！奇跡の準備ができました！"
    },
    "m4Narr": {
        "zhHK": "摩西向紅海伸杖，上帝使紅海分開，中間變成乾地！",
        "zhCN": "摩西向红海伸杖，上帝使红海分开，中间变成干地！",
        "en": "Moses stretched out his hand over the sea. God divided the sea, making a path of dry ground!",
        "ja": "モーセが杖を海に伸べ，神様が海を分かち、間に旱地が現れた！"
    },
    "m4Success": {
        "zhHK": "海水分開了！一條大路出現了！",
        "zhCN": "海水分开了！一条大路出现了！",
        "en": "The sea divided! A great road appeared!",
        "ja": "海が之分かれた！大きな道が現れた！"
    },
    "m5Narr": {
        "zhHK": "以色列人行過海底，平安到達對岸！",
        "zhCN": "以色列人走过海底，平安到达对岸！",
        "en": "The Israelites walked through the sea and safely reached the other side!",
        "ja": "イスラエル人が海を通り、共に、対岸に安全に到着！"
    },
    "m5Success": {
        "zhHK": "全部人都安全過海了！好感恩啊！",
        "zhCN": "全部人都安全过海了！好感恩啊！",
        "en": "Everyone safely crossed the sea! So grateful!",
        "ja": " 모두가安全に海を渡った！感謝！"
    },
    "m6Narr": {
        "zhHK": "法老的軍隊追入海底，上帝叫海水合埋，軍隊全部被淹沒了。",
        "zhCN": "法老的军队追入海底，上帝叫海水合拢，军队全部被淹没了。",
        "en": "Pharaoh's army chased into the sea. God closed the waters and the army was drowned.",
        "ja": "ファラオの軍隊が海に逃げ込み、神様が水を閉じ、軍隊が皆水底に沈んだ。"
    },
    "m6Success": {
        "zhHK": "以色列人完全得救了！上帝好有能力！",
        "zhCN": "以色列人完全得救了！上帝好有能力！",
        "en": "The Israelites were completely saved! God is so powerful!",
        "ja": "イスラエル人は完全に救出された！神様はなんて力がある！"
    },
    "summary": {
        "zhHK": "摩西帶領以色列人過紅海，係聖經入面好重要嘅神蹟。呢個故事教導我哋要信靠God，祂會喺困難嘅時候幫助我哋。",
        "zhCN": "摩西带领以色列人过红海，是圣经里面好重要的神迹。这个故事教导我们要信靠上帝，祂会在困难的时候帮助我们。",
        "en": "Moses led the Israelites through the Red Sea. This is an important miracle in the Bible. This story teaches us to trust God, who helps us in times of trouble.",
        "ja": "モーセがイスラエル人を率いて紅海を渡った，这是圣经里非常重要的神迹。この物語は困難なときに助けてくださる神様を信頼することを教えます。"
    }
}

# 耶穌降生音頻
JESUS_AUDIO = {
    "j1Narr": {
        "zhHK": "天使加百列去見馬利亞，話佢將會生一個好特別嘅BB，佢既名叫耶穌。",
        "zhCN": "天使加百列去见马利亚，说她将会生一个很特别的BB，她名叫耶稣。",
        "en": "The angel Gabriel visited Mary and told her she would have a very special baby named Jesus.",
        "ja": "天使ガブリエルがマリアを访ね、特別な赤ちゃんが生まると告げました。イエスという名の。"
    },
    "j1Success": {
        "zhHK": "馬利亞接受咗上帝嘅安排，好開心！",
        "zhCN": "马利亚接受上帝的安排，好开心！",
        "en": "Mary accepted God's plan, so happy!",
        "ja": "マリアが神様の計画を受け入れた、嬉しい！"
    },
    "j2Narr": {
        "zhHK": "馬利亞去探訪伊利沙伯，佢表姐已經年紀大但係都陀住BB，原來佢肚裏面嘅係施洗約翰！",
        "zhCN": "马利亚去探访伊利沙伯，她表姐已经年纪大但是都怀着BB，原来她肚子里面的是施洗约翰！",
        "en": "Mary visited Elizabeth, who was old but pregnant with John the Baptist!",
        "ja": "マリアがエリサベスを訪問、エリサベスは年を重ねていたが赤ちゃんをみごもっていた！その子は洗脳ヨハネだった！"
    },
    "j2Success": {
        "zhHK": "兩個媽媽都好開心，BB喺肚裏面跳下跳下！",
        "zhCN": "两个妈妈都好开心，BB在肚子里面跳下跳下！",
        "en": "Both mothers were so happy, the babies jumped in their tummies!",
        "ja": "二人の母が嬉しい、赤ちゃが腹の中で躍り跳ねている！"
    },
    "j3Narr": {
        "zhHK": "約瑟發夢，夢到有天使話俾佢知，馬利亞既BB係從聖靈嚟嘅，唔使擔心。",
        "zhCN": "约瑟发梦，梦到有天使告诉他，马利亚的BB是从圣灵来的，不用担心。",
        "en": "Joseph had a dream. An angel told him Mary's baby was from the Holy Spirit, don't worry.",
        "ja": "ヨセフが夢を見た。天使がマリアの赤ちゃんは聖霊から来的と告げた。大丈夫。"
    },
    "j3Success": {
        "zhHK": "約瑟醒咗，佢知道要好好照顧馬利亞同耶穌。",
        "zhCN": "约瑟醒了，他要知道要好好照顾马利亚和耶稣。",
        "en": "Joseph woke up, he knew he needed to take care of Mary and Jesus.",
        "ja": "ヨセフが目を覚ました、耶穌とマリアを惫いしなければならないことがわかった。"
    },
    "j4Narr": {
        "zhHK": "羅馬皇帝叫所有人回鄉，約瑟帶住馬利亞騎驢仔去伯利恆，路途好遠。",
        "zhCN": "罗马皇帝叫所有人回乡，约瑟带着马利亚骑驴仔去伯利恒，路途好远。",
        "en": "The Roman Emperor ordered everyone to return to their hometown. Joseph took Mary riding a donkey to Bethlehem, a long journey.",
        "ja": "ローマ皇帝が皆に故郷に戻るよう命じた。ヨセフがマリアを連れてロバでベルヘレムへ、道のり遠い。"
    },
    "j4Success": {
        "zhHK": "終於到咗伯利恆！準備迎接BB既嚟到。",
        "zhCN": "终于到了伯利恒！准备迎接BB的来到。",
        "en": "Finally arrived at Bethlehem! Ready to welcome the baby.",
        "ja": "やっとベルヘレムに着いた！赤ちゃんを迎える準備ができた。"
    },
    "j5Narr": {
        "zhHK": "伯利恆冇酒店，馬利亞喺馬棚裏面生咗BB，佢將耶穌放喺馬槽裏面。",
        "zhCN": "伯利恒没有酒店，马利亚在马棚里面生了BB，她将耶稣放在马槽里面。",
        "en": "There was no room at the inn in Bethlehem. Mary gave birth to baby Jesus and placed him in a manger.",
        "ja": "ベルヘレムに宿がなかった。マリアが馬小屋で赤ちゃんを生み、飼葉桶にイエスを置いた。"
    },
    "j5Success": {
        "zhHK": "耶穌降生了！天使喺天上唱歌，歡迎呢個世界嘅救主！",
        "zhCN": "耶稣降生了！天使在天上唱歌，欢迎这个世界的救主！",
        "en": "Jesus was born! Angels sang in heaven, welcoming the Savior of the world!",
        "ja": "イエスが生まれた！天使が天で歌い、この世の救い主を迎えている！"
    },
    "j6Narr": {
        "zhHK": "天使喺伯利恆郊外向牧羊人報信，話救主耶穌已經降生，牧羊人就去搵耶穌。",
        "zhCN": "天使在伯利恒郊外向牧羊人报信，说救主耶稣已经降生，牧羊人就去找耶稣。",
        "en": "Angels told the shepherds in the fields that Savior Jesus was born. They went to find Jesus.",
        "ja": "天使がベルヘレムの野で羊飼いたちに救い主イエスが生まれたと告げた。羊飼いたちがイエスを探しに出けた。"
    },
    "j6Success": {
        "zhHK": "牧羊人見到耶穌，好開心！佢哋將好消息告訴所有人。",
        "zhCN": "牧羊人见到耶稣，好开心！他们将好消息告诉所有人。",
        "en": "The shepherds saw Jesus, so happy! They told everyone the good news.",
        "ja": "羊飼いたちが耶穌に会って、嬉しい！良い知らせを皆に告げた。"
    },
    "j7Narr": {
        "zhHK": "東方有博士觀星，見到一顆好特別既星，就跟住佢搵到耶穌，送俾佢黃金、乳香、沒藥。",
        "zhCN": "东方有博士观星，见到一颗很特别的星，就跟着它找到耶稣，送给他黄金、乳香、没药。",
        "en": "Wise men from the East saw a special star, followed it and found Jesus, giving him gold, frankincense and myrrh.",
        "ja": "東方の学者が星を觀測，特别な星を見て、それに従って耶穌を探し、金、、乳香、没薬を進呈した。"
    },
    "j7Success": {
        "zhHK": "博士見到耶穌，俯伏拜佢，奉上寶貴既禮物！",
        "zhCN": "博士见到耶稣，俯伏拜他，奉上宝贵的礼物！",
        "en": "The wise men saw Jesus, knelt down to worship him and offered precious gifts!",
        "ja": "学者が耶穌に会って、伏せて拜み、尊い礼物を捧げた！"
    },
    "summary": {
        "zhHK": "耶穌降生係一個好特別既故事。天使報喜訊，牧羊人同博士都來朝拜。耶穌係上帝既兒子，嚟到世界帶嚟我哋愛同希望。",
        "zhCN": "耶稣降生是一个好特别的故事。天使报喜讯，牧羊人和博士都来朝拜。耶稣是上帝的儿子，来到世界带给我们爱和希望。",
        "en": "The birth of Jesus is a very special story. Angels brought good news, shepherds and wise men came to worship. Jesus is God's Son, who came to bring us love and hope.",
        "ja": "耶穌の降中はとても不思議な物語。天使が良い知らせを伝え、羊飼いたちや学者が礼拝に来た。耶穌は神様の子であり、愛と希望を带来するためにこの世に来た。"
    }
}

# ============ 音頻生成函數 ============

def generate_audio(text, voice_id, lang, output_path):
    """生成單個音頻"""
    speed = SPEEDS.get(lang, 0.85)
    
    payload = {
        "model": "speech-2.8-hd",
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": speed
        },
        "output_format": "url"
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data.get("data", {}).get("audio"):
            audio_url = data["data"]["audio"]
            # 下載音頻
            audio_response = requests.get(audio_url, timeout=60)
            audio_response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                f.write(audio_response.content)
            
            return True, f"Generated: {output_path}"
        else:
            return False, f"API Error: {data}"
            
    except Exception as e:
        return False, f"Error: {str(e)}"

def generate_story_audio(story, lang, dry_run=False):
    """為指定故事和語言生成所有音頻"""
    voice_id = VOICE_IDS.get(lang)
    if not voice_id:
        return False, f"Unknown language: {lang}"
    
    # 選擇音頻內容
    audio_dict = {
        "creation": CREATION_AUDIO,
        "noah": NOAH_AUDIO,
        "moses": MOSES_AUDIO,
        "jesus": JESUS_AUDIO
    }.get(story.lower())
    
    if not audio_dict:
        return False, f"Unknown story: {story}"
    
    # 創建輸出目錄
    base_dir = Path(f"/Users/zachli/.openclaw/workspace/preschool/audio/{story}")
    if not dry_run:
        base_dir.mkdir(parents=True, exist_ok=True)
    
    results = []
    success_count = 0
    
    for key, texts in audio_dict.items():
        text = texts.get(lang)
        if not text:
            continue
        
        # 構建輸出檔案名
        filename = f"{key}_{lang}.mp3"
        output_path = base_dir / filename
        
        if dry_run:
            results.append(f"[DRY RUN] Would generate: {output_path}")
            results.append(f"  Text: {text[:50]}...")
            success_count += 1
        else:
            success, msg = generate_audio(text, voice_id, lang, str(output_path))
            results.append(msg)
            if success:
                success_count += 1
        
        # 避免 API 限制
        if not dry_run:
            time.sleep(0.5)
    
    return True, f"\n".join(results), success_count

def main():
    parser = argparse.ArgumentParser(description="MiniMax TTS 音頻生成")
    parser.add_argument("--story", "-s", required=True, help="故事名: creation, noah, moses, jesus, all")
    parser.add_argument("--lang", "-l", required=True, help="語言: zhHK, zhCN, en, ja, all")
    parser.add_argument("--dry-run", action="store_true", help="只顯示不做生成")
    
    args = parser.parse_args()
    
    stories = ["creation", "noah", "moses", "jesus"] if args.story == "all" else [args.story]
    langs = ["zhHK", "zhCN", "en", "ja"] if args.lang == "all" else [args.lang]
    
    total_success = 0
    
    for story in stories:
        for lang in langs:
            print(f"\n{'='*50}")
            print(f"Generating {story} audio for {lang}...")
            print(f"{'='*50}")
            
            success, msg, count = generate_story_audio(story, lang, args.dry_run)
            print(msg)
            total_success += count
    
    print(f"\n{'='*50}")
    print(f"Total: {total_success} audio files")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
