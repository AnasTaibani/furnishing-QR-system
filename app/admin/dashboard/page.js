'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Package, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    vendors: 0,
    catalogues: 0,
    products: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [vendorsRes, cataloguesRes, productsRes] = await Promise.all([
        fetch('/api/vendors'),
        fetch('/api/catalogues'),
        fetch('/api/products')
      ]);

      const vendors = await vendorsRes.json();
      const catalogues = await cataloguesRes.json();
      const products = await productsRes.json();

      setStats({
        vendors: vendors.length,
        catalogues: catalogues.length,
        products: products.length,
        loading: false
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const statCards = [
    {
      title: 'Total Vendors',
      value: stats.vendors,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Catalogues',
      value: stats.catalogues,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Products',
      value: stats.products,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to Furnishing Catalogue Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/products/new" className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Add New Product</div>
              <div className="text-sm text-gray-500">Create a new product with QR and barcode</div>
            </a>
            <a href="/admin/vendors" className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Manage Vendors</div>
              <div className="text-sm text-gray-500">View and manage vendor information</div>
            </a>
            <a href="/admin/catalogues" className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Manage Catalogues</div>
              <div className="text-sm text-gray-500">View and manage catalogue books</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Database</span>
              <span className="font-medium text-gray-900">MongoDB</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
