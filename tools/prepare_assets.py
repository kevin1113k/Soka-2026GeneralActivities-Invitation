"""把生成/下載的圖片裁切成 asset_manifest 規格並放進 assets/。

用法：
  python tools/prepare_assets.py <來源圖> <目標檔名>
  python tools/prepare_assets.py --latest <目標檔名>     # 取 Downloads 最新一張圖

例：python tools/prepare_assets.py --latest scene_01_meeting.webp
需要 Pillow（pip install pillow）。
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

# 目標檔名 -> (寬, 高, 是否保留透明)；None 表示保留原比例只限制長邊
SPECS = {
    "envelope_base.webp": (1260, 888, False),
    "envelope_flap.png": (1260, 528, True),
    "wax_seal.png": (512, 512, True),
    "letter_inner.webp": (1080, 1920, False),
    "scene_01_meeting.webp": (1080, 1920, False),
    "scene_02_working.webp": (1080, 1920, False),
    "scene_03_legacy.webp": (1080, 1920, False),
    "scene_04_outreach.webp": (1080, 1920, False),
    "scene_05_future.webp": (1080, 1920, False),
    "number_100.png": (1200, 1200, True),
    "light_rays.png": (1080, 1920, True),
    "petals.png": None,
    "bg_sky.webp": (1080, 1920, False),
    "bg_sunrise.webp": (1080, 1920, False),
    "bg_paper.webp": (512, 512, False),
}


def cover(img, w, h):
    """等比放大後置中裁切（同 CSS background-size: cover）。"""
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def latest_download():
    dl = Path.home() / "Downloads"
    files = [p for p in dl.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}]
    if not files:
        sys.exit("Downloads 裡找不到圖片")
    return max(files, key=lambda p: p.stat().st_mtime)


def main():
    args = sys.argv[1:]
    if len(args) != 2:
        sys.exit(__doc__)
    src = latest_download() if args[0] == "--latest" else Path(args[0])
    name = args[1]
    if name not in SPECS:
        sys.exit(f"未知的目標檔名：{name}\n可用：{', '.join(SPECS)}")
    img = Image.open(src)
    spec = SPECS[name]
    alpha = spec[2] if spec else True
    img = img.convert("RGBA" if alpha else "RGB")
    if spec:
        img = cover(img, spec[0], spec[1])
    else:
        img.thumbnail((2048, 2048), Image.LANCZOS)
    ASSETS.mkdir(exist_ok=True)
    out = ASSETS / name
    if out.suffix == ".webp":
        img.save(out, "WEBP", quality=86, method=6)
    else:
        img.save(out, "PNG", optimize=True)
    print(f"{src.name} -> assets/{name}  {img.width}x{img.height}")


if __name__ == "__main__":
    main()
