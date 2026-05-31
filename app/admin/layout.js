'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Package,
  LogOut
} from 'lucide-react';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Vendors', href: '/admin/vendors' },
  { icon: BookOpen, label: 'Catalogues', href: '/admin/catalogues' },
  { icon: Package, label: 'Products', href: '/admin/products' }
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication by trying to access a protected endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/vendors');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    // Don't check auth on login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    checkAuth();
  }, [pathname, router]);

  const handleLogout = () => {
    document.cookie = 'admin-token=; Max-Age=0; path=/';
    router.push('/admin/login');
  };

  // Show login page
  if (pathname === '/admin/login') {
    return children;
  }

  // Print pages render without sidebar/navigation for clean printing
  if (pathname && pathname.includes('/print')) {
    return children;
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show admin layout
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800">Furnishing Admin</h1>
          </div>
          <nav className="px-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
