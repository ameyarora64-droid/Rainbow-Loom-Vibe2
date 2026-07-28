import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

import {
  useGetOrders,
  useGetProducts,
  useUpdateProductColors,
  useHoldOrder,
  useUnholdOrder,
  useStartOrder,
  useCompleteOrder,
  useUpdateGlobalColor,
  useUpdateProductAvailable,
  useGetStoreStatus,
  useUpdateStoreStatus,
  getGetOrdersQueryKey,
  getGetProductsQueryKey,
  getGetStoreStatusQueryKey,
} from '@workspace/api-client-react';

import { useQueryClient } from '@tanstack/react-query';

import {
  LogOut,
  ShoppingBag,
  Palette,
  Package,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Store,
  Lock,
  CheckCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  black: '#1f2937',
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

type TabId = 'orders' | 'completed' | 'colors' | 'products';

function PetBadge({ petType }: { petType?: string | null }) {
  if (!petType) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ml-2 ${
      petType === 'dog' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
    }`}>
      {petType === 'dog' ? '🐕 Dog' : '🐱 Cat'}
    </span>
  );
}

function ColorDots({ colors }: { colors: string[] }) {
  return (
    <span className="inline-flex gap-1 items-center">
      {colors.map((c, i) => (
        <span
          key={i}
          className="w-4 h-4 rounded-full border border-black/10 shadow-sm inline-block"
          style={{ backgroundColor: COLOR_MAP[c] || c }}
          title={c}
        />
      ))}
    </span>
  );
}

function ToggleSlider({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-400 ${
        on ? 'bg-teal-400' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
          on ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) setLocation('/admin');
  }, [setLocation]);

  const { data: orders, isLoading: ordersLoading } = useGetOrders();
  const { data: products, isLoading: productsLoading } = useGetProducts();

  const updateColors         = useUpdateProductColors();
  const holdOrder            = useHoldOrder();
  const unholdOrder          = useUnholdOrder();
  const startOrder           = useStartOrder();
  const completeOrder        = useCompleteOrder();
  const updateGlobalColor    = useUpdateGlobalColor();
  const updateProductAvailable = useUpdateProductAvailable();
  const updateStoreStatus    = useUpdateStoreStatus();

  const { data: storeStatus } = useGetStoreStatus();
  const storeOpen = storeStatus?.open !== false;

  const toggleStore = () => {
    updateStoreStatus.mutate(
      { data: { open: !storeOpen } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetStoreStatusQueryKey() }) }
    );
  };

  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [startModalOrderId, setStartModalOrderId] = useState<string | null>(null);
  const [timeDays,    setTimeDays]    = useState(0);
  const [timeHours,   setTimeHours]   = useState(0);
  const [timeMinutes, setTimeMinutes] = useState(30);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setLocation('/admin');
  };

  const invalidateOrders   = () => queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });

  const handleHold     = (id: string) => holdOrder.mutate({ orderId: id }, { onSuccess: invalidateOrders });
  const handleUnhold   = (id: string) => unholdOrder.mutate({ orderId: id }, { onSuccess: invalidateOrders });
  const handleComplete = (id: string) => completeOrder.mutate({ orderId: id }, { onSuccess: invalidateOrders });

  const handleStartOpen = (id: string) => {
    setTimeDays(0); setTimeHours(0); setTimeMinutes(30);
    setStartModalOrderId(id);
  };

  const handleStartConfirm = () => {
    if (!startModalOrderId) return;
    startOrder.mutate(
      { orderId: startModalOrderId, data: { days: timeDays, hours: timeHours, minutes: timeMinutes } },
      { onSuccess: () => { invalidateOrders(); setStartModalOrderId(null); } }
    );
  };

  const toggleGlobalColor = (color: string, current: boolean) =>
    updateGlobalColor.mutate({ data: { color: color as any, available: !current } }, { onSuccess: invalidateProducts });

  const toggleProductAvailable = (productId: string, current: boolean) =>
    updateProductAvailable.mutate({ productId, data: { available: !current } }, { onSuccess: invalidateProducts });

  const toggleProductColor = (productId: string, color: string, current: boolean) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    updateColors.mutate(
      { productId, data: { colors: product.colors.map(c => c.color === color ? { ...c, available: !current } : c) } },
      { onSuccess: invalidateProducts }
    );
  };

  const globalColorAvailability: Record<string, boolean> = {};
  ALL_COLORS.forEach(color => {
    globalColorAvailability[color] = !products || products.length === 0
      ? true
      : products.some(p => p.colors.some(c => c.color === color && c.available));
  });

  const activeOrders    = [...(orders ?? [])].reverse().filter(o => o.status !== 'completed');
  const completedOrders = [...(orders ?? [])].reverse().filter(o => o.status === 'completed');

  const TABS = [
    { id: 'orders'    as TabId, icon: ShoppingBag, label: 'Orders',    count: activeOrders.length },
    { id: 'completed' as TabId, icon: CheckCheck,  label: 'Completed', count: completedOrders.length },
    { id: 'colors'    as TabId, icon: Palette,     label: 'Color Stock', count: null },
    { id: 'products'  as TabId, icon: Package,     label: 'Products',    count: null },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-400 font-bold">Manage orders, colors, and products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleStore}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold transition-all ${
              storeOpen
                ? 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100'
                : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
            }`}
          >
            {storeOpen ? <><Store className="w-5 h-5" /> Store Open</> : <><Lock className="w-5 h-5" /> Store Closed</>}
          </button>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 rounded-xl border-2 font-bold">
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
                activeTab === tab.id ? 'bg-pink-500 text-white' : 'bg-white border-2 text-gray-600 hover:border-pink-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-sm border-2 overflow-hidden">
          <div className="p-6 border-b bg-yellow-50">
            <h2 className="font-display text-2xl text-yellow-700">
              Active Orders {activeOrders.length > 0 && `(${activeOrders.length})`}
            </h2>
          </div>
          {ordersLoading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : activeOrders.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <ShoppingBag className="mx-auto w-16 h-16 mb-4 opacity-30" />
              <p className="font-display text-2xl">No active orders!</p>
            </div>
          ) : (
            <div className="divide-y">
              {activeOrders.map(order => {
                const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
                return (
                  <div key={order.id} className="p-6">
                    <div className="flex justify-between gap-5 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-3 items-center mb-2 flex-wrap">
                          <span className="font-display text-2xl text-pink-500">{order.orderNumber}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>{badge.label}</span>
                        </div>
                        <p className="font-bold text-gray-800">{order.customerName}</p>
                        <p className="text-gray-400 text-sm mb-3">{order.customerEmail}</p>
                        <div className="flex flex-col gap-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex flex-wrap gap-2 items-center text-sm bg-gray-50 rounded-xl px-3 py-2">
                              <ColorDots colors={item.colors} />
                              <span className="font-semibold text-gray-700">{item.productName}</span>
                              <span className="text-gray-400">{PATTERN_LABELS[item.pattern] ?? item.pattern}</span>
                              <PetBadge petType={(item as any).petType} />
                              <span className="ml-auto font-bold text-teal-600">${item.price}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-teal-600 font-bold mt-3 text-lg">Total: ${order.total}</p>
                        {order.estimatedCompletion && (
                          <p className="text-sm text-gray-400 mt-1">⏱ Est. {order.estimatedCompletion}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {order.status === 'pending' && (
                          <>
                            <Button onClick={() => handleHold(order.id)} className="bg-orange-400 hover:bg-orange-500 text-white">
                              <PauseCircle className="w-4 h-4 mr-2" /> Hold
                            </Button>
                            <Button onClick={() => handleStartOpen(order.id)} className="bg-teal-500 hover:bg-teal-600 text-white">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Start Making
                            </Button>
                          </>
                        )}
                        {order.status === 'on_hold' && (
                          <>
                            <Button onClick={() => handleUnhold(order.id)} className="bg-teal-500 hover:bg-teal-600 text-white">
                              <PlayCircle className="w-4 h-4 mr-2" /> Unhold
                            </Button>
                            <Button onClick={() => handleStartOpen(order.id)} className="bg-pink-500 hover:bg-pink-600 text-white">
                              Start Making
                            </Button>
                          </>
                        )}
                        {order.status === 'in_progress' && (
                          <Button onClick={() => handleComplete(order.id)} className="bg-green-500 hover:bg-green-600 text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLETED TAB ── */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-3xl shadow-sm border-2 overflow-hidden">
          <div className="p-6 border-b bg-green-50">
            <h2 className="font-display text-2xl text-green-700">
              Completed Orders {completedOrders.length > 0 && `(${completedOrders.length})`}
            </h2>
          </div>
          {ordersLoading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : completedOrders.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <CheckCheck className="mx-auto w-16 h-16 mb-4 opacity-30" />
              <p className="font-display text-2xl">No completed orders yet!</p>
            </div>
          ) : (
            <div className="divide-y">
              {completedOrders.map(order => (
                <div key={order.id} className="p-6 opacity-90">
                  <div className="flex justify-between gap-5 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-3 items-center mb-2 flex-wrap">
                        <span className="font-display text-2xl text-green-500">{order.orderNumber}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Completed</span>
                      </div>
                      <p className="font-bold text-gray-800">{order.customerName}</p>
                      <p className="text-gray-400 text-sm mb-3">{order.customerEmail}</p>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex flex-wrap gap-2 items-center text-sm bg-green-50 rounded-xl px-3 py-2">
                            <ColorDots colors={item.colors} />
                            <span className="font-semibold text-gray-700">{item.productName}</span>
                            <span className="text-gray-400">{PATTERN_LABELS[item.pattern] ?? item.pattern}</span>
                            <PetBadge petType={(item as any).petType} />
                            <span className="ml-auto font-bold text-green-600">${item.price}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-green-600 font-bold mt-3 text-lg">Total: ${order.total}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COLOR STOCK TAB ── */}
      {activeTab === 'colors' && (
        <div>
          {/* Global toggles */}
          <div className="bg-white rounded-3xl shadow-sm border-2 overflow-hidden mb-6">
            <div className="bg-teal-50 p-6">
              <h2 className="font-display text-2xl text-teal-700">Global Color Stock</h2>
              <p className="text-teal-500 font-semibold text-sm">Toggle a color off to mark it sold-out across all products</p>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
              {ALL_COLORS.map(color => {
                const available = globalColorAvailability[color];
                return (
                  <div
                    key={color}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      available ? 'border-gray-100' : 'border-red-100 bg-red-50/40 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full border-4 border-white shadow transition-all ${!available ? 'grayscale' : ''}`}
                      style={{ backgroundColor: COLOR_MAP[color] }}
                    />
                    <span className="capitalize font-bold text-gray-700">{color}</span>
                    <ToggleSlider on={available} onToggle={() => toggleGlobalColor(color, available)} />
                    <span className={`text-xs font-bold ${available ? 'text-teal-500' : 'text-red-400'}`}>
                      {available ? 'In Stock' : 'Sold Out'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-product color toggles */}
          <h3 className="font-display text-xl text-gray-600 mb-4 px-1">Per-Product Color Availability</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsLoading ? (
              <div className="col-span-3 text-center py-10 text-gray-400">Loading...</div>
            ) : (
              products?.map(product => (
                <div key={product.id} className="bg-white rounded-3xl border-2 p-5">
                  <h3 className="font-display text-xl text-gray-800">{product.name}</h3>
                  <p className="text-teal-500 font-bold mb-4">${product.price}</p>
                  <div className="flex flex-col gap-3">
                    {product.colors.map(c => (
                      <div key={c.color} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full border shadow-sm transition-all ${!c.available ? 'grayscale opacity-50' : ''}`}
                            style={{ backgroundColor: COLOR_MAP[c.color!] }}
                          />
                          <span className="capitalize font-semibold text-gray-700">{c.color}</span>
                        </div>
                        <ToggleSlider
                          on={!!c.available}
                          onToggle={() => toggleProductColor(product.id, c.color!, !!c.available)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsLoading ? (
            <div className="col-span-3 text-center py-10 text-gray-400">Loading...</div>
          ) : (
            products?.map(product => (
              <div key={product.id} className="bg-white rounded-3xl border-2 p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="font-display text-2xl">{product.name}</h3>
                    <p className="text-teal-500 font-bold">${product.price}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.available ? 'Available' : 'Hidden'}
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap mb-4">
                  {product.colors.map(c => (
                    <div
                      key={c.color}
                      title={c.color}
                      className={`w-6 h-6 rounded-full border border-black/10 shadow-sm ${!c.available ? 'grayscale opacity-40' : ''}`}
                      style={{ backgroundColor: COLOR_MAP[c.color!] }}
                    />
                  ))}
                </div>
                <Button
                  onClick={() => toggleProductAvailable(product.id, product.available)}
                  disabled={updateProductAvailable.isPending}
                  variant={product.available ? 'outline' : 'default'}
                  className="w-full"
                >
                  {product.available ? 'Mark Unavailable' : 'Mark Available'}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── START MAKING MODAL ── */}
      <Dialog open={!!startModalOrderId} onOpenChange={open => !open && setStartModalOrderId(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">How long will it take?</DialogTitle>
            <DialogDescription className="text-center">Set an estimate for the customer</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Days</label>
              <Input type="number" min={0} value={timeDays} onChange={e => setTimeDays(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Hours</label>
              <Input type="number" min={0} value={timeHours} onChange={e => setTimeHours(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Minutes</label>
              <Input type="number" min={0} value={timeMinutes} onChange={e => setTimeMinutes(Number(e.target.value))} placeholder="30" />
            </div>
          </div>
          <Button onClick={handleStartConfirm} disabled={startOrder.isPending} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
            {startOrder.isPending ? 'Saving...' : '🎨 Start Making'}
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
