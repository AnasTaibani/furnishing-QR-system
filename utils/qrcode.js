export async function generateQRCode(productCode) {
  return `/api/qr/${productCode}`;
}