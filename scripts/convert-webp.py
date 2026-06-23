"""
Convert all product images from JPG/PNG to WebP format.
Reads files from container via tar pipe, converts with Pillow, writes back.
Then updates DB to replace .jpg/.png → .webp.
"""
import subprocess, sys, io, time

CONTAINER = "smart-commerceops-catalog-service-1"
UPLOAD_DIR = "/app/uploads/images/products"
MYSQL_CMD = [
    "docker", "exec", "-i", "smart-commerceops-mysql-1",
    "mysql", "-uroot", "-pcommerceops", "catalog_db",
    "--default-character-set=utf8mb4"
]

def list_images():
    """List all jpg/png files in the container uploads dir."""
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "sh", "-c",
         f"ls {UPLOAD_DIR}/*.jpg {UPLOAD_DIR}/*.png 2>/dev/null"],
        capture_output=True, text=True, timeout=30
    )
    files = [f.strip() for f in r.stdout.strip().split('\n') if f.strip()]
    return files

def read_file(container_path):
    """Read a file from the container via cat."""
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "cat", container_path],
        capture_output=True, timeout=15
    )
    if r.returncode != 0:
        return None
    return r.stdout

def write_file(container_path, data):
    """Write data to a file in the container via stdin pipe."""
    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "sh", "-c", f"cat > {container_path}"],
        input=data, capture_output=True, timeout=15
    )
    return r.returncode == 0

def delete_file(container_path):
    subprocess.run(
        ["docker", "exec", CONTAINER, "rm", "-f", container_path],
        capture_output=True, timeout=10
    )

def convert_to_webp(image_data):
    """Convert JPEG/PNG bytes to WebP bytes using Pillow."""
    from PIL import Image
    img = Image.open(io.BytesIO(image_data))
    out = io.BytesIO()
    # Convert RGBA to RGB if needed (WebP doesn't support alpha well in lossless)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGBA')
    img.save(out, format='WEBP', quality=82)
    return out.getvalue()

def update_db():
    """Replace .jpg and .png extensions with .webp in all image_url fields."""
    sql_jpg = "UPDATE products SET image_url = REPLACE(image_url, '.jpg', '.webp') WHERE image_url LIKE '%.jpg%';"
    sql_png = "UPDATE products SET image_url = REPLACE(image_url, '.png', '.webp') WHERE image_url LIKE '%.png%';"
    subprocess.run(MYSQL_CMD, input=sql_jpg.encode(), capture_output=True, timeout=30)
    subprocess.run(MYSQL_CMD, input=sql_png.encode(), capture_output=True, timeout=30)

def main():
    print("Listing images...")
    files = list_images()
    jpg_count = sum(1 for f in files if f.endswith('.jpg'))
    png_count = sum(1 for f in files if f.endswith('.png'))
    print(f"Found {len(files)} images ({jpg_count} JPG, {png_count} PNG)")

    from PIL import Image
    ok, fail, skipped = 0, 0, 0
    total_orig = 0
    total_webp = 0

    for i, fpath in enumerate(files):
        fname = fpath.split('/')[-1]
        print(f"[{i+1}/{len(files)}] {fname}...", end=' ', flush=True)

        # Read original
        orig_data = read_file(fpath)
        if not orig_data:
            print("READ FAIL")
            fail += 1
            continue

        total_orig += len(orig_data)

        try:
            webp_data = convert_to_webp(orig_data)
        except Exception as e:
            print(f"CONVERT FAIL: {e}")
            fail += 1
            continue

        total_webp += len(webp_data)

        # Write WebP file
        webp_path = fpath.rsplit('.', 1)[0] + '.webp'
        if not write_file(webp_path, webp_data):
            print("WRITE FAIL")
            fail += 1
            continue

        # Delete original
        delete_file(fpath)

        ratio = len(webp_data) / len(orig_data) * 100
        print(f"OK ({ratio:.0f}%)")
        ok += 1

        if i % 100 == 0 and i > 0:
            print(f"  Progress: {i+1}/{len(files)}, {ok} OK, {fail} FAIL")

    if ok > 0:
        orig_mb = total_orig / 1024 / 1024
        webp_mb = total_webp / 1024 / 1024
        savings = (1 - total_webp / total_orig) * 100
        print(f"\nConversion done: {ok} OK, {fail} FAIL")
        print(f"Before: {orig_mb:.1f}MB → After: {webp_mb:.1f}MB (saved {savings:.0f}%)")

        print("Updating database URLs...")
        update_db()
        print("Database updated.")
    else:
        print(f"\nNo successful conversions: {ok} OK, {fail} FAIL")

if __name__ == "__main__":
    main()
