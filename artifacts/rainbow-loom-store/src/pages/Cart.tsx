import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCreateOrder } from '@workspace/api-client-react';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', green: '#22c55e', blue: '#3b82f6',
  purple: '#a855f7', pink: '#ec4899', black: '#1f2937'
};

const PATTERN_LABELS: Record<string, string> = {
  regular: 'Regular',
  dragon_scale: 'Dragon Scale',
  fish_scale: 'Fish Scale',
  double_fish_scale: 'Double Fish Scale',
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Cart() {
  const { items, removeItem, total, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [orderNum, setOrderNum] = useState<string | null>(null);
  const [orderedName, setOrderedName] = useState('');

  const createOrder = useCreateOrder();

  const emailError = emailTouched && !isValidEmail(email);
  const canSubmit = name.trim() && isValidEmail(email) && !createOrder.isPending;

  const handlePlaceOrder = () => {
    if (!canSubmit) return;
    setEmailTouched(true);
    if (!isValidEmail(email)) return;

    createOrder.mutate(
      { data: { customerName: name.trim(), customerEmail: email.trim(), items } },
      {
        onSuccess: (order) => {
          setOrderNum(order.orderNumber);
          setOrderedName(name.trim());
          clearCart();
        }
      }
    );
  };

  if (orderNum) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl border-4 border-pink-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pink-400 via-yellow-400 to-teal-400" />
          <h1 className="font-display text-5xl text-teal-500 mb-4 mt-4">Yay! Order Placed! 🌈</h1>
          <p className="text-2xl text-gray-700 mb-2 font-bold">Thanks {orderedName}!</p>
          <p className="text-base text-gray-400 mb-6">
            A confirmation has been sent to <strong className="text-gray-600">{email}</strong>
          </p>
          <p className="text-lg text-gray-500 mb-2">Your order number is:</p>
          <div className="text-6xl font-display text-pink-500 mb-6 bg-pink-50 py-6 rounded-2xl border-2 border-pink-100 shadow-inner">
            {orderNum}
          </div>
          <div className="text-left bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
            <p className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wider">Your Items</p>
            {items.length > 0 ? items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  {item.colors.map((c, ci) => (
                    <div key={ci} className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: COLOR_MAP[c] || c }} />
                  ))}
                </div>
                <span className="font-semibold text-gray-700">{item.productName}</span>
                <span className="text-gray-400 text-sm">({PATTERN_LABELS[item.pattern] ?? item.pattern})</span>
                <span className="ml-auto font-bold text-teal-600">${item.price}</span>
              </div>
            )) : (
              <p className="text-gray-400 text-sm italic">See confirmation email for details.</p>
            )}
          </div>
          <Link href="/">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-6 px-8 text-xl font-bold">
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center mb-8 gap-4">
        <Link href="/" className="text-pink-500 hover:bg-pink-50 p-3 rounded-full transition-colors bg-white shadow-sm border border-pink-100">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-display text-4xl sm:text-5xl text-gray-800">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-16 text-center shadow-sm">
          <ShoppingCart className="w-24 h-24 text-pink-200 mx-auto mb-6" />
          <h2 className="text-3xl font-display text-gray-500 mb-8">Your cart is empty!</h2>
          <Link href="/">
            <Button className="bg-pink-500 hover:bg-pink-600 rounded-xl px-10 py-6 text-xl font-bold shadow-sm">
              Let's go shopping!
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex items-center gap-4">
                <div className="flex gap-1.5 flex-shrink-0">
                  {item.colors.map((c, ci) => (
                    <div
                      key={ci}
                      className="w-10 h-10 rounded-full shadow-inner border border-black/5"
                      style={{ backgroundColor: COLOR_MAP[c] || c }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-800">{item.productName}</h3>
                  <p className="text-gray-400 text-sm capitalize">
                    {PATTERN_LABELS[item.pattern] ?? item.pattern} · {item.colors.join(', ')}
                  </p>
                </div>
                <div className="text-2xl font-bold text-teal-600 mr-2 sm:mr-4">${item.price}</div>
                <button
                  onClick={() => removeItem(idx)}
                  className="p-3 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-pink-100 h-fit sticky top-28">
            <h2 className="font-display text-3xl mb-6 text-gray-800">Summary</h2>
            <div className="flex justify-between text-xl mb-4 font-bold text-gray-500">
              <span>Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-gray-800 pt-6 border-t-2 border-dashed border-gray-200 mb-8">
              <span>Total</span>
              <span className="text-pink-500">${total}</span>
            </div>
            <Button
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-6 text-xl font-bold shadow-sm"
            >
              Place Order
            </Button>
          </div>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-pink-500 text-center">Almost there! 🎉</DialogTitle>
            <DialogDescription className="text-lg text-center">
              Tell us who this is for and we'll send you updates!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Your Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Name"
                className="text-xl py-7 px-4 rounded-xl text-center bg-gray-50 border-2 border-gray-200 focus-visible:ring-pink-400 font-bold"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Your Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="you@example.com"
                className={`text-lg py-7 px-4 rounded-xl text-center bg-gray-50 border-2 focus-visible:ring-pink-400 font-semibold ${
                  emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1.5 text-center font-semibold">
                  Please enter a valid email address
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1.5 text-center">
                We'll send your order confirmation and updates here
              </p>
            </div>
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={!canSubmit}
            className="w-full bg-pink-500 hover:bg-pink-600 rounded-xl py-6 text-xl font-bold shadow-sm"
          >
            {createOrder.isPending ? 'Placing Order...' : 'Confirm Order! 🌈'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
