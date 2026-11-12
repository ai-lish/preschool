#!/usr/bin/env python3
"""
補齊 Alphabet Park 缺少的字母素材（角色圖 + 字母歌）。

用法：
  export MINIMAX_API_KEY=...
  python3 generate_alphabet_assets.py --images          # 只生成缺的圖
  python3 generate_alphabet_assets.py --images --only C,D,E
  python3 generate_alphabet_assets.py --songs --only C  # 生成字母歌（較慢、較貴）
  python3 generate_alphabet_assets.py --images --dry-run

已存在的檔案預設跳過（--force 可覆蓋）。生成後自動壓成 web 尺寸。
"""
import argparse, pathlib, sys, subprocess
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from minimax_client import text_to_image, music_generation

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHARS = ROOT / "alphabet" / "characters"

# 美術風格：兩層設計
#   硬鎖 = 26 張全部一樣，負責視覺一致性
#   軟性 = 場景由 SUBJECTS 決定，不強制統一地點
# 繪本的一致性來自色盤／光向／畫風／構圖／前景框，不是「每張都在森林」。
# 硬套森林會讓 Heaven（雲）、Universe（星空）、David（山丘）的內容都跟著錯。
STYLE_CHARACTER = (
    "Children's Bible picture book illustration, cute cartoon style for preschool kids. "
    "{subject} "
    # ── 硬鎖 ──
    "Warm golden light from the upper left, soft pastel color palette. "
    "Cute cartoon style, big sparkling eyes, rounded friendly shapes. "
    "Single subject centered, full body, mid-distance framing. "
    # 關鍵：主體抽象或是死物時，image-01 會自作主張塞一隻可愛動物當主角
    # （R→獅子、S→貓、G→小孩）。對 phonics 卡是致命的——卡面寫 R is for
    # Rainbow，小孩看到的主角卻是獅子。這條規則把單字的所指鎖死為視覺主體。
    "The subject named in the prompt must be the single visually dominant hero "
    "of the image, largest and centered. Animals or people may appear only as "
    "small background companions, never as the main subject unless explicitly named. "
    "Foreground framed by pink and orange flowers and green foliage. "
    "Soft digital painting, gentle and joyful mood. "
    "Clean artwork, no text, no letters, no watermark, no stray marks or specks."
)

# 風景／抽象主體專用 template。
# 實測結論：對 G(God)、Z(Zion) 這種沒有實體主角的字母，光靠 negative prompt
# 擋不住——STYLE_CHARACTER 裡「cute cartoon / big sparkling eyes /
# rounded friendly shapes / single visually dominant hero」四個提示一起推，
# 模型一定要生一個可愛主角，配上 golden+warm 就固定 fallback 成 lion cub。
# G/Z 各試三次都一樣。解法不是加禁令，是整段 hero 概念不要讓它看到。
STYLE_SCENERY = (
    "Children's Bible picture book illustration for preschool kids, "
    "wide scenic landscape painting. "
    "{subject} "
    "Warm golden light from the upper left, soft pastel color palette. "
    "Empty landscape with no characters, no people, no animals, no creatures "
    "anywhere in the scene. "
    "Foreground framed by pink and orange flowers and green foliage. "
    "Soft digital painting, gentle and joyful mood. "
    "Clean artwork, no text, no letters, no watermark, no stray marks."
)

# 用 STYLE_SCENERY 的字母
SCENERY = {"G", "Z"}


# image-01 的行為規律（實測 26 張 × 3 輪歸納）：
#   subject 越抽象，模型越想塞一隻可愛動物進來當「視覺錨點」。
#   具體主體（彩虹、星星、人物）靠上面那條 hero 規則就壓得住；
#   抽象主體（光、城市剪影）必須在 SUBJECT 裡明寫
#   "Absolutely no people, no animals, no creatures" 才擋得掉。
SUBJECTS = {
    "A": ("Adam", "A cheerful little boy Adam with curly brown hair, standing barefoot in a sunlit forest garden."),
    "B": ("Bible", "A cute smiling child holding a big open golden-edged Bible, glowing warm light from the pages."),
    "C": ("Creation", "A small adorable planet Earth with green continents and blue oceans floating in a golden sky, a smiling sun, fluffy clouds, tiny stars and cute baby animals peeking in."),
    "D": ("David", "A cheerful little shepherd boy David with curly brown hair, a simple tan tunic and a small sling, on a sunny green hillside with fluffy white sheep."),
    "E": ("Eden", "A lush magical garden with a friendly apple tree, a gentle stream, butterflies and cute rabbits and deer resting on soft grass."),
    "F": ("Fish", "Two cute smiling fish and five little round loaves of bread in a woven basket, on a sunny lakeshore."),
    "G": ("God", "A vast radiant sunburst of warm golden light breaking through soft clouds over an empty green valley. Absolutely no people, no animals, no creatures of any kind - only light, clouds and landscape."),
    # 注意：主體一律用單數。寫複數（"angels"）image-01 會畫一群，
    # 違反「single subject centered」，整組風格就散掉。
    "H": ("Heaven", "A single cute angel with small wings and a glowing halo, floating on soft pastel clouds beside golden gates in a peaceful sky."),
    "I": ("Isaac", "A happy little boy Isaac laughing beside his kind father, sitting under a large green shade tree."),
    "J": ("Jesus", "A gentle kind figure of Jesus with a warm smile, sitting on grass surrounded by cheerful little children and small lambs."),
    "K": ("King", "A cute young king with a shiny golden crown and a red velvet robe, sitting on a small friendly throne."),
    "L": ("Lamb", "A very fluffy adorable white baby lamb with big sparkling eyes, standing in a sunny meadow of wildflowers."),
    "M": ("Moses", "A kind cartoon Moses with a white beard holding a wooden staff, standing before parted blue sea walls with a dry path."),
    "N": ("Noah", "A cute wooden ark boat with a friendly Noah waving, pairs of cheerful cartoon animals on deck, a rainbow above."),
    "O": ("Olive", "A gentle white dove carrying a green olive branch, flying over calm blue water toward a wooden ark, warm sunrise."),
    "P": ("Prayer", "A sweet little child kneeling with hands folded in prayer beside a window with warm golden light streaming in."),
    "Q": ("Queen", "A kind cartoon queen with a jewelled crown and flowing robe, carrying gift baskets of spices and gold."),
    "R": ("Rainbow", "An enormous vivid rainbow arcing across the whole sky as the main subject, over a green hillside."),
    "S": ("Star", "One huge glowing golden star dominating the night sky as the main subject, shining down on a small stable below."),
    "T": ("Temple", "A beautiful golden stone temple with tall pillars and steps, warm sunlight, small palm trees and doves."),
    "U": ("Universe", "A cosy pastel galaxy with cute smiling planets, swirling stars, a crescent moon and sparkling comets."),
    "V": ("Vine", "A lush green grapevine heavy with purple grapes, curling tendrils and leaves, warm sunlight through the arbour."),
    "W": ("Water", "A clear sparkling spring of water flowing from a rock into a small pool, cute cupped hands catching it, green plants around."),
    "X": ("foX", "A cute little orange fox with a fluffy tail and big eyes, peeking playfully out of a green vineyard."),
    "Y": ("Youth", "A brave cheerful young boy standing tall on a hilltop at sunrise, small sling in hand, hopeful expression."),
    "Z": ("Zion", "A golden city of towers and terraces on a high mountain at sunrise, filling the frame. Absolutely no people, no animals, no creatures in the foreground - only the city, the mountain and the sky."),
}

