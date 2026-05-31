/**
 * Seed script: 1 vendor, 1 catalogue, 23 products.
 * Run: node scripts/seed.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'furnishing_catalogue';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function zeroPad(n, l = 3) {
  return String(n).padStart(l, '0');
}

function cataloguePrefix(name = '') {
  const letters = String(name).toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) return 'XXX';
  return letters.substring(0, 3).padEnd(3, 'X');
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generateQR(productCode) {
  const qrDir = path.join(process.cwd(), 'public', 'qrcodes');
  await ensureDir(qrDir);
  const filepath = path.join(qrDir, `${productCode}.png`);
  await QRCode.toFile(filepath, `${BASE_URL}/p/${productCode}`, {
    width: 300, margin: 1, color: { dark: '#000', light: '#FFF' },
  });
  return `/qrcodes/${productCode}.png`;
}

async function generateBarcode(productCode) {
  const dir = path.join(process.cwd(), 'public', 'barcodes');
  await ensureDir(dir);
  const filepath = path.join(dir, `${productCode}.png`);
  const png = await bwipjs.toBuffer({
    bcid: 'code128', text: productCode, scale: 3, height: 10,
    includetext: true, textxalign: 'center',
  });
  fs.writeFileSync(filepath, png);
  return `/barcodes/${productCode}.png`;
}

// Realistic sample fabric data
const sampleShades = ['Beige', 'Ivory', 'Cream', 'Champagne', 'Pearl', 'Sand', 'Mocha', 'Taupe', 'Stone', 'Linen', 'Charcoal', 'Slate', 'Graphite', 'Midnight', 'Indigo', 'Navy', 'Forest', 'Olive', 'Rust', 'Terracotta', 'Burgundy', 'Wine', 'Plum'];
const sampleCompositions = ['100% Polyester', '70% Polyester 30% Cotton', '100% Velvet', 'Polyester Blend', '85% Polyester 15% Linen'];
const sampleGSMs = ['280', '300', '320', '340', '360', '400', '450'];
const sampleWidths = ['140cm', '150cm', '280cm', '300cm'];
const sampleMartindale = ['20000', '30000', '40000', '50000', '60000'];

function pick(arr, i) { return arr[i % arr.length]; }
function randMrp(i) { return 800 + (i * 137) % 4200; }
function randPr(i) { return Math.round((randMrp(i) * 0.45 + (i * 11) % 60)); }

async function main() {
  if (!MONGO_URL) throw new Error('MONGO_URL not set');

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to ${DB_NAME}`);

  // 1) Vendor
  const vendorCode = 23;
  let vendor = await db.collection('vendors').findOne({ vendorCode });
  if (!vendor) {
    vendor = {
      id: uuidv4(),
      vendorCode,
      vendorName: 'Elegance Furnishings Pvt Ltd',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('vendors').insertOne(vendor);
    console.log(`✓ Vendor created: ${vendor.vendorName} (${zeroPad(vendor.vendorCode)})`);
  } else {
    console.log(`✓ Vendor exists: ${vendor.vendorName}`);
  }

  // 2) Catalogue
  const bookNumber = 1;
  let catalogue = await db.collection('catalogues').findOne({ vendorId: vendor.id, bookNumber });
  if (!catalogue) {
    catalogue = {
      id: uuidv4(),
      vendorId: vendor.id,
      bookNumber,
      catalogueName: 'Aurora Collection - Volume 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('catalogues').insertOne(catalogue);
    console.log(`✓ Catalogue created: ${catalogue.catalogueName} (Book ${zeroPad(bookNumber)})`);
  } else {
    console.log(`✓ Catalogue exists: ${catalogue.catalogueName}`);
  }

  // 3) 23 Products
  let created = 0;
  let skipped = 0;
  const WASH_CARE_PRESETS = [
    ['wash_40', 'no_bleach', 'hang_dry', 'iron_2_dots'],
    ['wash_40', 'no_tumble', 'dry_clean', 'iron_2_dots'],
    ['no_bleach', 'no_tumble', 'hang_dry', 'dry_clean'],
    ['wash_40', 'no_bleach', 'no_tumble', 'hang_dry', 'iron_2_dots'],
  ];
  const END_USES = ['sofas', 'curtains', 'blinds', 'cushions'];

  const prefix = cataloguePrefix(catalogue.catalogueName);
  for (let i = 1; i <= 23; i++) {
    const productCode = `${prefix}${zeroPad(vendor.vendorCode)}${zeroPad(bookNumber)}${zeroPad(i)}`;
    const existing = await db.collection('products').findOne({ catalogueId: catalogue.id, pageNumber: i, deletedAt: null });
    if (existing) {
      skipped++;
      continue;
    }
    const qrPath = await generateQR(productCode);
    const barcodePath = await generateBarcode(productCode);
    const product = {
      id: uuidv4(),
      catalogueId: catalogue.id,
      pageNumber: i,
      productCode,
      priceCode: `PC-${zeroPad(i, 3)}`,
      endUse: END_USES[(i - 1) % END_USES.length],
      washCare: WASH_CARE_PRESETS[(i - 1) % WASH_CARE_PRESETS.length],
      mrp: randMrp(i),
      purchaseRateCL: randPr(i),
      purchaseRateRL: randPr(i) + 50,
      composition: pick(sampleCompositions, i),
      gsm: pick(sampleGSMs, i),
      width: pick(sampleWidths, i),
      martindale: pick(sampleMartindale, i),
      shade: pick(sampleShades, i - 1),
      remarks: `Sample fabric ${i}`,
      hsnCode: '5407',
      qrCodePath: qrPath,
      barcodePath,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('products').insertOne(product);
    created++;
    console.log(`  + ${productCode} - ${product.shade} - ₹${product.mrp}`);
  }
  console.log(`\n✓ Seed complete: ${created} created, ${skipped} already existed.`);
  await client.close();
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
