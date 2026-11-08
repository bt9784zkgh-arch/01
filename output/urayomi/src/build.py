"""ことばのウラ読み：ビルド
game.src.html に questions.js を差しこみ、使っている文字だけに絞ったフォントを埋め込んで ../index.html を作る。

使い方:  python3 build.py <フォントのフォルダ>
  フォントのフォルダには次の4つ（Google Fonts / Noto, SIL OFL 1.1）を置く:
    NotoSansJP_400Regular.ttf  NotoSansJP_700Bold.ttf  NotoSansJP_900Black.ttf  NotoSerifJP_900Black.ttf
  （npm の @expo-google-fonts/noto-sans-jp と @expo-google-fonts/noto-serif-jp に入っている）
必要: pip install fonttools brotli
"""
import base64, io, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = {"sans400": "NotoSansJP_400Regular.ttf", "sans700": "NotoSansJP_700Bold.ttf",
         "sans900": "NotoSansJP_900Black.ttf", "serif900": "NotoSerifJP_900Black.ttf"}

def main(fontdir):
    html = open(os.path.join(HERE, "game.src.html"), encoding="utf8").read()
    q = open(os.path.join(HERE, "questions.js"), encoding="utf8").read()
    html = html.replace("/*@@Q@@*/", q.strip())
    # 画面に出る可能性のある文字すべて（ASCII＋本文の全文字）
    chars = set(chr(c) for c in range(0x20, 0x7F)) | set(html) | set("０１２３４５６７８９〜…―ー・「」『』（）！？、。")
    text = "".join(sorted(c for c in chars if c >= " "))
    for key, fn in FONTS.items():
        f = TTFont(os.path.join(fontdir, fn))
        opt = subset.Options(); opt.flavor = "woff2"; opt.layout_features = ["*"]; opt.name_IDs = ["*"]; opt.notdef_outline = True
        s = subset.Subsetter(opt); s.populate(text=text); s.subset(f)
        buf = io.BytesIO(); f.flavor = "woff2"; f.save(buf)
        b64 = base64.b64encode(buf.getvalue()).decode()
        html = html.replace(f"@@FONT_{key}@@", b64)
        print(f"{key}: {len(buf.getvalue())//1024} KB")
    assert "@@" not in html, "置きかえ忘れがあります"
    out = os.path.join(HERE, "..", "index.html")
    open(out, "w", encoding="utf8").write(html)
    print("->", os.path.normpath(out), f"{os.path.getsize(out)//1024} KB, {len(text)} 文字")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "fonts")
