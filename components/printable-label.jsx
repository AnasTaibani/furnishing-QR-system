'use client'

import React from 'react';
import { WASH_CARE_OPTIONS, WASH_CARE_MAP } from '@/lib/washcare';
import { END_USE_MAP } from '@/lib/enduse';
import { WashCareIcon } from '@/components/washcare-icons';
import { EndUseIcon } from '@/components/enduse-icons';

/**
 * Predefined print label sizes. All have height fixed at 2 inches.
 */
export const LABEL_SIZES = {
  s4: { id: 's4', label: '4 x 2 in', widthIn: 4, heightIn: 2 },
  s6: { id: 's6', label: '6 x 2 in', widthIn: 6, heightIn: 2 },
  s8: { id: 's8', label: '8 x 2 in', widthIn: 8, heightIn: 2 },
  s11: { id: 's11', label: '11 x 2 in', widthIn: 11, heightIn: 2 },
  s14: { id: 's14', label: '14 x 2 in', widthIn: 14, heightIn: 2 },
};

/** Fixed height for all labels in inches */
export const FIXED_LABEL_HEIGHT_IN = 2;

/**
 * Furnishing catalogue sticker label, modeled after Ador Doodlage reference.
 * Layout:
 *  TOP HEADER: centered "PRODUCT CODE"   |   "Wash Care" label   |  QR (full height of label)
 *  BODY: bordered cells
 *    Cell 1: Repeat (value + horizontal arrow indicator)
 *    Cell 2: End Use (multi icons) / Martindale below
 *    Cell 3: Composition
 *    Cell 4: GSM / HSN Code below
 *    Cell 5: Width
 *    Cell 6: Wash Care icons (each with label below)
 */