# 字母歌歌詞（英文、短、可跟唱）
def lyrics_for(letter: str, word: str, phrase: str) -> str:
    return (
        f"[Verse]\n{letter} is for {word}, {letter} is for {word}\n"
        f"{phrase}\n"
        f"[Chorus]\nSing it with me, {letter}, {letter}, {letter}\n"
        f"{letter} is for {word}, thank you God\n"
        f"[Outro]\n{letter} is for {word}"
    )

PHRASES = {
    "C": "God made the whole wide world", "D": "A boy who loved God so",
    "E": "A garden green and bright", "F": "Jesus fed five thousand friends",
    "G": "God loves you so much", "H": "God's beautiful home above",
    "I": "Abraham's beloved son", "J": "God's own Son who loves us",
    "K": "David was a mighty king", "L": "Jesus is the Lamb of God",
    "M": "Moses led God's people home", "N": "Noah built a giant boat",
    "O": "The dove brought an olive branch", "P": "We talk to God each day",
    "Q": "The queen was very wise", "R": "God's promise in the sky",
    "S": "The star led wise men on", "T": "God's own special house",
    "U": "God made everything there is", "V": "Jesus said I am the vine",
    "W": "Jesus gives us living water", "X": "Little foxes in the vine",
    "Y": "Young David was so brave", "Z": "Zion is God's holy hill",
}

MUSIC_PROMPT = ("Cheerful children's nursery rhyme, simple ukulele and glockenspiel, "
                "gentle sweet child-friendly female vocal, slow tempo, warm and playful, "
                "singable by 3-6 year olds")


def optimise(path: pathlib.Path, max_px: int = 768) -> None:
    """縮到 web 尺寸並壓縮（需 Pillow；沒有就跳過）。"""
    try:
        from PIL import Image
    except ImportError:
        print("    (未安裝 Pillow，跳過壓縮：pip install Pillow)")
        return
    im = Image.open(path).convert("RGB")
    if max(im.size) > max_px:
        im.thumbnail((max_px, max_px), Image.LANCZOS)
    webp = path.with_suffix(".webp")
    im.save(webp, "WEBP", quality=82, method=6)
    im.save(path, "PNG", optimize=True)
    print(f"    → {path.name} {path.stat().st_size//1024}KB / {webp.name} {webp.stat().st_size//1024}KB")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", action="store_true")
    ap.add_argument("--songs", action="store_true")
    ap.add_argument("--only", help="逗號分隔字母，例：C,D,E")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not (a.images or a.songs):
        ap.error("請指定 --images 或 --songs")

    letters = [c.strip().upper() for c in a.only.split(",")] if a.only else list(SUBJECTS)

    for L in letters:
        word, subject = SUBJECTS[L]
        if a.images:
            dest = CHARS / f"{L.lower()}-{word.lower()}.png"
            if dest.exists() and not a.force:
                print(f"[skip] {dest.name}")
            else:
                tmpl = STYLE_SCENERY if L in SCENERY else STYLE_CHARACTER
                prompt = tmpl.format(subject=subject)
                print(f"[img ] {L} → {dest.name}")
                if a.dry_run:
                    print(f"    {prompt[:110]}…")
                else:
                    text_to_image(prompt, dest)
                    optimise(dest)

        if a.songs and L in PHRASES:
            dest = ROOT / "alphabet" / "songs" / f"{L.lower()}-song.mp3"
            if dest.exists() and not a.force:
                print(f"[skip] {dest.name}")
            else:
                print(f"[song] {L} → {dest.name}")
                if not a.dry_run:
                    music_generation(MUSIC_PROMPT, lyrics_for(L, word, PHRASES[L]), dest)
                    print(f"    → {dest.stat().st_size//1024}KB")


if __name__ == "__main__":
    main()
