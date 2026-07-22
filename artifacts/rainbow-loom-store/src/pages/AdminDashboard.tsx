import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  useGetOrders,
  useGetProducts,
  useUpdateProductColors,
  useHoldOrder,
  useUnholdOrder,
  useStartOrder,
  useUpdateGlobalColor,
  useUpdateProductAvailable,
  getGetOrdersQueryKey,
  getGetProductsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, ShoppingBag, Palette, Package, Clock, PauseCircle, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', green: '#22c55e', blue: '#3b82f6',
  purple: '#a855f7', pink: '#ec4899', black: '#1f2937'
};

const ALL_COLORS = ['red', 'orange', 'green', 'blue', 'purple', 'pink', 'black'];

const PATTERN_LABELS: Record<string, string> = {
  regular: 'Regular',
  dragon_scale: 'Dragon Scale',
  fish_scale: 'Fish Scale',
  double_fish_scale: 'Double Fish Scale',
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-yellow-100 text-yellow-700' },
  on_hold:     { label: 'On Hold',     className: 'bg-orange-100 text-orange-700' },
  in_progress: { label: 'In Progress', className: 'bg-teal-100 text-teal-700' },
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-700' },
};

type TabId = 'orders' | 'colors' | 'products';

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
  const holdOrder = useHoldOrder();
  const unholdOrder = useUnholdOrder();
  const startOrder = useStartOrder();
  const updateGlobalColor = useUpdateGlobalColor();
  const updateProductAvailable = useUpdateProductAvailable();

  const [activeTab, setActiveTab] = useState<TabId>('orders');

  // Start-making modal state
  const [startModalOrderId, setStartModalOrderId] = useState<string | null>(null);
  const [timeDays, setTimeDays] = useState(0);
  const [timeHours, setTimeHours] = useState(0);
  const [timeMinutes, setTimeMinutes] = useState(30);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setLocation('/admin');
  };

  const invalidateOrders = () => queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });

  const handleHold = (orderId: string) => {
    holdOrder.mutate({ orderId }, { onSuccess: invalidateOrders });
  };

  const handleUnhold = (orderId: string) => {
    unholdOrder.mutate({ orderId }, { onSuccess: invalidateOrders });
  };

  const handleStartOpen = (orderId: string) => {
    setTimeDays(0);
    setTimeHours(0);
    setTimeMinutes(30);
    setStartModalOrderId(orderId);
  };

  const handleStartConfirm = () => {
    if (!startModalOrderId) return;
    startOrder.mutate(
      {
        orderId: startModalOrderId,
        data: { days: timeDays, hours: timeHours, minutes: timeMinutes },
      },
      {
        onSuccess: () => {
          invalidateOrders();
          setStartModalOrderId(null);
        },
      }
    );
  };

  const toggleGlobalColor = (color: string, currentAvailable: boolean) => {
    updateGlobalColor.mutate(
      { data: { color: color as any, available: !currentAvailable } },
      { onSuccess: invalidateProducts }
    );
  };

  const toggleProductAvailable = (productId: string, currentAvailable: boolean) => {
    updateProductAvailable.mutate(
      { productId, data: { available: !currentAvailable } },
      { onSuccess: invalidateProducts }
    );
  };

  const toggleProductColor = (productId: string, color: string, currentAvailable: boolean) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    const updatedColors = product.colors.map(c =>
      c.color === color ? { ...c, available: !currentAvailable } : c
    );
    updateColors.mutate(
      { productId, data: { colors: updatedColors } },
      { onSuccess: invalidateProducts }
    );
  };

  // Derive global color availability from products data
  const globalColorAvailability: Record<string, boolean> = {};
  ALL_COLORS.forEach(color => {
    if (!products || products.length === 0) {
      globalColorAvailability[color] = true;
    } else {
      // color is "globally available" if it's available in at least one product
      globalColorAvailability[color] = products.some(p =>
        p.colors.some(c => c.color === color && c.available)
      );
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-gray-800 mb-1">Admin Dashboard</h1>
          <p className="text-gray-400 font-bold">Manage orders, colors, and products</p>
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
      <div className="flex gap-3 mb-8 flex-wrap">
        {([
          { id: 'orders',   icon: ShoppingBag, label: 'Orders',       active: 'bg-pink-500',  hover: 'hover:border-pink-200' },
          { id: 'colors',   icon: Palette,     label: 'Color Stock',  active: 'bg-teal-500',  hover: 'hover:border-teal-200' },
          { id: 'products', icon: Package,      label: 'Products',     active: 'bg-purple-500',hover: 'hover:border-purple-200' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
              activeTab === tab.id
                ? `${tab.active} text-white shadow-sm`
                : `bg-white text-gray-600 border-2 border-gray-100 ${tab.hover}`
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ── */}
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
            <div className="divide-y divide-gray-50">
              {[...orders].reverse().map(order => {
                const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE['pending'];
                return (
                  <div key={order.id} className="p-6 hover:bg-gray-50/60 transition-colors">
                    <div className="flex flex-wrap items-start gap-4 justify-between">
                      {/* Left: order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="font-display text-2xl text-pink-500">{order.orderNumber}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="font-bold text-gray-800 mb-0.5">{order.customerName}</p>
                        <p className="text-gray-400 text-sm mb-2">{order.customerEmail}</p>
                        <div className="flex flex-col gap-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="flex gap-1">
                                {item.colors.map((c, ci) => (
                                  <div key={ci} className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: COLOR_MAP[c] || c }} />
                                ))}
                              </div>
                              <span className="font-semibold">{item.productName}</span>
                              <span className="text-gray-400">({PATTERN_LABELS[item.pattern] ?? item.pattern})</span>
                            </div>
                          ))}
                        </div>
                        {order.estimatedCompletion && (
                          <div className="flex items-center gap-1.5 mt-2 text-teal-600 text-sm font-semibold">
                            <Clock className="w-4 h-4" />
                            Est. {order.estimatedCompletion}
                          </div>
                        )}
                        <p className="font-bold text-teal-600 text-lg mt-2">${order.total}</p>
                        <p className="text-gray-300 text-xs mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Right: action buttons */}
                      <div className="flex flex-col gap-2 items-end">
                        {order.status === 'on_hold' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUnhold(order.id)}
                              disabled={unholdOrder.isPending}
                              className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold gap-1.5 flex items-center"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Unhold
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStartOpen(order.id)}
                              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold gap-1.5 flex items-center"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Start Making
                            </Button>
                          </>
                        ) : order.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleHold(order.id)}
                              disabled={holdOrder.isPending}
                              className="bg-orange-400 hover:bg-orange-500 text-white rounded-xl font-bold gap-1.5 flex items-center"
                            >
                              <PauseCircle className="w-4 h-4" />
                              Put on Hold
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStartOpen(order.id)}
                              className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold gap-1.5 flex items-center"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Start Making
                            </Button>
                          </>
                        ) : order.status === 'in_progress' ? (
                          <span className="text-teal-500 text-sm font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Making it!
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── COLOR STOCK TAB ── */}
      {activeTab === 'colors' && (
        <div>
          <div className="bg-white rounded-3xl shadow-sm border-2 border-teal-50 overflow-hidden mb-6">
            <div className="bg-teal-50 px-6 py-4 border-b border-teal-100">
              <h2 className="font-display text-2xl text-teal-700">Global Color Inventory</h2>
              <p className="text-teal-500 text-sm font-semibold mt-0.5">
                Turning a color OFF disables it for every product instantly
              </p>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ALL_COLORS.map(color => {
                const available = globalColorAvailability[color];
                return (
                  <div key={color} className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${available ? 'border-teal-100 bg-teal-50/30' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <div
                      className={`w-14 h-14 rounded-full border-4 shadow-inner transition-all ${available ? 'border-white' : 'border-gray-200 grayscale'}`}
                      style={{ backgroundColor: COLOR_MAP[color] }}
                    />
                    <span className="font-bold capitalize text-gray-700 text-sm">{color}</span>
                    <button
                      onClick={() => toggleGlobalColor(color, available)}
                      disabled={updateGlobalColor.isPending}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${available ? 'bg-teal-400' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${available ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-bold ${available ? 'text-teal-500' : 'text-gray-400'}`}>
                      {available ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-product fine-grained color control */}
          <p className="text-gray-400 font-semibold text-sm mb-4 px-1">
            Fine-tune individual product colors below:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsLoading ? (
              <div className="col-span-3 flex justify-center py-16">
                <div className="animate-spin w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full" />
              </div>
            ) : products?.map(product => (
              <div key={product.id} className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden ${product.available ? 'border-teal-50' : 'border-gray-100 opacity-60'}`}>
                <div className="bg-teal-50 px-5 py-3 border-b border-teal-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl text-teal-700">{product.name}</h3>
                    <p className="text-teal-500 font-bold text-sm">${product.price}</p>
                  </div>
                  {!product.available && (
                    <span className="bg-gray-200 text-gray-500 text-xs font-bold px-2 py-1 rounded-full uppercase">Unavailable</span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  {product.colors.map(c => (
                    <div key={c.color} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: COLOR_MAP[c.color] || c.color }} />
                        <span className="font-bold capitalize text-gray-700 text-sm">{c.color}</span>
                      </div>
                      <button
                        onClick={() => toggleProductColor(product.id, c.color, c.available)}
                        disabled={updateColors.isPending}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${c.available ? 'bg-teal-400' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${c.available ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsLoading ? (
            <div className="col-span-3 flex justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-purple-100 border-t-purple-500 rounded-full" />
            </div>
          ) : products?.map(product => (
            <div
              key={product.id}
              className={`bg-white rounded-3xl shadow-sm border-2 p-6 flex flex-col gap-4 transition-all ${
                product.available ? 'border-purple-100' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl text-gray-800">{product.name}</h3>
                  <p className="text-teal-500 font-bold">${product.price}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {product.available ? '✓ Available' : '✗ Unavailable'}
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                {product.available
                  ? 'Customers can order this item.'
                  : 'This item is hidden from customers.'}
              </p>
              <Button
                onClick={() => toggleProductAvailable(product.id, product.available)}
                disabled={updateProductAvailable.isPending}
                variant="outline"
                className={`rounded-xl font-bold border-2 gap-2 ${
                  product.available
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {product.available ? (
                  <><XCircle className="w-4 h-4" /> Mark Unavailable</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Mark Available</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Start Making Modal */}
      <Dialog open={!!startModalOrderId} onOpenChange={(open) => !open && setStartModalOrderId(null)}>
        <DialogContent className="sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-teal-500 text-center">How long will it take?</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Set an estimate — we'll email the customer!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-3 gap-4">
            {([
              { label: 'Days',    value: timeDays,    set: setTimeDays },
              { label: 'Hours',   value: timeHours,   set: setTimeHours },
              { label: 'Minutes', value: timeMinutes, set: setTimeMinutes },
            ] as const).map(field => (
              <div key={field.label} className="flex flex-col items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{field.label}</label>
                <Input
                  type="number"
                  min={0}
                  max={field.label === 'Days' ? 30 : 59}
                  value={field.value}
                  onChange={(e) => field.set(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-center text-2xl font-display py-6 rounded-2xl border-2 border-teal-100 focus-visible:ring-teal-400"
                />
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm -mt-2 mb-2">
            {[
              timeDays > 0    && `${timeDays}d`,
              timeHours > 0   && `${timeHours}h`,
              timeMinutes > 0 && `${timeMinutes}m`,
            ].filter(Boolean).join(' ') || 'Set a time above'}
          </p>
          <Button
            onClick={handleStartConfirm}
            disabled={startOrder.isPending || (timeDays === 0 && timeHours === 0 && timeMinutes === 0)}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-6 text-xl font-bold"
          >
            {startOrder.isPending ? 'Saving...' : '🎨 Start Making!'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
