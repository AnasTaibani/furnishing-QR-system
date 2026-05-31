'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, ExternalLink, Printer, Upload } from 'lucide-react';
import { END_USE_MAP, getEndUseLabel } from '@/lib/enduse';
import { WASH_CARE_MAP } from '@/lib/washcare';
import { WashCareIcon } from '@/components/washcare-icons';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const { toast } = useToast();

  const load = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/products?search=${encodeURIComponent(q)}` : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Product removed' });
      setDeleteId(null);
      load(search);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage fabric products with QR &amp; barcodes</p>
        </div>
        <Link href="/admin/products/import">
          <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Import CSV</Button>
        </Link>
        <Link href="/admin/products/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Product</Button>
        </Link>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <form onSubmit={onSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search by code, price code, catalogue (RN/FN), or shade..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button type="submit" variant="outline">Search</Button>
            {search && <Button type="button" variant="ghost" onClick={() => { setSearch(''); load(''); }}>Clear</Button>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Products ({products.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Price Code</TableHead>
                <TableHead>Catalogue RN</TableHead>
                <TableHead>Catalogue FN</TableHead>
                <TableHead>End Use</TableHead>
                <TableHead>Wash Care</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead className="text-center">QR</TableHead>
                <TableHead className="text-center">Barcode</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center text-gray-500">Loading...</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-gray-500">No products found</TableCell></TableRow>
              ) : (
                products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-medium">{p.productCode}</TableCell>
                    <TableCell>{p.priceCode || '-'}</TableCell>
                    <TableCell className="text-sm">{p.catalogue?.catalogueRN || '-'}</TableCell>
                    <TableCell className="text-sm italic text-gray-700">{p.catalogue?.catalogueFN || '-'}</TableCell>
                    <TableCell>
                      {(() => {
                        const eu = Array.isArray(p.endUse) ? p.endUse : (p.endUse ? [p.endUse] : []);
                        if (eu.length === 0) return '-';
                        return eu.map(id => END_USE_MAP[id]?.label || id).join(', ');
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(p.washCare || []).slice(0, 4).map(id => (
                          WASH_CARE_MAP[id] ? (
                            <span key={id} title={WASH_CARE_MAP[id].label} className="w-5 h-5">
                              <WashCareIcon id={id} />
                            </span>
                          ) : null
                        ))}
                        {(p.washCare || []).length > 4 && (
                          <span className="text-xs text-gray-500">+{p.washCare.length - 4}</span>
                        )}
                        {(!p.washCare || p.washCare.length === 0) && <span className="text-gray-400 text-xs">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>₹{p.mrp}</TableCell>
                    <TableCell className="text-center">
                    <img
                      src={`/api/qr/${p.productCode}`}
                      alt="QR"
                      className="w-10 h-10 inline-block"
                    />
                  </TableCell>

                  <TableCell className="text-center">
                    <img
                      src={`/api/barcode/${p.productCode}`}
                      alt="BC"
                      className="h-8 inline-block"
                    />
                  </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Link href={`/admin/products/${p.id}/print`}>
                        <Button variant="ghost" size="sm" title="Print Label"><Printer className="w-4 h-4" /></Button>
                      </Link>
                      <Link href={`/p/${p.productCode}`} target="_blank">
                        <Button variant="ghost" size="sm" title="Public View"><ExternalLink className="w-4 h-4" /></Button>
                      </Link>
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="ghost" size="sm" title="Edit"><Pencil className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} title="Delete">
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>This will soft-delete the product. The public page will no longer be accessible. Continue?</AlertDialogDescription>
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
