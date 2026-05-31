'use client'

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ vendorCode: '', vendorName: '' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load vendors', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditVendor(null);
    setForm({ vendorCode: '', vendorName: '' });
    setOpen(true);
  };

  const openEdit = (v) => {
    setEditVendor(v);
    setForm({ vendorCode: String(v.vendorCode), vendorName: v.vendorName });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editVendor) {
        res = await fetch(`/api/vendors/${editVendor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorName: form.vendorName }),
        });
      } else {
        res = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorCode: parseInt(form.vendorCode, 10), vendorName: form.vendorName }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Success', description: editVendor ? 'Vendor updated' : 'Vendor created' });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/vendors/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Vendor removed' });
      setDeleteId(null);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">Manage your fabric vendors</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> New Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Code</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-gray-500">Loading...</TableCell></TableRow>
              ) : vendors.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-gray-500">No vendors yet</TableCell></TableRow>
              ) : (
                vendors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono">{String(v.vendorCode).padStart(3, '0')}</TableCell>
                    <TableCell className="font-medium">{v.vendorName}</TableCell>
                    <TableCell className="text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(v.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
              <DialogTitle>{editVendor ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
              <DialogDescription>
                {editVendor ? 'Update the vendor name.' : 'Vendor code must be unique (e.g., 23).'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vendorCode">Vendor Code</Label>
                <Input id="vendorCode" type="number" value={form.vendorCode} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} disabled={!!editVendor} required min="1" max="999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input id="vendorName" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editVendor ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>This will soft-delete the vendor. You can re-add later. Continue?</AlertDialogDescription>
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
