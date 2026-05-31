# Furnishing Catalogue QR System — PRD

## Goal
Production-structured MVP to manage vendors, catalogue books, and fabric products with auto-generated QR + barcodes per product. Customers scanning a QR see only the product code and MRP; admins manage everything via a protected dashboard.

## Stack
- Next.js 14 (App Router)
- MongoDB (driver: `mongodb`)
- Tailwind + shadcn/ui
- `qrcode` + `bwip-js` for image generation (stored on disk)

## Domain Model
- Vendor: { id, vendorCode (int, unique), vendorName, deletedAt, createdAt, updatedAt }
- Catalogue: { id, vendorId, bookNumber (int), catalogueName, deletedAt, createdAt, updatedAt }
- Product: { id, catalogueId, pageNumber, productCode (VVV-BBB-PPP), mrp, purchaseRate, composition, gsm, width, martindale, shade, remarks, qrCodePath, barcodePath, deletedAt, createdAt, updatedAt }
- ProductHistory: { id, productId, fieldName, oldValue, newValue, changedAt }

## Auth
Hardcoded admin (`admin` / `admin123`). httpOnly cookie `admin-token` set on login. All non-public endpoints require it.

## Routes
- Public: `/` (landing), `/p/[productCode]` (public minimal view)
- Admin: `/admin/login`, `/admin/dashboard`, `/admin/vendors`, `/admin/catalogues`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`
- API (monolithic `/api/[[...path]]`):
  - POST `/api/auth/login`
  - CRUD: `/api/vendors`, `/api/catalogues`, `/api/products`
  - Public: GET `/api/public/products/:code` (returns ONLY {productCode, mrp})

## File Storage
- QR PNGs: `/app/public/qrcodes/{code}.png` → served at `/qrcodes/{code}.png`
- Barcode PNGs: `/app/public/barcodes/{code}.png` → served at `/barcodes/{code}.png`

## Seed
1 vendor (code 023 — "Elegance Furnishings Pvt Ltd"), 1 catalogue (book 001 — "Aurora Collection - Volume 1"), 23 products with varied shades, GSM, width, martindale, MRP, etc.
Run: `cd /app && node scripts/seed.js` (idempotent)

## Implemented Features
- Vendor/Catalogue/Product CRUD with soft delete
- Auto product code VVV-BBB-PPP
- QR + Barcode auto-generated on product create, stored locally
- Product change history tracking (only changed fields recorded)
- Search by code or shade
- Public minimalist view (code + MRP only) with 404 for missing/deleted
- Admin dashboard with stats
- Toast notifications & confirmation dialogs

## Open / Future
- Bulk import (CSV)
- Print-friendly QR/barcode sheets
- Vendor logo/branding on public page

## Enhancement Round 4 (completed) — Purchase Rate Split
- **Removed** single `purchaseRate` field.
- **Added two new admin-only fields**:
  - `purchaseRateCL` — Cut Length purchase rate (Decimal)
  - `purchaseRateRL` — Roll Length purchase rate (Decimal)
- Updated everywhere: POST/PUT product API, history tracking (both fields tracked independently), CSV import (`purchaseRateCL`, `purchaseRateRL` columns), product create/edit forms (two labeled inputs with CL/RL placeholders), seed.js.
- **Migration**: 29 existing products migrated — `purchaseRate` → `purchaseRateCL` (verbatim), `purchaseRateRL` = round(CL × 1.08). Old field removed via `$unset`.
- **Public security verified (critical)**: `/api/public/products/:code` still returns EXACTLY `{productCode, mrp}`. Neither `purchaseRateCL` nor `purchaseRateRL` are ever exposed publicly.
- **Print label**: does NOT show either purchase rate (internal pricing only).
- 10/10 backend tests passed.

## Enhancement Round 3 (completed)
- **endUse → multi-select array**: Product `endUse` is now `string[]`. UI uses checkbox group, label shows multiple icons in a row (matches Ador Doodlage reference). Backward-compatible POST accepts string (auto-wrapped to array).
- **`repeat` field**: New numeric/string field (e.g. "47" cm). Rendered on label with horizontal arrow indicator. Tracked in history.
- **Printable label v2** — visually matches Ador-style reference:
  - Centered Product Code in header; "Wash Care" italic label on right.
  - Repeat | End Use (icons) + Martindale | Composition | GSM + HSN | Width | Wash Care icons (with labels) | QR.
  - All cells separated by vertical 0.5px black borders.
  - 4 size presets: Compact 4×1.5", Standard 6×1.75", Wide 8×2", Spine 11×1.75".
- **CSV bulk import** (`/admin/products/import`):
  - Drag-and-drop or browse CSV upload, parsed client-side with PapaParse.
  - Preview first 5 rows before commit.
  - POST /api/products/import auto-creates missing vendors & catalogues by (vendorCode) and (vendorId+bookNumber).
  - Auto-generates productCodes in new format and QR/Barcode files for every imported row.
  - Skips duplicate (catalogueId + pageNumber) entries.
  - Pipe-separated multi-values for endUse and washCare (e.g. `sofas|cushions`, `wash_40|no_bleach|hang_dry`).
  - Returns counts of created/skipped/errors plus per-row error report.
  - Downloadable sample CSV template from the UI.
- Imports endpoint added to monolithic API router: `POST /api/products/import` (auth required).
- **New Product Code format**: `[PREFIX][VVV][BBB][PPP]` (12 chars, no dashes). Prefix = first 3 A-Z letters of catalogue name. Example: `AUR023001023`.
- **New Product fields**: `priceCode` (manual SKU), `endUse` (sofas|curtains|blinds|cushions), `washCare` (array), `hsnCode`.
- **Wash Care icons** (inline SVG, monochrome, ISO-style): `components/washcare-icons.jsx` — wash_40, no_bleach, no_tumble, hang_dry, dry_clean, iron_2_dots.
- **End Use icons**: `components/enduse-icons.jsx`.
- **Print Label** route: `/admin/products/[id]/print` with `Printer` + `Download PDF` buttons (html2pdf.js).
  - Multiple size presets: Compact 3×2", Standard 4×2.5", Large 5×3", Spine Strip 10×2".
  - Furnishing-industry sticker style: 3-row layout (Price Code/Product Code/QR → tech specs → wash care + barcode).
  - `@media print` CSS hides toolbar/sidebar and sizes page exactly.
- **Migration script**: `scripts/migrate-products.js` — backfilled existing 23 products to new code format, added new fields with sane defaults, regenerated QR & barcode files.
- **Search**: extended to also match `priceCode`, `endUse` substring. Added `?endUse=` filter.
- **Product list table**: new columns (Price Code, End Use, Wash Care icons, QR preview, Barcode preview, Print button).
- **Public endpoint**: verified still returns ONLY `{productCode, mrp}`.
