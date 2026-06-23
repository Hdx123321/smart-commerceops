"""
Fast batch WebP conversion:
1. Copy all images from container via tar pipe
2. Extract locally
3. Convert all JPG to WebP with Pillow (local, fast)
4. Delete originals
5. Copy back via tar pipe
6. Update DB
"""
import subprocess, sys, os, io, shutil, time

CONTAINER = "smart-commerceops-catalog-service-1"
UPLOAD_DIR = "/app/uploads/images/products"
TMP_DIR = "/tmp/webp-convert"
MYSQL_CMD = [
    "docker", "exec", "-i", "smart-commerceops-mysql-1",
    "mysql", "-uroot", "-pcommerceops", "catalog_db",
    "--default-character-set=utf8mb4"
]

def main():
    # Clean up any previous run
    if os.path.exists(TMP_DIR):
        shutil.rmtree(TMP_DIR)
    os.makedirs(TMP_DIR, exist_ok=True)

    # Step 1: Export from container via tar pipe
    print("Exporting images from container...")
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "tar", "-cf", "-", "-C", "/app/uploads/images", "products"],
        capture_output=True, timeout=120
    )
    if r.returncode != 0:
        print(f"Export failed: {r.stderr.decode()}")
        sys.exit(1)
    print(f"  Got {len(r.stdout)} bytes (tar)")

    # Step 2: Extract locally
    print("Extracting...")
    with open(f"{TMP_DIR}/images.tar", "wb") as f:
        f.write(r.stdout)
    subprocess.run(["tar", "-xf", f"{TMP_DIR}/images.tar", "-C", TMP_DIR], check=True, timeout=30)
    img_dir = f"{TMP_DIR}/products"
    files = os.listdir(img_dir)
    jpgs = [f for f in files if f.endswith('.jpg')]
    pngs = [f for f in files if f.endswith('.png')]
    print(f"  {len(jpgs)} JPG + {len(pngs)} PNG = {len(jpgs)+len(pngs)} total")

    # Step 3: Convert all to WebP
    from PIL import Image
    ok, fail = 0, 0
    total_orig, total_webp = 0, 0
    start_t = time.time()

    for i, fname in enumerate(jpgs + pngs):
        fpath = os.path.join(img_dir, fname)
        orig_size = os.path.getsize(fpath)
        total_orig += orig_size

        try:
            img = Image.open(fpath)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGBA')
            webp_name = fname.rsplit('.', 1)[0] + '.webp'
            webp_path = os.path.join(img_dir, webp_name)
            img.save(webp_path, format='WEBP', quality=82)
            webp_size = os.path.getsize(webp_path)
            total_webp += webp_size

            # Delete original
            os.remove(fpath)
            ok += 1
        except Exception as e:
            print(f"  FAIL {fname}: {e}")
            fail += 1

        if (i+1) % 200 == 0:
            elapsed = time.time() - start_t
            rate = (i+1) / elapsed
            eta = (len(jpgs)+len(pngs) - i - 1) / rate
            print(f"  {i+1}/{len(jpgs)+len(pngs)} ({rate:.0f} files/s, ETA {eta:.0f}s)")

    elapsed = time.time() - start_t
    orig_mb = total_orig / 1024 / 1024
    webp_mb = total_webp / 1024 / 1024
    savings = (1 - total_webp / total_orig) * 100 if total_orig > 0 else 0
    print(f"\nConverted {ok}/{ok+fail} in {elapsed:.0f}s")
    print(f"  {orig_mb:.1f}MB → {webp_mb:.1f}MB (saved {savings:.0f}%)")

    # Step 4: Tar and copy back
    print("Importing back to container...")
    tar_path = f"{TMP_DIR}/webp.tar"
    subprocess.run(
        ["tar", "-cf", tar_path, "-C", TMP_DIR, "products"],
        check=True, timeout=30
    )
    with open(tar_path, "rb") as f:
        tar_data = f.read()
    print(f"  Tar size: {len(tar_data)} bytes")

    r = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "tar", "-xf", "-", "-C", "/app/uploads/images"],
        input=tar_data, capture_output=True, timeout=120
    )
    if r.returncode != 0:
        print(f"Import failed: {r.stderr.decode()}")
        sys.exit(1)
    print("  Import OK")

    # Step 5: Delete any remaining JPG/PNG files in container
    print("Cleaning up originals in container...")
    subprocess.run(
        ["docker", "exec", CONTAINER, "sh", "-c",
         f"rm -f {UPLOAD_DIR}/*.jpg {UPLOAD_DIR}/*.png"],
        capture_output=True, timeout=30
    )

    # Step 6: Update database
    print("Updating database...")
    sql_jpg = "UPDATE products SET image_url = REPLACE(image_url, '.jpg', '.webp') WHERE image_url LIKE '%.jpg%';"
    sql_png = "UPDATE products SET image_url = REPLACE(image_url, '.png', '.webp') WHERE image_url LIKE '%.png%';"
    subprocess.run(MYSQL_CMD, input=sql_jpg.encode(), capture_output=True, timeout=30)
    subprocess.run(MYSQL_CMD, input=sql_png.encode(), capture_output=True, timeout=30)

    # Verify
    r = subprocess.run(MYSQL_CMD, input=b"SELECT COUNT(*) FROM products WHERE image_url LIKE '%.webp%';", capture_output=True, timeout=10)
    out = r.stdout.decode().strip()
    for line in out.split('\n'):
        if line.strip().isdigit():
            print(f"  Products using WebP: {line.strip()}")

    r2 = subprocess.run(MYSQL_CMD, input=b"SELECT COUNT(*) FROM products WHERE image_url LIKE '%.jpg%' OR image_url LIKE '%.png%';", capture_output=True, timeout=10)
    out2 = r2.stdout.decode().strip()
    for line in out2.split('\n'):
        if line.strip().isdigit():
            print(f"  Still referencing JPG/PNG: {line.strip()}")

    # Cleanup
    shutil.rmtree(TMP_DIR)
    print("Done!")

if __name__ == "__main__":
    main()
