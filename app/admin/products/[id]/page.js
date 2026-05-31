'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ExternalLink, Printer } from 'lucide-react';
import { END_USES } from '@/lib/enduse';
import { WASH_CARE_OPTIONS } from '@/lib/washcare';

export default function EditProductPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    priceCode: '', endUse: [], washCare: [], mrp: '', purchaseRateCL: '', purchaseRateRL: '',
    composition: '', gsm: '', width: '', martindale: '', repeat: '', shade: '', hsnCode: '', remarks: '',
  });

  const loadProduct = async () => {
    const res = await fetch(`/api/products/${id}`);
    const d = await res.json();
    setProduct(d);
    setForm({
      priceCode: d.priceCode ?? '',
      endUse: Array.isArray(d.endUse) ? d.endUse : (d.endUse ? [d.endUse] : []),
      washCare: Array.isArray(d.washCare) ? d.washCare : [],
      mrp: d.mrp ?? '',
      purchaseRateCL: d.purchaseRateCL ?? '',
      purchaseRateRL: d.purchaseRateRL ?? '',
      composition: d.composition ?? '',
      gsm: d.gsm ?? '',
      width: d.width ?? '',
      martindale: d.martindale ?? '',
      repeat: d.repeat ?? '',
      shade: d.shade ?? '',
      hsnCode: d.hsnCode ?? '',
      remarks: d.remarks ?? '',
    });
    setLoading(false);
  };

  useEffect(() => { loadProduct(); }, [id]);

  const toggleWash = (wid) => {
    setForm(prev => ({
      ...prev,
      washCare: prev.washCare.includes(wid)
        ? prev.washCare.filter(x => x !== wid)
        : [...prev.washCare, wid],
    }));
  };

  const toggleEndUse = (eid) => {
    setForm(prev => ({
      ...prev,
      endUse: prev.endUse.includes(eid)
        ? prev.endUse.filter(x => x !== eid)
        : [...prev.endUse, eid],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mrp: parseFloat(form.mrp),
          purchaseRateCL: form.purchaseRateCL === '' || form.purchaseRateCL === null ? null : parseFloat(form.purchaseRateCL),
          purchaseRateRL: form.purchaseRateRL === '' || form.purchaseRateRL === null ? null : parseFloat(form.purchaseRateRL),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Updated', description: 'Product saved' });
      await loadProduct();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!product || product.error) return <div className="text-red-500">Product not found</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/admin/products"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 font-mono">{product.productCode}</h1>
          <p className="text-gray-500 mt-1 truncate">
            {product.vendor?.vendorName}
            {' / RN: '}<span className="font-medium">{product.catalogue?.catalogueRN || '—'}</span>
            {' / FN: '}<span className="italic">{product.catalogue?.catalogueFN || '—'}</span>
            {' / Page '}{product.pageNumber}
          </p>
        </div>
        <Link href={`/admin/products/${id}/print`}>
          <Button><Printer className="w-4 h-4 mr-2" /> Print Label</Button>
        </Link>
        <Link href={`/p/${product.productCode}`} target="_blank">
          <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" /> Public View</Button>
        </Link>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceCode">Price Code</Label>
                <Input id="priceCode" value={form.priceCode} onChange={(e) => setForm({ ...form, priceCode: e.target.value })} />
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
                <Input id="composition" value={form.composition} onChange={(e) => setForm({ ...form, composition: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gsm">GSM</Label>
                <Input id="gsm" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input id="width" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="martindale">Martindale</Label>
                <Input id="martindale" value={form.martindale} onChange={(e) => setForm({ ...form, martindale: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat">Repeat (cm)</Label>
                <Input id="repeat" value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input id="hsnCode" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
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

          <Card>
            <CardHeader><CardTitle>Change History</CardTitle></CardHeader>
            <CardContent>
              {!product.history || product.history.length === 0 ? (
                <p className="text-gray-500 text-sm">No changes recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {product.history.map(h => (
                    <li key={h.id} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                      <div className="font-medium text-gray-900">{h.fieldName}</div>
                      <div className="text-gray-600">
                        <span className="line-through text-red-500">{h.oldValue || '∅'}</span>
                        {' → '}
                        <span className="text-green-600">{h.newValue || '∅'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(h.changedAt).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>QR Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              {product.qrCodePath ? (
                <>
                  <img src={product.qrCodePath} alt="QR" className="w-48 h-48" />
                  <a href={product.qrCodePath} download className="text-xs text-blue-600 mt-2">Download</a>
                </>
              ) : <p className="text-gray-500 text-sm">Not generated</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Barcode</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              {product.barcodePath ? (
                <>
                  <img src={product.barcodePath} alt="Barcode" className="w-full max-w-xs" />
                  <a href={product.barcodePath} download className="text-xs text-blue-600 mt-2">Download</a>
                </>
              ) : <p className="text-gray-500 text-sm">Not generated</p>}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