export default function PrintableLabel({ product, sizeId = 's6', customWidthIn = null }) {
  let size;
  if (customWidthIn && Number(customWidthIn) > 0) {
    size = { id: 'custom', label: `Custom (${customWidthIn} x ${FIXED_LABEL_HEIGHT_IN} in)`, widthIn: Number(customWidthIn), heightIn: FIXED_LABEL_HEIGHT_IN };
  } else {
    size = LABEL_SIZES[sizeId] || LABEL_SIZES.s6;
  }

  // endUse may be array (new) or string (legacy)
  const endUseRaw = product?.endUse;
  const endUseIds = Array.isArray(endUseRaw) ? endUseRaw : (endUseRaw ? [endUseRaw] : []);
  const washIds = Array.isArray(product?.washCare) ? product.washCare : [];

  // Show only selected wash care items
  const washToShow = WASH_CARE_OPTIONS.filter(w => washIds.includes(w.id));

  // Catalogue RN / FN — taken from populated product.catalogue (admin view) if present.
  const catRN = product?.catalogue?.catalogueRN;
  const catFN = product?.catalogue?.catalogueFN;
  const catalogueLine = catRN && catFN
    ? (catRN === catFN ? catRN : `${catRN}  (${catFN})`)
    : (catRN || catFN || '');

  return (
    <div
      className="label-root bg-white text-black font-sans flex flex-col"
      style={{
        width: `${size.widthIn}in`,
        height: `${size.heightIn}in`,
        boxSizing: 'border-box',
        padding: '0.05in',
        border: '0.5px solid #000',
      }}
    >
      {/* HEADER: Price Code (left) | Product Code (centered) + Catalogue RN/FN | Wash Care label (right) | QR floats over body */}
      <div className="flex items-center justify-between" style={{ height: '0.34in' }}>
        <div className="text-left pl-1" style={{ minWidth: '1.2in', fontSize: '8pt' }}>
          {product?.priceCode ? (
            <span><span style={{ fontStyle: 'italic', color: '#444' }}>Price Code: </span><span style={{ fontWeight: 700 }}>{product.priceCode}</span></span>
          ) : null}
        </div>
        <div className="flex-1 text-center leading-tight">
          <div style={{ fontSize: '10.5pt', fontWeight: 700, letterSpacing: '0.04em' }}>
            {product?.productCode || '—'}
          </div>
          {catalogueLine && (
            <div style={{ fontSize: '6.5pt', color: '#222', marginTop: '0.01in' }}>
              {catalogueLine}
            </div>
          )}
        </div>
        <div className="text-right pr-2" style={{ minWidth: '1in' }}>
          <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>Wash Care</span>
        </div>
        <div style={{ width: `${size.heightIn * 0.95}in` }} />
      </div>

      {/* BODY ROW (with QR overlaid on the right) */}
      <div className="relative flex-1 flex" style={{ borderTop: '0.5px solid #000' }}>
        {/* QR positioned absolutely on the right, spans body row */}
        <div
          className="absolute right-0 top-0 flex items-center justify-center"
          style={{
            height: '100%',
            width: `${size.heightIn * 0.95}in`,
            padding: '0.02in',
          }}
        >
          {product?.qrCodePath ? (
            <img
              src={`/api/qr/${product?.productCode}`}
              alt="QR" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <div className="w-full h-full border border-black/40 flex items-center justify-center text-[6pt]">QR</div>
          )}
        </div>

        {/* Spec cells row */}
        <div className="flex w-full" style={{ paddingRight: `${size.heightIn * 0.95}in` }}>
          {/* Repeat */}
          <Cell label="Repeat" width="0.85in">
            <div className="flex items-center gap-1" style={{ fontSize: '8pt' }}>
              <span>{product?.repeat ? `${product.repeat} cm` : '—'}</span>
              <ArrowH />
            </div>
          </Cell>

          {/* End Use + Martindale */}
          <Cell label="End Use" width="1in">
            <div className="flex items-center gap-0.5">
              {endUseIds.length === 0 && <span style={{ fontSize: '7pt' }} className="text-black/50">—</span>}
              {endUseIds.map(id => (
                <span key={id} style={{ width: '0.18in', height: '0.18in' }}>
                  <EndUseIcon id={id} />
                </span>
              ))}
            </div>
            <div style={{ fontSize: '7pt', marginTop: '0.02in' }}>
              <div style={{ fontSize: '6pt', color: '#444' }}>Martindale</div>
              <div style={{ fontSize: '8pt', fontWeight: 600 }}>{product?.martindale || '—'}</div>
            </div>
          </Cell>

          {/* Composition */}
          <Cell label="Composition" flex>
            <div style={{ fontSize: '8pt', fontWeight: 600 }}>{product?.composition || '—'}</div>
          </Cell>

          {/* GSM + HSN */}
          <Cell label="Gsm" width="0.7in">
            <div style={{ fontSize: '8pt', fontWeight: 600 }}>{product?.gsm || '—'}</div>
            <div style={{ fontSize: '6pt', color: '#444', marginTop: '0.02in' }}>HSN Code</div>
            <div style={{ fontSize: '7pt' }}>{product?.hsnCode || '—'}</div>
          </Cell>

          {/* Width */}
          <Cell label="Width" width="0.9in">
            <div style={{ fontSize: '8pt', fontWeight: 600 }}>{product?.width || '—'}</div>
          </Cell>

          {/* Wash care icons (right of specs, before QR) */}
          <div className="flex items-start" style={{ paddingTop: '0.04in' }}>
            {washToShow.length === 0 && (
              <span style={{ fontSize: '6pt' }} className="text-black/50 italic px-1">No care set</span>
            )}
            {washToShow.map(w => (
              <div key={w.id} className="flex flex-col items-center" style={{ width: '0.5in' }}>
                <div style={{ width: '0.22in', height: '0.22in' }}>
                  <WashCareIcon id={w.id} />
                </div>
                <div style={{ fontSize: '5.5pt', marginTop: '0.02in', textAlign: 'center', lineHeight: 1.1 }}>
                  {w.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, children, width, flex }) {
  const style = flex ? { flex: 1 } : { width };
  return (
    <div
      className="flex flex-col px-1"
      style={{
        ...style,
        borderRight: '0.5px solid #000',
        paddingTop: '0.04in',
        paddingBottom: '0.04in',
      }}
    >
      <div style={{ fontSize: '6.5pt', color: '#222', fontStyle: 'italic' }}>{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ArrowH() {
  return (
    <svg viewBox="0 0 32 8" width="22" height="6" stroke="black" strokeWidth="1.2" fill="none">
      <line x1="2" y1="4" x2="30" y2="4" />
      <polyline points="4,1 1,4 4,7" />
      <polyline points="28,1 31,4 28,7" />
    </svg>
  );
}
