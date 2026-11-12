"""把 assets/CreatImage/ 內 ChatGPT 生成的圖，整理成 asset_manifest 規格檔名放進 assets/。

- 一般圖：等比 cover 裁切到規格尺寸
- 封蠟：去除「假透明」棋盤格背景
- 信封底部：把與邊緣相連的白底（含中央開口）挖成透明
用法：python tools/import_generated.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "CreatImage"
DST = ROOT / "assets"

# 來源檔名 -> (目標檔名, 寬, 高, 處理方式)
MAP = {
    "和室書房的溫暖對談.png":       ("scene_01_meeting.webp", 1080, 1920, "cover"),
    "夜灯下的书房共事時光.png":     ("scene_02_working.webp", 1080, 1920, "cover"),
    "陽光下的講堂演說.png":         ("scene_03_legacy.webp", 1080, 1920, "cover"),
    "陽光下的多元文化歡聚節慶.png": ("scene_04_outreach.webp", 1080, 1920, "cover"),
    "晨曦花路上的希望同行.png":     ("scene_05_future.webp", 1080, 1920, "cover"),
    "晨曦下的希望之城.png":         ("scene_05_future_alt.webp", 1080, 1920, "cover"),
    "金色光輝的開啟信封.png":       ("letter_inner.webp", 1080, 1920, "cover"),
    "奶油金邊信封上蓋.png":         ("envelope_flap.png", 1260, 528, "cover_alpha"),
    "象牙金邊質感開口信封.png":     ("envelope_base.webp", 1260, 888, "envelope_base"),
    "深紅金箔花結蠟封.png":         ("wax_seal.png", 512, 512, "seal"),
    "閃耀金色百字徽章.png":         ("number_100.png", 1200, 1200, "contain_alpha"),
    "金色放射光暈透明疊圖.png":     ("light_rays.png", 1080, 1920, "cover_alpha"),
    "水彩櫻花花瓣與綠葉素材.png":   ("petals.png", 1024, 1536, "cover_alpha"),
    "水彩柔彩晨曦雲海.png":         ("bg_sky.webp", 1080, 1920, "cover"),
    "夢幻水彩晨曦天空.png":         ("bg_sunrise.webp", 1080, 1920, "cover"),
    "奶油白手工紙張紋理背景.png":   ("bg_paper.webp", 512, 512, "cover"),
}


def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))


def contain(img, w, h):
    img = img.copy()
    img.thumbnail((w, h), Image.LANCZOS)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(img, ((w - img.width) // 2, (h - img.height) // 2), img)
    return out


def border_connected(mask):
    """回傳 mask 中與影像邊緣相連的區塊。"""
    lab, _ = ndimage.label(mask)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    edge = edge[edge > 0]
    return np.isin(lab, edge)


def remove_fake_checker(img):
    """封蠟：低飽和、偏亮的棋盤格背景 → 透明。"""
    a = np.asarray(img.convert("RGB")).astype(int)
    mx, mn = a.max(2), a.min(2)
    bgish = (mx - mn < 22) & (mn > 185)
    bg = border_connected(bgish)
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def envelope_base(img, w, h):
    """信封底部：與邊緣相連的純白挖空；中央開口（上緣中間）一併挖空。"""
    img = cover(img.convert("RGB"), w, h)
    a = np.asarray(img).astype(int)
    white = (a.min(2) > 238) & (a.max(2) - a.min(2) < 14)
    bg = border_connected(white)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    return out


def main():
    for src_name, (dst, w, h, mode) in MAP.items():
        src = SRC / src_name
        if not src.exists():
            print("缺檔：", src_name)
            continue
        img = Image.open(src)
        if mode == "cover":
            out = cover(img.convert("RGB"), w, h)
        elif mode == "cover_alpha":
            out = cover(img.convert("RGBA"), w, h)
        elif mode == "contain_alpha":
            out = contain(img.convert("RGBA"), w, h)
        elif mode == "seal":
            out = contain(remove_fake_checker(img), w, h)
        elif mode == "envelope_base":
            out = envelope_base(img, w, h)
        path = DST / dst
        if path.suffix == ".webp":
            out.save(path, "WEBP", quality=86, method=6)  # RGBA 會保留透明
        else:
            if dst == "light_rays.png":          # 柔光本身模糊，降解析不影響畫質
                out = out.resize((720, 1280), Image.LANCZOS)
            if dst in {"light_rays.png", "petals.png", "envelope_flap.png"}:
                out = out.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
            out.save(path, "PNG", optimize=True)
        print(f"{src_name} -> {dst} {out.size} {out.mode} {path.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
