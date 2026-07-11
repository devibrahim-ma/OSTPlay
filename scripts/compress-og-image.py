import os
from PIL import Image

def compress_image():
    src_path = r"d:\Escritorio\proyectos personales\OSTPlay\src\assets\fondo.png"
    dest_dir = r"d:\Escritorio\proyectos personales\OSTPlay\public\fondo_comprimido"
    dest_path = os.path.join(dest_dir, "seo_preview.jpg")

    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)

    print(f"Loading original background from {src_path}...")
    with Image.open(src_path) as img:
        # Resize to standard Open Graph dimensions (1200x630) using Lanczos resampling
        print("Resizing to 1200x630...")
        img_resized = img.resize((1200, 630), Image.Resampling.LANCZOS)
        
        # Convert to RGB (required for saving as JPEG if source has transparency)
        if img_resized.mode in ("RGBA", "P"):
            img_rgb = img_resized.convert("RGB")
        else:
            img_rgb = img_resized

        print(f"Saving compressed JPEG to {dest_path}...")
        # Save as JPEG with quality 85 and optimization enabled
        img_rgb.save(dest_path, "JPEG", quality=85, optimize=True)
        
        file_size = os.path.getsize(dest_path) / 1024
        print(f"Successfully saved. Compressed file size: {file_size:.2f} KB")

if __name__ == "__main__":
    compress_image()
