'use client'

import { useState, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const CSV_HEADERS = [
  'vendorCode',
  'vendorName',
  'bookNumber',
  'catalogueRN',
  'catalogueFN',
  'pageNumber',
  'priceCode',
  'endUse',
  'washCare',
  'mrp',
  'purchaseRateCL',
  'purchaseRateRL',
  'composition',
  'gsm',
  'width',
  'martindale',
  'repeat',
  'shade',
  'hsnCode',
  'remarks',
];

const SAMPLE_ROWS = [
  ['23', 'Elegance Furnishings Pvt Ltd', '2', 'Velvet Touch Volume 1', 'Moonlight Series', '1', 'PC-101', 'sofas|cushions', 'wash_40|no_bleach|hang_dry|iron_2_dots', '1499', '750', '820', '100% Polyester', '320', '140cm', '40000', '47', 'Beige', '5407', 'Sample row 1'],
  ['23', 'Elegance Furnishings Pvt Ltd', '2', 'Velvet Touch Volume 1', 'Moonlight Series', '2', 'PC-102', 'curtains', 'wash_40|no_tumble|hang_dry|dry_clean', '1799', '900', '975', '85% Polyester 15% Linen', '280', '280cm', '30000', '58', 'Cream', '5407', 'Sample row 2'],
  ['25', 'Modern Fabrics Co', '1', 'Modern Weaves Collection', 'Aurora Lite', '1', 'MW-001', 'blinds|curtains', 'no_bleach|no_tumble|hang_dry|dry_clean', '2299', '1100', '1200', '100% Polyester', '340', '150cm', '50000', '52', 'Charcoal', '5407', 'Sample row 3'],
];

function downloadSampleCSV() {
  const csv = [CSV_HEADERS.join(','), ...SAMPLE_ROWS.map(r => r.map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'furnishing-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportProductsPage() {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const { toast } = useToast();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setParseError(null);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors && res.errors.length > 0) {
          setParseError(res.errors[0].message);
          return;
        }
        const headers = res.meta.fields || [];
        const required = ['vendorCode', 'vendorName', 'bookNumber', 'pageNumber', 'mrp'];
        const missing = required.filter(h => !headers.includes(h));
        // Need either catalogueRN+catalogueFN OR legacy catalogueName
        const hasNewCat = headers.includes('catalogueRN') && headers.includes('catalogueFN');
        const hasLegacyCat = headers.includes('catalogueName');
        if (!hasNewCat && !hasLegacyCat) {
          missing.push('catalogueRN', 'catalogueFN');
        }
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(', ')}`);
          return;
        }
        setParsedRows(res.data);
      },
      error: (err) => {
        setParseError(err.message);
      },
    });
  };

  const submit = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      toast({ title: 'Import complete', description: `${data.productsCreated} products created, ${data.productsSkipped} skipped.` });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsedRows(null);
    setParseError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import Products</h1>
          <p className="text-gray-500 mt-1">Upload a CSV to create vendors, catalogues, and products in one go.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Upload CSV File</CardTitle>
              <CardDescription>Required columns: vendorCode, vendorName, bookNumber, catalogueName, pageNumber, mrp.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
                className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-900 file:text-white file:cursor-pointer hover:file:bg-gray-800"
              />
              {file && !parseError && parsedRows && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">{file.name}</span>
                  <span>— {parsedRows.length} rows parsed</span>
                </div>
              )}
              {parseError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Parse error</AlertTitle>
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {parsedRows && parsedRows.length > 0 && !result && (
            <Card>
              <CardHeader>
                <CardTitle>2. Preview ({Math.min(parsedRows.length, 5)} of {parsedRows.length} rows)</CardTitle>
                <CardDescription>Verify the data, then click Import.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="text-xs w-full border">
                  <thead>
                    <tr className="bg-gray-50">
                      {['vendorCode', 'vendorName', 'bookNumber', 'catalogueRN', 'catalogueFN', 'pageNumber', 'priceCode', 'endUse', 'washCare', 'mrp', 'shade'].map(h => (
                        <th key={h} className="border px-2 py-1 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((r, idx) => (
                      <tr key={idx} className="odd:bg-white even:bg-gray-50">
                        {['vendorCode', 'vendorName', 'bookNumber', 'catalogueName', 'pageNumber', 'priceCode', 'endUse', 'washCare', 'mrp', 'shade'].map(h => (
                          <td key={h} className="border px-2 py-1">{r[h] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={reset}>Cancel</Button>
                  <Button onClick={submit} disabled={submitting}>
                    {submitting ? 'Importing...' : `Import ${parsedRows.length} rows`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Import Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Stat label="Vendors created" value={result.vendorsCreated} />
                  <Stat label="Catalogues created" value={result.cataloguesCreated} />
                  <Stat label="Products created" value={result.productsCreated} valueClass="text-green-600" />
                  <Stat label="Skipped (duplicates)" value={result.productsSkipped} valueClass="text-amber-600" />
                </div>
                {result.errors && result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle>{result.errors.length} row errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 text-xs mt-1 space-y-0.5">
                        {result.errors.slice(0, 10).map((e, i) => (
                          <li key={i}>Row {e.row}: {e.error}</li>
                        ))}
                        {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={reset}>Import Another</Button>
                  <Link href="/admin/products"><Button>View Products</Button></Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template</CardTitle>
              <CardDescription>Download a sample CSV with example rows.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={downloadSampleCSV}>
                <Download className="w-4 h-4 mr-2" /> Download Sample
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> CSV Format</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div>
                <div className="font-semibold mb-1">Required:</div>
                <code className="block bg-gray-50 p-2 rounded text-[11px] leading-relaxed">
                  vendorCode, vendorName, bookNumber, catalogueName, pageNumber, mrp
                </code>
              </div>
              <div>
                <div className="font-semibold mb-1">Optional:</div>
                <code className="block bg-gray-50 p-2 rounded text-[11px] leading-relaxed">
                  priceCode, endUse, washCare, purchaseRateCL, purchaseRateRL, composition, gsm, width, martindale, repeat, shade, hsnCode, remarks
                </code>
              </div>
              <div>
                <div className="font-semibold mb-1">Multi-value fields:</div>
                <p>Use <code className="bg-gray-100 px-1 rounded">|</code> to separate (e.g. <code className="bg-gray-100 px-1 rounded">sofas|cushions</code>).</p>
              </div>
              <div>
                <div className="font-semibold mb-1">Valid endUse:</div>
                <p className="text-gray-600">sofas, curtains, blinds, cushions</p>
              </div>
              <div>
                <div className="font-semibold mb-1">Valid washCare:</div>
                <p className="text-gray-600 break-words">wash_40, no_bleach, no_tumble, hang_dry, dry_clean, iron_2_dots</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-gray-500">Vendors and catalogues are auto-created if they don't exist. Duplicate page numbers within the same catalogue are skipped.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass = '' }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value ?? 0}</div>
    </div>
  );
}
