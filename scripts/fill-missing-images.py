"""
Fill missing product images via Pexels API.
Reads product list from MySQL, searches Pexels, downloads, copies to container, updates DB.
"""
import json, subprocess, sys, uuid, time, urllib.request, os

PEXELS_KEY = "ZE0TOk22Tp7AS3p5TsLI1xseCs8bC8b0RtFJwN8oZyB8Y9QAmwDnmE8O"
PEXELS_SEARCH = "https://api.pexels.com/v1/search"
CONTAINER = "smart-commerceops-catalog-service-1"
UPLOAD_DIR = "/app/uploads/images/products"
MYSQL_CMD = [
    "docker", "exec", "-i", "smart-commerceops-mysql-1",
    "mysql", "-uroot", "-pcommerceops", "catalog_db",
    "--default-character-set=utf8mb4"
]

def get_missing_products():
    """Query products with empty image_url."""
    sql = """SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name, 'category', category))
FROM products WHERE image_url IS NULL OR image_url = '[]' OR image_url = '[""]' OR image_url = '';"""
    r = subprocess.run(MYSQL_CMD, input=sql.encode(), capture_output=True, timeout=30)
    raw = r.stdout.decode().strip()
    # Skip mysql warning line
    for line in raw.split('\n'):
        line = line.strip()
        if line.startswith('['):
            return json.loads(line)
    return []

def search_pexels(query, per_page=1):
    """Search Pexels for a product image."""
    url = f"{PEXELS_SEARCH}?query={urllib.request.quote(query)}&per_page={per_page}&size=medium&orientation=square"
    req = urllib.request.Request(url, headers={"Authorization": PEXELS_KEY})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            photos = data.get("photos", [])
            if photos:
                return photos[0]["src"]["large"]
    except Exception as e:
        print(f"  Pexels search failed: {e}")
    return None

def download_image(url, dest_path):
    """Download image from URL to local path."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(dest_path, 'wb') as f:
                f.write(resp.read())
        return os.path.getsize(dest_path) > 1000  # min 1KB
    except Exception as e:
        print(f"  Download failed: {e}")
        return False

def update_db(product_id, image_path):
    """Update product image_url in database."""
    json_val = json.dumps([image_path])
    sql = f"UPDATE products SET image_url = '{json_val}' WHERE id = {product_id};"
    r = subprocess.run(MYSQL_CMD, input=sql.encode(), capture_output=True, timeout=10)
    if r.returncode != 0:
        print(f"  DB update error: {r.stderr.decode()}")

def main():
    products = get_missing_products()
    print(f"Found {len(products)} products without images")

    ok, fail = 0, 0
    tmp_dir = "/tmp/fill-images"
    os.makedirs(tmp_dir, exist_ok=True)

    for i, p in enumerate(products):
        pid = p["id"]
        name = p["name"]
        print(f"[{i+1}/{len(products)}] ID={pid}: {name[:50]}")

        # Search Pexels
        # Use simplified keywords: first 2-3 words of product name
        keywords = " ".join(name.split()[:3])
        img_url = search_pexels(keywords)
        if not img_url:
            # Retry with category + name
            cat = p.get("category", "")
            img_url = search_pexels(f"{cat} {name.split()[0]}")
        if not img_url:
            print(f"  No image found, skipping")
            fail += 1
            continue

        # Download
        file_uuid = str(uuid.uuid4())
        local_path = os.path.join(tmp_dir, f"{file_uuid}.jpg")
        if not download_image(img_url, local_path):
            fail += 1
            continue

        # Copy to container
        container_path = f"{UPLOAD_DIR}/{file_uuid}.jpg"
        cp = subprocess.run(
            ["docker", "cp", local_path, f"{CONTAINER}:{container_path}"],
            capture_output=True, timeout=15
        )
        if cp.returncode != 0:
            print(f"  Container copy failed: {cp.stderr.decode()}")
            fail += 1
            continue

        # Update DB
        update_db(pid, f"/images/products/{file_uuid}.jpg")
        ok += 1

        # Clean up local temp file
        os.remove(local_path)

        # Rate limit: ~1 req/sec
        time.sleep(0.8)

    print(f"\nDone: {ok} OK, {fail} FAILED")

if __name__ == "__main__":
    main()
