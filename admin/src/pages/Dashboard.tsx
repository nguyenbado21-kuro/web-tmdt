import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';

interface Stats { products: number; orders: number; users: number; subscribers: number; revenue: number; }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, users: 0, subscribers: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.products.getAll(),
      adminApi.orders.getAll(),
      adminApi.users.getAll(),
      adminApi.subscribers.getAll(),
    ]).then(([p, o, u, s]) => {
      const revenue = (o.data ?? []).reduce((sum, order) => sum + order.totalPrice, 0);
      setStats({ products: p.data?.length ?? 0, orders: o.data?.length ?? 0, users: u.data?.length ?? 0, subscribers: s.data?.length ?? 0, revenue });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Products', value: stats.products, icon: '📦', color: 'bg-green-50 text-green-600', trend: '+12%' },
    { label: 'Total Orders', value: stats.orders, icon: '🛍️', color: 'bg-green-50 text-green-600', trend: '+8%' },
    { label: 'Total Users', value: stats.users, icon: '👥', color: 'bg-purple-50 text-purple-600', trend: '+5%' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(0)}`, icon: '💰', color: 'bg-amber-50 text-amber-600', trend: '+15%' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-32 animate-pulse border border-gray-100">
              <div className="bg-gray-200 rounded h-4 w-1/2 mb-3" />
              <div className="bg-gray-200 rounded h-8 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${c.color}`}>
                  {c.icon}
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{c.trend}</span>
              </div>
              <div className="text-2xl font-display font-bold text-gray-900">{c.value}</div>
              <div className="text-gray-400 text-sm mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', href: '/products', icon: '➕' },
            { label: 'View Orders', href: '/orders', icon: '📋' },
            { label: 'Manage Users', href: '/users', icon: '👤' },
            { label: 'Subscribers', href: '/subscribers', icon: '📧' },
          ].map((a) => (
            <a key={a.label} href={a.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-colors text-gray-600">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-medium text-center">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
