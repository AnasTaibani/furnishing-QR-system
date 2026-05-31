'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { END_USES } from '@/lib/enduse';
import { WASH_CARE_OPTIONS } from '@/lib/washcare';
import { generateCataloguePrefix, zeroPad } from '@/utils/productCode';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [catalogues, setCatalogues] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    catalogueId: '',
    pageNumber: '',
    priceCode: '',
    endUse: [],
    washCare: [],
    mrp: '',
    purchaseRateCL: '',
    purchaseRateRL: '',
    composition: '',
    gsm: '',
    width: '',
    martindale: '',
    repeat: '',
    shade: '',
    hsnCode: '',
    remarks: '',
  });

  useEffect(() => {
    fetch('/api/catalogues').then(r => r.json()).then(d => setCatalogues(Array.isArray(d) ? d : []));
  }, []);

  // Live preview of product code
  const selectedCatalogue = catalogues.find(c => c.id === form.catalogueId);
  const codePreview = useMemo(() => {
    if (!selectedCatalogue || !form.pageNumber) return '—';
    // Prefix is generated from catalogueFN (Fake Name)
    const prefix = generateCataloguePrefix(selectedCatalogue.catalogueFN || selectedCatalogue.catalogueRN || '');
    const v = zeroPad(selectedCatalogue.vendor?.vendorCode || 0);
    const b = zeroPad(selectedCatalogue.bookNumber);
    const p = zeroPad(parseInt(form.pageNumber, 10) || 0);
    return `${prefix}${v}${b}${p}`;
  }, [selectedCatalogue, form.pageNumber]);

  const toggleWash = (id) => {
    setForm(prev => ({
      ...prev,
      washCare: prev.washCare.includes(id)
        ? prev.washCare.filter(x => x !== id)
        : [...prev.washCare, id],
    }));
  };

  const toggleEndUse = (id) => {
    setForm(prev => ({
      ...prev,
      endUse: prev.endUse.includes(id)
        ? prev.endUse.filter(x => x !== id)
        : [...prev.endUse, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pageNumber: parseInt(form.pageNumber, 10),
          mrp: parseFloat(form.mrp),
          purchaseRateCL: form.purchaseRateCL ? parseFloat(form.purchaseRateCL) : null,
          purchaseRateRL: form.purchaseRateRL ? parseFloat(form.purchaseRateRL) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Created', description: `Product ${data.productCode} created` });
      router.push(`/admin/products/${data.id}`);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Product</h1>
          <p className="text-gray-500 mt-1">QR code and barcode are auto-generated.</p>
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Catalogue *</Label>
                <Select value={form.catalogueId} onValueChange={(v) => setForm({ ...form, catalogueId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select catalogue" /></SelectTrigger>
                  <SelectContent>
                    {catalogues.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {String(c.bookNumber).padStart(3, '0')} — RN: {c.catalogueRN || '—'} / FN: {c.catalogueFN || '—'} ({c.vendor?.vendorName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageNumber">Page Number *</Label>
                <Input id="pageNumber" type="number" min="1" max="999" required value={form.pageNumber} onChange={(e) => setForm({ ...form, pageNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCode">Price Code</Label>
                <Input id="priceCode" placeholder="e.g. PC-101" value={form.priceCode} onChange={(e) => setForm({ ...form, priceCode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shade">Shade</Label>
                <Input id="shade" value={form.shade} onChange={(e) => setForm({ ...form, shade: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Use (multiple)</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-2">
                  {END_USES.map(e => (
                    <label key={e.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 rounded px-2 py-1">
                      <Checkbox checked={form.endUse.includes(e.id)} onCheckedChange={() => toggleEndUse(e.id)} />
                      <span>{e.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (₹) *</Label>
                <Input id="mrp" type="number" step="0.01" required value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseRateCL">Purchase Rate CL (₹)</Label>
                <Input id="purchaseRateCL" type="number" step="0.01" min="0" placeholder="Cut Length" value={form.purchaseRateCL} onChange={(e) => setForm({ ...form, purchaseRateCL: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseRateRL">Purchase Rate RL (₹)</Label>
                <Input id="purchaseRateRL" type="number" step="0.01" min="0" placeholder="Roll Length" value={form.purchaseRateRL} onChange={(e) => setForm({ ...form, purchaseRateRL: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="composition">Composition</Label>
                <Input id="composition" placeholder="e.g. 100% Polyester" value={form.composition} onChange={(e) => setForm({ ...form, composition: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gsm">GSM</Label>
                <Input id="gsm" placeholder="e.g. 320" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input id="width" placeholder="e.g. 140cm" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="martindale">Martindale</Label>
                <Input id="martindale" placeholder="e.g. 40000" value={form.martindale} onChange={(e) => setForm({ ...form, martindale: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat">Repeat (cm)</Label>
                <Input id="repeat" placeholder="e.g. 47" value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input id="hsnCode" placeholder="e.g. 5407" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Wash Care Instructions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {WASH_CARE_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <Checkbox checked={form.washCare.includes(opt.id)} onCheckedChange={() => toggleWash(opt.id)} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader><CardTitle>Code Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Auto-generated</div>
              <div className="font-mono text-2xl font-bold tracking-wider bg-gray-50 border rounded-md p-4 text-center">
                {codePreview}
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Format: [Prefix][Vendor][Book][Page]<br/>
                Prefix is the first 3 letters of the catalogue name.
              </p>
              <div className="mt-6 flex gap-2">
                <Link href="/admin/products" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">Cancel</Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
