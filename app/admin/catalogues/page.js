'use client'

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { generateCataloguePrefix } from '@/utils/productCode';

export default function CataloguesPage() {
  const [catalogues, setCatalogues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ vendorId: '', bookNumber: '', catalogueRN: '', catalogueFN: '' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, vRes] = await Promise.all([fetch('/api/catalogues'), fetch('/api/vendors')]);
      const cData = await cRes.json();
      const vData = await vRes.json();
      setCatalogues(Array.isArray(cData) ? cData : []);
      setVendors(Array.isArray(vData) ? vData : []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load catalogues', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEdit(null);
    setForm({ vendorId: '', bookNumber: '', catalogueRN: '', catalogueFN: '' });
    setOpen(true);
  };

  const openEdit = (c) => {
    setEdit(c);
    setForm({
      vendorId: c.vendorId,
      bookNumber: String(c.bookNumber),
      catalogueRN: c.catalogueRN || '',
      catalogueFN: c.catalogueFN || '',
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (edit) {
        res = await fetch(`/api/catalogues/${edit.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ catalogueRN: form.catalogueRN, catalogueFN: form.catalogueFN }),
        });
      } else {
        res = await fetch('/api/catalogues', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: form.vendorId,
            bookNumber: parseInt(form.bookNumber, 10),
            catalogueRN: form.catalogueRN,
            catalogueFN: form.catalogueFN,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Success', description: edit ? 'Catalogue updated' : 'Catalogue created' });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/catalogues/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Catalogue removed' });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Live preview of product code prefix derived from FN
  const fnPrefixPreview = form.catalogueFN ? generateCataloguePrefix(form.catalogueFN) : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalogues</h1>
          <p className="text-gray-500 mt-1">Manage catalogue books with Real Name (RN) and Fake Name (FN)</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Catalogue</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Catalogues</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book #</TableHead>
                <TableHead>Catalogue RN</TableHead>
                <TableHead>Catalogue FN</TableHead>
                <TableHead>Code Prefix</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Loading...</TableCell></TableRow>
              ) : catalogues.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No catalogues yet</TableCell></TableRow>
              ) : (
                catalogues.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{String(c.bookNumber).padStart(3, '0')}</TableCell>
                    <TableCell className="font-medium">{c.catalogueRN || '-'}</TableCell>
                    <TableCell className="text-gray-700 italic">{c.catalogueFN || '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{c.catalogueFN ? generateCataloguePrefix(c.catalogueFN) : '-'}</TableCell>
                    <TableCell>{c.vendor?.vendorName || '-'}</TableCell>
                    <TableCell className="text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{edit ? 'Edit Catalogue' : 'New Catalogue'}</DialogTitle>
              <DialogDescription>
                {edit
                  ? 'Update the Real Name (RN) and Fake Name (FN). Note: changing FN does NOT regenerate existing product codes.'
                  : 'Book number must be unique per vendor. Product codes are generated from Catalogue FN.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={form.vendorId} onValueChange={(val) => setForm({ ...form, vendorId: val })} disabled={!!edit}>
                  <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{String(v.vendorCode).padStart(3, '0')} - {v.vendorName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookNumber">Book Number</Label>
                <Input id="bookNumber" type="number" value={form.bookNumber} onChange={(e) => setForm({ ...form, bookNumber: e.target.value })} disabled={!!edit} required min="1" max="999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalogueRN">Catalogue RN (Real Name) *</Label>
                <Input id="catalogueRN" placeholder="e.g. Aurora Collection Volume 1" value={form.catalogueRN} onChange={(e) => setForm({ ...form, catalogueRN: e.target.value })} required />
                <p className="text-xs text-gray-500">Internal real catalogue name. Visible to admins and on labels.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalogueFN">Catalogue FN (Fake Name) *</Label>
                <Input id="catalogueFN" placeholder="e.g. Moonlight Series" value={form.catalogueFN} onChange={(e) => setForm({ ...form, catalogueFN: e.target.value })} required />
                <p className="text-xs text-gray-500">
                  Display/fake name used for product code prefix. Code prefix preview: <span className="font-mono font-semibold">{fnPrefixPreview}</span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{edit ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Catalogue</AlertDialogTitle>
            <AlertDialogDescription>This will soft-delete the catalogue. Continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
