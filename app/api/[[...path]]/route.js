import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { validateAdminCredentials, verifySession, getSessionToken } from '@/lib/auth';
import { generateProductCode } from '@/utils/productCode';
import { generateQRCode } from '@/utils/qrcode';
import { generateBarcode } from '@/utils/barcode';
import { v4 as uuidv4 } from 'uuid';

// Helper function to check authentication
function checkAuth(request) {
  const token = request.cookies.get('admin-token')?.value;
  return verifySession(token);
}

// Helper function to create error response
function errorResponse(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Helper function to track product history
async function trackProductHistory(db, productId, fieldName, oldValue, newValue) {
  await db.collection('product_history').insertOne({
    id: uuidv4(),
    productId,
    fieldName,
    oldValue: oldValue?.toString() || null,
    newValue: newValue?.toString() || null,
    changedAt: new Date()
  });
}

// Parse path parts after /api prefix
function getPathParts(request) {
  const { pathname } = new URL(request.url);
  return pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
}

export async function GET(request) {
  const pathParts = getPathParts(request);

  try {
    const db = await getDatabase();

    // Root API endpoint
    if (pathParts.length === 0) {
      return NextResponse.json({ 
        message: 'Furnishing Catalogue API',
        version: '1.0.0',
        endpoints: {
          public: ['/api/public/products/:code'],
          admin: ['/api/vendors', '/api/catalogues', '/api/products', '/api/auth/login']
        }
      });
    }

    // Public product endpoint - NO AUTH REQUIRED
    if (pathParts[0] === 'public' && pathParts[1] === 'products' && pathParts[2]) {
      const productCode = pathParts[2];
      const product = await db.collection('products').findOne({ 
        productCode,
        deletedAt: null 
      });

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      // Look up catalogue to expose catalogueRN + catalogueFN (per Round 5 spec)
      let catalogueRN = null;
      let catalogueFN = null;
      if (product.catalogueId) {
        const catalogue = await db.collection('catalogues').findOne({ id: product.catalogueId });
        if (catalogue) {
          catalogueRN = catalogue.catalogueRN || null;
          catalogueFN = catalogue.catalogueFN || null;
        }
      }

      // Public payload: ONLY these 4 fields. No internal pricing, no shade, no remarks, etc.
      return NextResponse.json({
        productCode: product.productCode,
        mrp: product.mrp,
        catalogueRN,
        catalogueFN,
      });
    }

    // All other endpoints require authentication
    if (!checkAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }

    // GET /api/vendors
    if (pathParts[0] === 'vendors' && pathParts.length === 1) {
      const vendors = await db.collection('vendors').find({ deletedAt: { $in: [null, undefined] } }).toArray();
      return NextResponse.json(vendors);
    }

    // GET /api/vendors/:id
    if (pathParts[0] === 'vendors' && pathParts[1]) {
      const vendor = await db.collection('vendors').findOne({ id: pathParts[1] });
      if (!vendor) {
        return errorResponse('Vendor not found', 404);
      }
      return NextResponse.json(vendor);
    }

    // GET /api/catalogues
    if (pathParts[0] === 'catalogues' && pathParts.length === 1) {
      const { searchParams } = new URL(request.url);
      const vendorId = searchParams.get('vendorId');
      const query = { deletedAt: { $in: [null, undefined] } };
      if (vendorId) query.vendorId = vendorId;
      const catalogues = await db.collection('catalogues').find(query).toArray();
      // Populate vendor
      for (const c of catalogues) {
        if (c.vendorId) {
          const v = await db.collection('vendors').findOne({ id: c.vendorId });
          if (v) c.vendor = v;
        }
      }
      return NextResponse.json(catalogues);
    }

    // GET /api/catalogues/:id
    if (pathParts[0] === 'catalogues' && pathParts[1]) {
      const catalogue = await db.collection('catalogues').findOne({ id: pathParts[1] });
      if (!catalogue) {
        return errorResponse('Catalogue not found', 404);
      }
      return NextResponse.json(catalogue);
    }

    // GET /api/products with search
    if (pathParts[0] === 'products' && pathParts.length === 1) {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const vendorId = searchParams.get('vendorId');
      const catalogueId = searchParams.get('catalogueId');

      let query = { deletedAt: null };

      if (search) {
        // Also lookup catalogues whose RN or FN match search to filter products
        const matchingCats = await db.collection('catalogues').find({
          $or: [
            { catalogueRN: { $regex: search, $options: 'i' } },
            { catalogueFN: { $regex: search, $options: 'i' } },
          ],
        }).project({ id: 1 }).toArray();
        const catIds = matchingCats.map(c => c.id);
        query.$or = [
          { productCode: { $regex: search, $options: 'i' } },
          { priceCode: { $regex: search, $options: 'i' } },
          { shade: { $regex: search, $options: 'i' } },
          ...(catIds.length > 0 ? [{ catalogueId: { $in: catIds } }] : []),
        ];
      }

      if (catalogueId) {
        query.catalogueId = catalogueId;
      }

      const endUse = searchParams.get('endUse');
      if (endUse) {
        // endUse field may be string (legacy) or array - match either
        query.$and = (query.$and || []).concat([
          { $or: [{ endUse }, { endUse: { $in: [endUse] } }] },
        ]);
      }

      const products = await db.collection('products').find(query).sort({ createdAt: -1 }).toArray();
      
      // Populate catalogue and vendor info
      for (let product of products) {
        if (product.catalogueId) {
          const catalogue = await db.collection('catalogues').findOne({ id: product.catalogueId });
          if (catalogue) {
            product.catalogue = catalogue;
            const vendor = await db.collection('vendors').findOne({ id: catalogue.vendorId });
            if (vendor) {
              product.vendor = vendor;
            }
          }
        }
      }

      return NextResponse.json(products);
    }

    // GET /api/products/:id
    if (pathParts[0] === 'products' && pathParts[1]) {
      const product = await db.collection('products').findOne({ id: pathParts[1] });
      if (!product) {
        return errorResponse('Product not found', 404);
      }

      // Populate catalogue and vendor
      if (product.catalogueId) {
        const catalogue = await db.collection('catalogues').findOne({ id: product.catalogueId });
        if (catalogue) {
          product.catalogue = catalogue;
          const vendor = await db.collection('vendors').findOne({ id: catalogue.vendorId });
          if (vendor) {
            product.vendor = vendor;
          }
        }
      }

      // Get history
      const history = await db.collection('product_history')
        .find({ productId: product.id })
        .sort({ changedAt: -1 })
        .toArray();
      product.history = history;

      return NextResponse.json(product);
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  const pathParts = getPathParts(request);

  try {
    const db = await getDatabase();

    // POST /api/auth/login - NO AUTH REQUIRED
    if (pathParts[0] === 'auth' && pathParts[1] === 'login') {
      const body = await request.json();
      const { username, password } = body;

      if (validateAdminCredentials(username, password)) {
        const response = NextResponse.json({ 
          success: true,
          message: 'Login successful' 
        });
        
        // Set cookie
        response.cookies.set('admin-token', getSessionToken(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
      }

      return errorResponse('Invalid credentials', 401);
    }

    // All other POST endpoints require authentication
    if (!checkAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }

    // POST /api/vendors
    if (pathParts[0] === 'vendors' && pathParts.length === 1) {
      const body = await request.json();
      const { vendorCode, vendorName } = body;

      if (!vendorCode || !vendorName) {
        return errorResponse('vendorCode and vendorName are required');
      }

      // Check if vendor code already exists
      const existing = await db.collection('vendors').findOne({ vendorCode: parseInt(vendorCode) });
      if (existing) {
        return errorResponse('Vendor code already exists');
      }

      const vendor = {
        id: uuidv4(),
        vendorCode: parseInt(vendorCode),
        vendorName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('vendors').insertOne(vendor);
      return NextResponse.json(vendor, { status: 201 });
    }

    // POST /api/catalogues
    if (pathParts[0] === 'catalogues' && pathParts.length === 1) {
      const body = await request.json();
      const { vendorId, bookNumber, catalogueRN, catalogueFN } = body;

      if (!vendorId || !bookNumber || !catalogueRN || !catalogueFN) {
        return errorResponse('vendorId, bookNumber, catalogueRN, and catalogueFN are required');
      }

      // Verify vendor exists
      const vendor = await db.collection('vendors').findOne({ id: vendorId });
      if (!vendor) {
        return errorResponse('Vendor not found', 404);
      }

      // Check if book number already exists for this vendor
      const existing = await db.collection('catalogues').findOne({ 
        vendorId, 
        bookNumber: parseInt(bookNumber) 
      });
      if (existing) {
        return errorResponse('Book number already exists for this vendor');
      }

      const catalogue = {
        id: uuidv4(),
        vendorId,
        bookNumber: parseInt(bookNumber),
        catalogueRN,
        catalogueFN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('catalogues').insertOne(catalogue);
      return NextResponse.json(catalogue, { status: 201 });
    }

    // POST /api/products/import (CSV bulk import)
    if (pathParts[0] === 'products' && pathParts[1] === 'import') {
      const body = await request.json();
      const { rows } = body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return errorResponse('No rows provided');
      }

      const result = {
        totalRows: rows.length,
        productsCreated: 0,
        productsSkipped: 0,
        vendorsCreated: 0,
        cataloguesCreated: 0,
        errors: [],
      };

      // Caches to avoid repeated DB hits within a single import
      const vendorCache = new Map(); // by vendorCode
      const catalogueCache = new Map(); // by `${vendorId}|${bookNumber}`

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // header row = 1
        try {
          const vendorCode = parseInt(row.vendorCode, 10);
          const vendorName = (row.vendorName || '').trim();
          const bookNumber = parseInt(row.bookNumber, 10);
          // Accept catalogueRN / catalogueFN (new) or catalogueName (legacy backward-compat)
          const catalogueRN = (row.catalogueRN || row.catalogueName || '').trim();
          const catalogueFN = (row.catalogueFN || row.catalogueRN || row.catalogueName || '').trim();
          const pageNumber = parseInt(row.pageNumber, 10);
          const mrp = parseFloat(row.mrp);

          if (!vendorCode || !vendorName || !bookNumber || !catalogueRN || !catalogueFN || !pageNumber || isNaN(mrp)) {
            result.errors.push({ row: rowNum, error: 'Missing required fields (vendorCode, vendorName, bookNumber, catalogueRN, catalogueFN, pageNumber, mrp)' });
            continue;
          }

          // 1. Find or create vendor (by vendorCode)
          let vendor = vendorCache.get(vendorCode);
          if (!vendor) {
            vendor = await db.collection('vendors').findOne({ vendorCode });
            if (!vendor) {
              vendor = {
                id: uuidv4(),
                vendorCode,
                vendorName,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              await db.collection('vendors').insertOne(vendor);
              result.vendorsCreated++;
            }
            vendorCache.set(vendorCode, vendor);
          }

          // 2. Find or create catalogue (by vendorId + bookNumber)
          const catKey = `${vendor.id}|${bookNumber}`;
          let catalogue = catalogueCache.get(catKey);
          if (!catalogue) {
            catalogue = await db.collection('catalogues').findOne({ vendorId: vendor.id, bookNumber });
            if (!catalogue) {
              catalogue = {
                id: uuidv4(),
                vendorId: vendor.id,
                bookNumber,
                catalogueRN,
                catalogueFN,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              await db.collection('catalogues').insertOne(catalogue);
              result.cataloguesCreated++;
            }
            catalogueCache.set(catKey, catalogue);
          }

          // 3. Skip duplicate pageNumber for this catalogue
          const existing = await db.collection('products').findOne({
            catalogueId: catalogue.id,
            pageNumber,
            deletedAt: null,
          });
          if (existing) {
            result.productsSkipped++;
            continue;
          }

          // 4. Generate product code (uses catalogueFN for prefix)
          const productCode = generateProductCode(
            vendor.vendorCode,
            catalogue.bookNumber,
            pageNumber,
            catalogue.catalogueFN || catalogue.catalogueRN || ''
          );

          // Parse pipe-separated multi values
          const splitMulti = (v) => String(v || '').split('|').map(s => s.trim()).filter(Boolean);

          const product = {
            id: uuidv4(),
            catalogueId: catalogue.id,
            pageNumber,
            productCode,
            priceCode: row.priceCode || null,
            endUse: splitMulti(row.endUse),
            washCare: splitMulti(row.washCare),
            mrp,
            purchaseRateCL: row.purchaseRateCL ? parseFloat(row.purchaseRateCL) : null,
            purchaseRateRL: row.purchaseRateRL ? parseFloat(row.purchaseRateRL) : null,
            composition: row.composition || null,
            gsm: row.gsm || null,
            width: row.width || null,
            martindale: row.martindale || null,
            repeat: row.repeat || null,
            shade: row.shade || null,
            hsnCode: row.hsnCode || null,
            remarks: row.remarks || null,
            qrCodePath: null,
            barcodePath: null,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Generate QR + Barcode (continue on failure)
          try {
            product.qrCodePath = await generateQRCode(productCode);
            product.barcodePath = await generateBarcode(productCode);
          } catch (err) {
            console.error('QR/Barcode gen failed for', productCode, err);
          }

          await db.collection('products').insertOne(product);
          result.productsCreated++;
        } catch (err) {
          result.errors.push({ row: rowNum, error: err.message || 'Unknown error' });
        }
      }

      return NextResponse.json(result, { status: 200 });
    }

    // POST /api/products
    if (pathParts[0] === 'products' && pathParts.length === 1) {
      const body = await request.json();
      const { 
        catalogueId, 
        pageNumber,
        priceCode,
        endUse,
        washCare,
        mrp,
        purchaseRateCL,
        purchaseRateRL,
        composition,
        gsm,
        width,
        martindale,
        shade,
        remarks,
        hsnCode
      } = body;

      if (!catalogueId || !pageNumber || !mrp) {
        return errorResponse('catalogueId, pageNumber, and mrp are required');
      }

      // Get catalogue and vendor
      const catalogue = await db.collection('catalogues').findOne({ id: catalogueId });
      if (!catalogue) {
        return errorResponse('Catalogue not found', 404);
      }

      const vendor = await db.collection('vendors').findOne({ id: catalogue.vendorId });
      if (!vendor) {
        return errorResponse('Vendor not found', 404);
      }

      // Check if page number already exists in this catalogue
      const existing = await db.collection('products').findOne({ 
        catalogueId, 
        pageNumber: parseInt(pageNumber),
        deletedAt: null 
      });
      if (existing) {
        return errorResponse('Page number already exists in this catalogue');
      }

      // Generate new format product code: [PREFIX][VVV][BBB][PPP]
      // Prefix is derived from catalogueFN (Fake Name)
      const productCode = generateProductCode(
        vendor.vendorCode,
        catalogue.bookNumber,
        parseInt(pageNumber),
        catalogue.catalogueFN || catalogue.catalogueRN || ''
      );

      // Create product
      const product = {
        id: uuidv4(),
        catalogueId,
        pageNumber: parseInt(pageNumber),
        productCode,
        priceCode: priceCode || null,
        endUse: Array.isArray(endUse) ? endUse : (endUse ? [endUse] : []),
        washCare: Array.isArray(washCare) ? washCare : [],
        mrp: parseFloat(mrp),
        purchaseRateCL: purchaseRateCL !== undefined && purchaseRateCL !== '' && purchaseRateCL !== null ? parseFloat(purchaseRateCL) : null,
        purchaseRateRL: purchaseRateRL !== undefined && purchaseRateRL !== '' && purchaseRateRL !== null ? parseFloat(purchaseRateRL) : null,
        composition: composition || null,
        gsm: gsm || null,
        width: width || null,
        martindale: martindale || null,
        repeat: body.repeat || null,
        shade: shade || null,
        remarks: remarks || null,
        hsnCode: hsnCode || null,
        qrCodePath: null,
        barcodePath: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Generate QR code and barcode
      product.qrCodePath = `/api/qr/${productCode}`;
      product.barcodePath = `/api/barcode/${productCode}`;

      await db.collection('products').insertOne(product);
      return NextResponse.json(product, { status: 201 });
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function PUT(request) {
  const pathParts = getPathParts(request);

  try {
    const db = await getDatabase();

    // All PUT endpoints require authentication
    if (!checkAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }

    // PUT /api/vendors/:id
    if (pathParts[0] === 'vendors' && pathParts[1]) {
      const id = pathParts[1];
      const body = await request.json();
      const { vendorName } = body;

      if (!vendorName) {
        return errorResponse('vendorName is required');
      }

      const vendor = await db.collection('vendors').findOne({ id });
      if (!vendor) {
        return errorResponse('Vendor not found', 404);
      }

      await db.collection('vendors').updateOne(
        { id },
        { 
          $set: { 
            vendorName,
            updatedAt: new Date()
          }
        }
      );

      const updated = await db.collection('vendors').findOne({ id });
      return NextResponse.json(updated);
    }

    // PUT /api/catalogues/:id
    if (pathParts[0] === 'catalogues' && pathParts[1]) {
      const id = pathParts[1];
      const body = await request.json();
      const { catalogueRN, catalogueFN } = body;

      if (!catalogueRN || !catalogueFN) {
        return errorResponse('catalogueRN and catalogueFN are required');
      }

      const catalogue = await db.collection('catalogues').findOne({ id });
      if (!catalogue) {
        return errorResponse('Catalogue not found', 404);
      }

      await db.collection('catalogues').updateOne(
        { id },
        { 
          $set: { 
            catalogueRN,
            catalogueFN,
            updatedAt: new Date()
          }
        }
      );

      const updated = await db.collection('catalogues').findOne({ id });
      return NextResponse.json(updated);
    }

    // PUT /api/products/:id
    if (pathParts[0] === 'products' && pathParts[1]) {
      const id = pathParts[1];
      const body = await request.json();
      const { 
        priceCode,
        endUse,
        washCare,
        mrp,
        purchaseRateCL,
        purchaseRateRL,
        composition,
        gsm,
        width,
        martindale,
        shade,
        remarks,
        hsnCode
      } = body;

      const product = await db.collection('products').findOne({ id });
      if (!product) {
        return errorResponse('Product not found', 404);
      }

      // Track changes
      const fieldsToTrack = {
        priceCode,
        endUse: Array.isArray(endUse) ? endUse.join(',') : endUse,
        washCare: Array.isArray(washCare) ? washCare.join(',') : washCare,
        mrp: parseFloat(mrp),
        purchaseRateCL: purchaseRateCL !== undefined && purchaseRateCL !== '' && purchaseRateCL !== null ? parseFloat(purchaseRateCL) : null,
        purchaseRateRL: purchaseRateRL !== undefined && purchaseRateRL !== '' && purchaseRateRL !== null ? parseFloat(purchaseRateRL) : null,
        composition,
        gsm,
        width,
        martindale,
        repeat: body.repeat,
        shade,
        remarks,
        hsnCode,
      };

      const currentValues = {
        ...product,
        endUse: Array.isArray(product.endUse) ? product.endUse.join(',') : product.endUse,
        washCare: Array.isArray(product.washCare) ? product.washCare.join(',') : product.washCare,
      };

      for (const [field, newValue] of Object.entries(fieldsToTrack)) {
        if (newValue !== undefined && currentValues[field] !== newValue) {
          await trackProductHistory(db, id, field, currentValues[field], newValue);
        }
      }

      // Update product
      await db.collection('products').updateOne(
        { id },
        { 
          $set: { 
            priceCode: priceCode ?? null,
            endUse: Array.isArray(endUse) ? endUse : (endUse ? [endUse] : []),
            washCare: Array.isArray(washCare) ? washCare : [],
            mrp: parseFloat(mrp),
            purchaseRateCL: purchaseRateCL !== undefined && purchaseRateCL !== '' && purchaseRateCL !== null ? parseFloat(purchaseRateCL) : null,
            purchaseRateRL: purchaseRateRL !== undefined && purchaseRateRL !== '' && purchaseRateRL !== null ? parseFloat(purchaseRateRL) : null,
            composition: composition || null,
            gsm: gsm || null,
            width: width || null,
            martindale: martindale || null,
            repeat: body.repeat || null,
            shade: shade || null,
            remarks: remarks || null,
            hsnCode: hsnCode || null,
            updatedAt: new Date()
          }
        }
      );

      const updated = await db.collection('products').findOne({ id });
      return NextResponse.json(updated);
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request) {
  const pathParts = getPathParts(request);

  try {
    const db = await getDatabase();

    // All DELETE endpoints require authentication
    if (!checkAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }

    // DELETE /api/vendors/:id (soft delete)
    if (pathParts[0] === 'vendors' && pathParts[1]) {
      const id = pathParts[1];
      const vendor = await db.collection('vendors').findOne({ id });
      if (!vendor) return errorResponse('Vendor not found', 404);
      await db.collection('vendors').updateOne(
        { id },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: 'Vendor deleted' });
    }

    // DELETE /api/catalogues/:id (soft delete)
    if (pathParts[0] === 'catalogues' && pathParts[1]) {
      const id = pathParts[1];
      const catalogue = await db.collection('catalogues').findOne({ id });
      if (!catalogue) return errorResponse('Catalogue not found', 404);
      await db.collection('catalogues').updateOne(
        { id },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: 'Catalogue deleted' });
    }

    // DELETE /api/products/:id (soft delete)
    if (pathParts[0] === 'products' && pathParts[1]) {
      const id = pathParts[1];

      const product = await db.collection('products').findOne({ id });
      if (!product) {
        return errorResponse('Product not found', 404);
      }

      // Soft delete
      await db.collection('products').updateOne(
        { id },
        { 
          $set: { 
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({ success: true, message: 'Product deleted' });
    }

    return errorResponse('Endpoint not found', 404);

  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message, 500);
  }
}
