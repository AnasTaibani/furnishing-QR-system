import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';

/**
 * Generate barcode for a product
 * @param {string} productCode - Product code (e.g., "023-001-011")
 * @returns {Promise<string>} Path to the generated barcode
 */
export async function generateBarcode(productCode) {
  const barcodeDir = path.join(process.cwd(), 'public', 'barcodes');
  
  // Ensure directory exists
  if (!fs.existsSync(barcodeDir)) {
    fs.mkdirSync(barcodeDir, { recursive: true });
  }
  
  const filename = `${productCode}.png`;
  const filepath = path.join(barcodeDir, filename);
  
  // Generate barcode (using Code128)
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: productCode,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center'
  });
  
  // Save to file
  fs.writeFileSync(filepath, png);
  
  return `/barcodes/${filename}`;
}
