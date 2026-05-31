import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/**
 * Generate QR code for a product
 * @param {string} productCode - Product code (e.g., "023-001-011")
 * @returns {Promise<string>} Path to the generated QR code
 */
export async function generateQRCode(productCode) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const publicUrl = `${baseUrl}/p/${productCode}`;
  
  const qrDir = path.join(process.cwd(), 'public', 'qrcodes');
  
  // Ensure directory exists
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }
  
  const filename = `${productCode}.png`;
  const filepath = path.join(qrDir, filename);
  
  // Generate QR code
  await QRCode.toFile(filepath, publicUrl, {
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return `/qrcodes/${filename}`;
}
