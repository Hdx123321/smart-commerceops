"""
Fill missing product images via LoremFlickr (free, no API key).
Downloads images, copies to catalog-service container, updates DB.
"""
import json, subprocess, uuid, time, urllib.request, os, sys

CONTAINER = "smart-commerceops-catalog-service-1"
UPLOAD_DIR = "/app/uploads/images/products"
MYSQL_CMD = [
    "docker", "exec", "-i", "smart-commerceops-mysql-1",
    "mysql", "-uroot", "-pcommerceops", "catalog_db",
    "--default-character-set=utf8mb4"
]

def get_missing_products():
    sql = """SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name, 'category', category))
FROM products WHERE image_url IS NULL OR image_url = '[]' OR image_url = '[""]' OR image_url = '';"""
    r = subprocess.run(MYSQL_CMD, input=sql.encode(), capture_output=True, timeout=30)
    raw = r.stdout.decode().strip()
    for line in raw.split('\n'):
        line = line.strip()
        if line.startswith('['):
            return json.loads(line)
    return []

def download_image(keyword, dest_path):
    """Download from LoremFlickr with keyword."""
    url = f"https://loremflickr.com/640/480/{urllib.request.quote(keyword)}?random=1"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            # Follow redirects handled by urllib
            data = resp.read()
            if len(data) < 2000:
                return False
            with open(dest_path, 'wb') as f:
                f.write(data)
        return os.path.getsize(dest_path) > 1000
    except Exception as e:
        print(f"  Download error: {e}")
        return False

def update_db(product_id, image_path):
    json_val = json.dumps([image_path])
    sql = f"UPDATE products SET image_url = '{json_val}' WHERE id = {product_id};"
    r = subprocess.run(MYSQL_CMD, input=sql.encode(), capture_output=True, timeout=10)

def main():
    products = get_missing_products()
    print(f"Found {len(products)} products without images")
    ok, fail = 0, 0
    tmp_dir = "/tmp/fill-images2"
    os.makedirs(tmp_dir, exist_ok=True)

    for i, p in enumerate(products):
        pid = p["id"]
        name = p["name"]
        cat = p.get("category", "")
        print(f"[{i+1}/{len(products)}] ID={pid}: {name}")

        # Use English-friendly keyword: category + first word
        kw = f"{cat} {name.split()[0]}"
        file_uuid = str(uuid.uuid4())
        local_path = os.path.join(tmp_dir, f"{file_uuid}.jpg")

        if not download_image(kw, local_path):
            # Retry with just category
            if not download_image(cat, local_path):
                print(f"  Failed, skipping")
                fail += 1
                continue

        # Copy to container
        container_path = f"{UPLOAD_DIR}/{file_uuid}.jpg"
        cp = subprocess.run(
            ["docker", "cp", local_path, f"{CONTAINER}:{container_path}"],
            capture_output=True, timeout=15
        )
        if cp.returncode != 0:
            print(f"  Container cp error: {cp.stderr.decode()}")
            fail += 1
            os.remove(local_path)
            continue

        update_db(pid, f"/images/products/{file_uuid}.jpg")
        ok += 1
        os.remove(local_path)
        time.sleep(0.7)

    # Final count
    print(f"\nDone: {ok} OK, {fail} FAILED")
    # Print remaining count
    sql = "SELECT COUNT(*) FROM products WHERE image_url IS NULL OR image_url = '[]' OR image_url = '[\"\"]' OR image_url = '';"
    r = subprocess.run(MYSQL_CMD, input=sql.encode(), capture_output=True, timeout=10)
    for line in r.stdout.decode().strip().split('\n'):
        if line.strip().isdigit():
            print(f"Remaining without images: {line.strip()}")

if __name__ == "__main__":
    main()
