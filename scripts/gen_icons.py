# /// script
# dependencies = ["pillow"]
# ///
"""从 public/images.png 生成圆形图标（favicon / android-chrome / apple-touch / mstile）。"""
from PIL import Image, ImageDraw
from pathlib import Path

PUB = Path(__file__).resolve().parent.parent / "public"
SRC = PUB / "images.png"
SS = 8  # 超采样倍数，抗锯齿


def make_circle(src: Image.Image) -> Image.Image:
    """居中裁成正方形并做圆形遮罩（高分辨率，带 alpha）。"""
    w, h = src.size
    s = min(w, h)
    img = src.convert("RGBA").crop(
        ((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)
    )
    mask = Image.new("L", (s * SS, s * SS), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s * SS - 1, s * SS - 1), fill=255)
    mask = mask.resize((s, s), Image.LANCZOS)
    img.putalpha(mask)
    return img


def save(img: Image.Image, name: str, size, pad_ratio=1.0, bg=None):
    """把圆形图缩放进 size 画布，pad_ratio 控制内容占比。"""
    W, H = (size, size) if isinstance(size, int) else size
    canvas = Image.new("RGBA", (W, H), bg or (0, 0, 0, 0))
    d = int(min(W, H) * pad_ratio)
    icon = img.resize((d, d), Image.LANCZOS)
    canvas.alpha_composite(icon, ((W - d) // 2, (H - d) // 2))
    canvas.save(PUB / name)
    print("写入", name, canvas.size)


def main():
    circle = make_circle(Image.open(SRC))
    (PUB / "images-circle.png").write_bytes(b"")
    circle.save(PUB / "images-circle.png")

    # 常规图标：铺满
    save(circle, "favicon-16x16.png", 16)
    save(circle, "favicon-32x32.png", 32)
    save(circle, "android-chrome-192x192.png", 192)
    save(circle, "android-chrome-512x512.png", 512)
    # apple-touch-icon 不支持透明，用图片主色做底
    save(circle, "apple-touch-icon.png", 180, bg=(218, 218, 218, 255))

    # Windows 磁贴：透明底 + 内边距（微软规范约 70~80%）
    for name, sz, ratio in [
        ("mstile-70x70.png", 70, 0.72),
        ("mstile-144x144.png", 144, 0.72),
        ("mstile-150x150.png", 150, 0.72),
        ("mstile-310x310.png", 310, 0.62),
        ("mstile-310x150.png", (310, 150), 0.72),
    ]:
        save(circle, name, sz, ratio)

    # favicon.ico 多尺寸
    ico = circle.resize((256, 256), Image.LANCZOS)
    ico.save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("写入 favicon.ico")


if __name__ == "__main__":
    main()
