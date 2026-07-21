import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetOrders, useGetProducts, useUpdateProductColors, getGetOrdersQueryKey, getGetProductsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, ShoppingBag, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', green: '#22c55e', blue: '#3b82f6',
  purple: '#a855f7', pink: '#ec4899', black: '#1f2937'
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) setLocation('/admin');
  }, [setLocation]);

  const { data: orders, isLoading: ordersLoading } = useGetOrders();
  const { data: products, isLoading: productsLoading } = useGetProducts();
  const updateColors = useUpdateProductColors();

  const [activeTab, setActiveTab] = useState<'orders' | 'colors'>('orders');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setLocation('/admin');
  };

  const toggleColor = (productId: string, color: string, currentAvailable: boolean) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    const updatedColors = product.colors.map(c =>
      c.color === color ? { ...c, available: !currentAvailable } : c
    );
    updateColors.mutate(
      { productId, data: { colors: updatedColors } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-gray-800 mb-1">Admin Dashboard</h1>
          <p className="text-gray-400 font-bold">Manage orders and color availability</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2 rounded-xl border-2 border-gray-200 font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('orders')}
          data-testid="tab-orders"
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
            activeTab === 'orders'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border-2 border-gray-100 hover:border-pink-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          Orders
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          data-testid="tab-colors"
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
            activeTab === 'colors'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border-2 border-gray-100 hover:border-teal-200'
          }`}
        >
          <Palette className="w-5 h-5" />
          Color Availability
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-50 overflow-hidden">
          <div className="p-6 border-b border-pink-50">
            <h2 className="font-display text-2xl text-gray-800">
              All Orders {orders && <span className="text-pink-400 text-xl">({orders.length})</span>}
            </h2>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-display text-2xl">No orders yet!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-pink-50 text-pink-700">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-sm">Order #</th>
                    <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-sm">Customer</th>
                    <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-sm">Items</th>
                    <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-sm">Total</th>
                    <th className="text-left px-6 py-4 font-bold uppercase tracking-wider text-sm">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...orders].reverse().map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-order-${order.id}`}>
                      <td className="px-6 py-4 font-display text-xl text-pink-500">{order.orderNumber}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{order.customerName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div
                                className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                                style={{ backgroundColor: COLOR_MAP[item.color] || item.color }}
                              />
                              <span className="font-semibold">{item.productName}</span>
                              <span className="text-gray-400 capitalize">({item.color})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-teal-600 text-xl">${order.total}</td>
                      <td className="px-6 py-4 text-gray-400 font-semibold text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Color Availability Tab */}
      {activeTab === 'colors' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsLoading ? (
            <div className="col-span-3 flex justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full" />
            </div>
          ) : products?.map(product => (
            <div key={product.id} className="bg-white rounded-3xl shadow-sm border-2 border-teal-50 overflow-hidden" data-testid={`card-product-${product.id}`}>
              <div className="bg-teal-50 px-6 py-4 border-b border-teal-100">
                <h3 className="font-display text-2xl text-teal-700">{product.name}</h3>
                <p className="text-teal-500 font-bold">${product.price}</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {product.colors.map(c => (
                  <div key={c.color} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: COLOR_MAP[c.color] || c.color }}
                      />
                      <span className="font-bold capitalize text-gray-700">{c.color}</span>
                    </div>
                    <button
                      data-testid={`toggle-${product.id}-${c.color}`}
                      onClick={() => toggleColor(product.id, c.color, c.available)}
                      disabled={updateColors.isPending}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
                        c.available ? 'bg-teal-400' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                          c.available ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
