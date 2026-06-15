// Update all product images with category-relevant real photos via loremflickr
// Usage: node scripts/update-product-images.js
const BASE = process.env.API_BASE || 'http://localhost:8090';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) { const t = await res.text(); throw new Error(`${path}: ${res.status} ${t}`); }
  return res.json();
}

async function put(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) { const t = await res.text(); throw new Error(`${path}: ${res.status} ${t}`); }
  return res.json();
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) { const t = await res.text(); throw new Error(`${path}: ${res.status} ${t}`); }
  return res.json();
}

function imgUrl(keyword, idx) {
  // loremflickr returns real Flickr photos matching the keyword
  // Add 'product' context + idx for variety (different photos for same keyword)
  const k = encodeURIComponent(keyword);
  return `https://loremflickr.com/640/480/${k}?random=${idx}`;
}

// Product keywords mapped by index in PRODUCT_TEMPLATES (same order as seed script)
const PRODUCT_KEYWORDS = [
  // ---- Electronics (数码先锋) ----
  'wireless-bluetooth-earphones', '4k-computer-monitor', 'mechanical-keyboard', 'usb-c-hub-dock',
  'smartwatch', 'wireless-charger', 'portable-bluetooth-speaker', 'usb-c-fast-charger',
  'hd-webcam-camera', 'tablet-stand-holder', 'gaming-mouse', 'laptop-cooling-pad',
  'power-bank', 'usb-microphone', 'smart-wifi-plug', 'hdmi-cable', 'led-desk-lamp',
  'phone-gimbal-stabilizer', 'wifi-router', 'drawing-tablet-pen',

  // ---- Apparel (时尚衣橱) ----
  'cotton-tshirt', 'down-jacket-puffer', 'denim-jeans', 'canvas-sneakers',
  'wool-sweater-knit', 'sun-protection-jacket', 'jogger-pants', 'silk-scarf',
  'leather-belt', 'cotton-pajamas', 'hardshell-jacket-outdoor', 'oxford-dress-shirt',
  'yoga-leggings', 'wool-coat', 'sports-bra', 'linen-pants-trousers',
  'chunky-dad-sneakers', 'baseball-cap-hat', 'cotton-socks', 'backpack-travel-bag',

  // ---- Groceries (美味生活) ----
  'ethiopian-coffee-beans', 'dark-chocolate-bar', 'matcha-green-tea-powder', 'almonds-nuts',
  'olive-oil-bottle', 'puerh-tea-cake', 'white-peach-oolong-tea', 'manuka-honey-jar',
  'seaweed-crisps-snack', 'quinoa-grain', 'french-butter-cookies', 'sichuan-peppercorn',
  'canned-tomatoes-italian', 'white-coffee-malaysian', 'greek-yogurt', 'jasmine-rice',
  'australian-wagyu-steak', 'goji-berries', 'japanese-soy-sauce', 'cashew-nuts',

  // ---- Home (家居精品) ----
  'soy-candle-scented', 'double-wall-glass-cup', 'memory-foam-pillow', 'ceramic-vase-decorative',
  'cotton-bath-towel', 'smart-trash-can', 'tatami-floor-mat', 'star-projector-night-light',
  'kitchen-shelf-rack', 'blackout-curtains', 'latex-seat-cushion', 'aroma-diffuser-humidifier',
  'wooden-cutting-board', 'diatomite-bath-mat', 'electric-cooking-pot', 'wall-clock-modern',
  'fridge-magnetic-rack', 'cotton-bedsheet-set', 'automatic-soap-dispenser', 'floor-lamp-scandinavian',

  // ---- Lifestyle (运动达人) ----
  'running-shoes', 'yoga-mat', 'adjustable-dumbbell', 'massage-gun-fascia',
  'stainless-steel-water-bottle', 'resistance-bands-set', 'ab-roller-wheel', 'cycling-helmet',
  'whey-protein-powder', 'jump-rope-speed', 'knee-support-brace', 'situp-bench-abdominal',
  'camping-folding-chair', 'swimming-goggles', 'trekking-poles-hiking', 'running-waist-belt',
  'yoga-block-foam', 'body-fat-scale-smart', 'foam-roller', 'microfiber-sports-towel',
];

const MERCHANT_CREDS = [
  { username: 'digi_pioneer',  password: 'merchant123' },
  { username: 'fashion_closet', password: 'merchant123' },
  { username: 'tasty_life',    password: 'merchant123' },
  { username: 'home_boutique', password: 'merchant123' },
  { username: 'sports_pro',    password: 'merchant123' },
];

async function main() {
  console.log('=== Update Product Images ===\n');

  // Login all merchants
  const tokens = [];
  for (const cred of MERCHANT_CREDS) {
    const auth = await post('/auth/login', cred);
    tokens.push({ ...cred, token: auth.accessToken, userId: auth.user.id });
    console.log(`✓ Logged in: ${cred.username} (id=${auth.user.id})`);
  }

  // Fetch products for each merchant and update images
  let totalUpdated = 0;
  for (const m of tokens) {
    console.log(`\n--- ${m.username} ---`);
    const products = await get(`/admin/products?merchantId=${m.userId}`, m.token);
    console.log(`  Found ${products.length} products`);

    // Sort by id to match our keyword order
    products.sort((a, b) => a.id - b.id);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      // Determine which keyword index this product corresponds to
      // Products are created in order, so we need to map by merchant
      let keywordIndex;
      if (m.username === 'digi_pioneer')       keywordIndex = i;                    // 0-19
      else if (m.username === 'fashion_closet') keywordIndex = 20 + i;              // 20-39
      else if (m.username === 'tasty_life')     keywordIndex = 40 + i;              // 40-59
      else if (m.username === 'home_boutique')  keywordIndex = 60 + i;              // 60-79
      else                                      keywordIndex = 80 + i;              // 80-99

      const kw = PRODUCT_KEYWORDS[keywordIndex] || p.category;
      const imageUrls = [imgUrl(kw, 1), imgUrl(kw, 2)];

      try {
        await put(`/admin/products/${p.id}/images`, imageUrls, m.token);
        totalUpdated++;
        if ((i + 1) % 5 === 0) console.log(`  Updated ${i + 1}/${products.length}`);
      } catch (e) {
        console.error(`  ✗ ${p.name}: ${e.message}`);
      }
    }
  }

  console.log(`\n=== Done: ${totalUpdated} products updated ===`);
  console.log('Images: loremflickr.com (real Flickr photos by keyword)');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
