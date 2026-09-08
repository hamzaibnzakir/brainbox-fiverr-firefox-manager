from pathlib import Path
from PIL import Image, ImageDraw

out = Path("src-tauri/icons")
out.mkdir(parents=True, exist_ok=True)

size = 256
img = Image.new("RGBA", (size, size), (18, 10, 30, 255))
d = ImageDraw.Draw(img)

# Rounded Brainbox style mark
pad = 28
d.rounded_rectangle((pad, pad, size-pad, size-pad), radius=52, fill=(38, 20, 62, 255))

# Stylized B
stroke = 28
x0, y0, x1, y1 = 76, 60, 180, 196
d.rounded_rectangle((x0, y0, x0+stroke, y1), radius=10, fill=(226, 210, 255, 255))
d.rounded_rectangle((x0+stroke-2, y0, x1, y0+stroke), radius=12, fill=(226, 210, 255, 255))
d.rounded_rectangle((x0+stroke-2, (y0+y1)//2-stroke//2, x1-10, (y0+y1)//2+stroke//2), radius=12, fill=(226, 210, 255, 255))
d.rounded_rectangle((x0+stroke-2, y1-stroke, x1, y1), radius=12, fill=(226, 210, 255, 255))
d.rounded_rectangle((x1-stroke, y0+8, x1+8, (y0+y1)//2-stroke//2+6), radius=10, fill=(226, 210, 255, 255))
d.rounded_rectangle((x1-stroke, (y0+y1)//2+stroke//2-6, x1+8, y1-8), radius=10, fill=(226, 210, 255, 255))

img.save(out / "icon.ico", format="ICO", sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)])
print(f"Generated {out / 'icon.ico'}")
