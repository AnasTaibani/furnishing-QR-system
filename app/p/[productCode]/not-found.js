export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
        <div className="text-5xl mb-4">404</div>
        <div className="text-lg font-semibold text-gray-900 mb-2">Product Not Found</div>
        <p className="text-sm text-gray-500">This code does not exist or has been removed.</p>
      </div>
    </main>
  );
}
