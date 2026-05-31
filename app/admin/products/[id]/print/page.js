'use client'

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import PrintableLabel, { LABEL_SIZES, FIXED_LABEL_HEIGHT_IN } from '@/components/printable-label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download, ArrowLeft, Settings2 } from 'lucide-react';
import Link from 'next/link';

export default function PrintProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sizeId, setSizeId] = useState('s6');
  const [customMode, setCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState('7');
  const labelRef = useRef(null);

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
      setProduct(d);
      setLoading(false);
    });
  }, [id]);

  const effectiveWidthIn = customMode ? Number(customWidth) || FIXED_LABEL_HEIGHT_IN * 2 : LABEL_SIZES[sizeId].widthIn;
  const effectiveHeightIn = FIXED_LABEL_HEIGHT_IN;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    if (!labelRef.current) return;
    const opt = {
      margin: 0,
      filename: `${product.productCode || 'label'}.pdf`,
      image: { type: 'png', quality: 1 },
      html2canvas: { scale: 4, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: {
        unit: 'in',
        format: [effectiveWidthIn, effectiveHeightIn],
        orientation: effectiveWidthIn > effectiveHeightIn ? 'landscape' : 'portrait',
      },
    };
    html2pdf().set(opt).from(labelRef.current).save();
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }
  if (!product || product.error) {
    return <div className="p-8 text-red-500">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Toolbar (hidden on print) */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={`/admin/products/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          </Link>
          <div className="font-mono font-semibold">{product.productCode}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!customMode ? (
            <>
              <span className="text-sm text-gray-600">Size:</span>
              <Select value={sizeId} onValueChange={setSizeId}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LABEL_SIZES).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setCustomMode(true)}>
                <Settings2 className="w-4 h-4 mr-1" /> Customize Size
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-white">
              <Label htmlFor="customWidth" className="text-sm whitespace-nowrap">Width (in):</Label>
              <Input
                id="customWidth"
                type="number"
                step="0.25"
                min="2"
                max="36"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-20 h-8"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">× 2 in (fixed)</span>
              <Button variant="ghost" size="sm" onClick={() => setCustomMode(false)}>Use Preset</Button>
            </div>
          )}
          <Button onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print</Button>
          <Button variant="outline" onClick={handleDownloadPDF}><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
        </div>
      </div>

      {/* Label canvas */}
      <div className="flex items-center justify-center py-12 print:py-0 print:block">
        <div ref={labelRef} className="print-area">
          <PrintableLabel
            product={product}
            sizeId={customMode ? undefined : sizeId}
            customWidthIn={customMode ? customWidth : null}
          />
        </div>
      </div>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: ${effectiveWidthIn}in ${effectiveHeightIn}in;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print-area {
            page-break-inside: avoid;
          }
          .label-root {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
