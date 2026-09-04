from pathlib import Path
import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "frontend" / "public"
SVG = PUBLIC / "favicon.svg"

sizes = {
    "apple-touch-icon.png": 180,
    "pwa-192x192.png": 192,
    "pwa-512x512.png": 512,
    "pwa-192x192-maskable.png": 192,
    "pwa-512x512-maskable.png": 512,
}

for name, size in sizes.items():
    cairosvg.svg2png(url=str(SVG), write_to=str(PUBLIC / name), output_width=size, output_height=size)

# Include common favicon resolutions in one ICO, all rasterized from the same SVG.
frames = []
for size in (64, 48, 32, 24, 16):
    png = cairosvg.svg2png(url=str(SVG), output_width=size, output_height=size)
    from io import BytesIO
    frames.append(Image.open(BytesIO(png)).convert("RGBA"))
frames[0].save(PUBLIC / "favicon.ico", format="ICO", sizes=[(im.width, im.height) for im in frames])
