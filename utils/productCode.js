/**
 * Zero pad a number to specified length
 */
export function zeroPad(num, length = 3) {
  return String(num).padStart(length, '0');
}

/**
 * Generate catalogue prefix from name.
 * Rules: uppercase, alphabet only, first 3 valid letters.
 * Falls back to 'XXX' if no letters present.
 */
export function generateCataloguePrefix(name = '') {
  const letters = String(name).toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length === 0) return 'XXX';
  return (letters.substring(0, 3)).padEnd(3, 'X');
}

/**
 * Generate product code in format: [CATALOGUE_PREFIX][VVV][BBB][PPP]
 * No dashes.
 * Example: AUR023001023
 */
export function generateProductCode(vendorCode, bookNumber, pageNumber, catalogueName = '') {
  const prefix = generateCataloguePrefix(catalogueName);
  return `${prefix}${zeroPad(vendorCode, 3)}${zeroPad(bookNumber, 3)}${zeroPad(pageNumber, 3)}`;
}

/**
 * Parse product code to extract components.
 * Supports both old (VVV-BBB-PPP) and new (XXXVVVBBBPPP) formats.
 */
export function parseProductCode(productCode) {
  if (!productCode) return null;
  // New format: 3 letters + 9 digits = 12 chars
  if (/^[A-Z]{3}\d{9}$/.test(productCode)) {
    return {
      prefix: productCode.substring(0, 3),
      vendorCode: parseInt(productCode.substring(3, 6), 10),
      bookNumber: parseInt(productCode.substring(6, 9), 10),
      pageNumber: parseInt(productCode.substring(9, 12), 10),
    };
  }
  // Old format with dashes
  const parts = productCode.split('-');
  if (parts.length === 3) {
    return {
      prefix: null,
      vendorCode: parseInt(parts[0], 10),
      bookNumber: parseInt(parts[1], 10),
      pageNumber: parseInt(parts[2], 10),
    };
  }
  return null;
}
