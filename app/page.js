'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QrCode, Package, ShieldCheck } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-6">
          <QrCode className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Furnishing Catalogue QR System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-10">
          Manage vendors, catalogues, and products with auto-generated QR codes
          and barcodes. Each fabric gets a unique traceable code.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/admin/login">
            <Button size="lg" className="min-w-[160px]">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Admin Login
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-4xl">
          <div className="p-6 rounded-lg border bg-white text-left">
            <Package className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Smart Product Codes</h3>
            <p className="text-sm text-gray-600 mt-1">Auto VVV-BBB-PPP coding per vendor/book/page.</p>
          </div>
          <div className="p-6 rounded-lg border bg-white text-left">
            <QrCode className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">QR &amp; Barcodes</h3>
            <p className="text-sm text-gray-600 mt-1">Generated and stored locally for printing.</p>
          </div>
          <div className="p-6 rounded-lg border bg-white text-left">
            <ShieldCheck className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Public View, Private Data</h3>
            <p className="text-sm text-gray-600 mt-1">Customers see only code and MRP.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return <Home />;
}

export default App;
