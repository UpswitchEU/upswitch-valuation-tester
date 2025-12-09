#!/usr/bin/env python3
"""
Convert SVG to ICO format for favicon
"""
import sys
import io
from pathlib import Path

try:
    from PIL import Image
    import cairosvg
except ImportError:
    print("Required packages not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "cairosvg", "--quiet"])
    from PIL import Image
    import cairosvg

def svg_to_ico(svg_path, ico_path, sizes=[16, 32, 48]):
    """Convert SVG to ICO format with multiple sizes"""
    # Convert SVG to PNG first (using largest size)
    max_size = max(sizes)
    png_data = cairosvg.svg2png(url=str(svg_path), output_width=max_size, output_height=max_size)
    
    # Create PIL Image from PNG data
    img = Image.open(io.BytesIO(png_data))
    
    # Create ICO with multiple sizes
    images = []
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        images.append(resized)
    
    # Save as ICO
    images[0].save(ico_path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f"Successfully converted {svg_path} to {ico_path}")

if __name__ == "__main__":
    svg_file = Path("public/favicon-2.svg")
    ico_file = Path("public/favicon.ico")
    
    if not svg_file.exists():
        print(f"Error: {svg_file} not found")
        sys.exit(1)
    
    svg_to_ico(svg_file, ico_file)
    print("Conversion complete!")
