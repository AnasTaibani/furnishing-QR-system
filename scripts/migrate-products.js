/**
 * Migration script: 
 *  - Backfill new fields (priceCode, endUse, washCare, hsnCode) on existing products with defaults.
 *  - Regenerate productCode to new format [PREFIX][VVV][BBB][PPP] using catalogue name.
 *  - Regenerate QR + barcode files matching new code.
 *  - Old QR/barcode files remain on disk (not deleted) for safety.
 *
 * Run: node scripts/migrate-products.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'furnishing_catalogue';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function zeroPad(n, l = 3) { return String(n).padStart(l, '0'); }
function prefix(name = '') {
  const letters = String(name).toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) return 'XXX';
  return letters.substring(0, 3).padEnd(3, 'X');
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function genQR(code) {
  const dir = path.join(process.cwd(), 'public', 'qrcodes');
  await ensureDir(dir);
  const fp = path.join(dir, `${code}.png`);
  await QRCode.toFile(fp, `${BASE_URL}/p/${code}`, { width: 300, margin: 1, color: { dark: '#000', light: '#FFF' } });
  return `/qrcodes/${code}.png`;
}
async function genBarcode(code) {
  const dir = path.join(process.cwd(), 'public', 'barcodes');
  await ensureDir(dir);
  const fp = path.join(dir, `${code}.png`);
  const png = await bwipjs.toBuffer({ bcid: 'code128', text: code, scale: 3, height: 10, includetext: true, textxalign: 'center' });
  fs.writeFileSync(fp, png);
  return `/barcodes/${code}.png`;
}

const END_USE_BY_INDEX = ['sofas', 'curtains', 'blinds', 'cushions'];
const WASH_CARE_PRESETS = [
  ['wash_40', 'no_bleach', 'hang_dry', 'iron_2_dots'],
  ['wash_40', 'no_tumble', 'dry_clean', 'iron_2_dots'],
  ['no_bleach', 'no_tumble', 'hang_dry', 'dry_clean'],
  ['wash_40', 'no_bleach', 'no_tumble', 'hang_dry', 'iron_2_dots'],
];

async function main() {
  if (!MONGO_URL) throw new Error('MONGO_URL not set');
  const c = new MongoClient(MONGO_URL);
  await c.connect();
  const db = c.db(DB_NAME);
  console.log(`Connected to ${DB_NAME}`);

  const vendors = await db.collection('vendors').find({}).toArray();
  const vendorById = Object.fromEntries(vendors.map(v => [v.id, v]));
  const catalogues = await db.collection('catalogues').find({}).toArray();
  const catalogueById = Object.fromEntries(catalogues.map(c => [c.id, c]));

  const products = await db.collection('products').find({}).toArray();
  console.log(`Found ${products.length} products to migrate.`);

  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cat = catalogueById[p.catalogueId];
    const ven = cat ? vendorById[cat.vendorId] : null;
    if (!cat || !ven) {
      console.log(`  ! Skipping ${p.productCode} (missing catalogue or vendor)`);
      continue;
    }
    const newCode = `${prefix(cat.catalogueName)}${zeroPad(ven.vendorCode)}${zeroPad(cat.bookNumber)}${zeroPad(p.pageNumber)}`;
    const qrPath = await genQR(newCode);
    const barcodePath = await genBarcode(newCode);

    const set = {
      productCode: newCode,
      priceCode: p.priceCode ?? `PC-${zeroPad(p.pageNumber, 3)}`,
      endUse: p.endUse ?? END_USE_BY_INDEX[(p.pageNumber - 1) % END_USE_BY_INDEX.length],
      washCare: Array.isArray(p.washCare) && p.washCare.length > 0 ? p.washCare : WASH_CARE_PRESETS[(p.pageNumber - 1) % WASH_CARE_PRESETS.length],
      hsnCode: p.hsnCode ?? '5407',
      qrCodePath: qrPath,
      barcodePath,
      updatedAt: new Date(),
    };
    await db.collection('products').updateOne({ id: p.id }, { $set: set });
    updated++;
    console.log(`  ✓ ${p.productCode} → ${newCode}`);
  }
  console.log(`\n✓ Migration complete: ${updated} products updated.`);
  await c.close();
}

main().catch(err => { console.error(err); process.exit(1); });
