import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

async function fetchProduct(productCode) {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
  try {
    const res = await fetch(`${base}/api/public/products/${productCode}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function PublicProductPage({ params }) {
  const { productCode } = params;
  const product = await fetchProduct(productCode);

  if (!product) {
    notFound();
  }

  const formattedMrp = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.mrp);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
        {product.catalogueRN && (
          <>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Catalogue</div>
            <div className="text-base font-semibold text-gray-900">{product.catalogueRN}</div>
            {product.catalogueFN && product.catalogueFN !== product.catalogueRN && (
              <div className="text-sm italic text-gray-500 mt-0.5">({product.catalogueFN})</div>
            )}
            <div className="my-6 h-px bg-gray-100" />
          </>
        )}

        <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">Product Code</div>
        <div className="text-2xl font-mono font-semibold text-gray-900 tracking-wider">
          {product.productCode}
        </div>

        <div className="my-8 h-px bg-gray-100" />

        <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">MRP</div>
        <div className="text-4xl font-bold text-gray-900">
          {formattedMrp}
        </div>
      </div>
    </main>
  );
}
