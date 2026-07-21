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

export default function Cart() {
  const { items, removeItem, total, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState('');
  const [orderNum, setOrderNum] = useState<string | null>(null);

  const createOrder = useCreateOrder();

  const handlePlaceOrder = () => {
    if (!name.trim()) return;
    createOrder.mutate(
      { data: { customerName: name, items } },
      {
        onSuccess: (order) => {
          setOrderNum(order.orderNumber);
          clearCart();
        }
      }
    );
  };

  if (orderNum) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl border-4 border-pink-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pink-400 via-yellow-400 to-teal-400"></div>
          <h1 className="font-display text-5xl text-teal-500 mb-6 mt-4">Yay! Order Placed!</h1>
          <p className="text-2xl text-gray-700 mb-4 font-bold">Thanks {name}!</p>
          <p className="text-xl text-gray-500 mb-8">Your order number is:</p>
          <div className="text-6xl font-display text-pink-500 mb-10 bg-pink-50 py-6 rounded-2xl border-2 border-pink-100 shadow-inner">
            {orderNum}
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
                <div 
                  className="w-16 h-16 rounded-full shadow-inner flex-shrink-0 border border-black/5" 
                  style={{ backgroundColor: COLOR_MAP[item.color] || item.color }} 
                />
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-800">{item.productName}</h3>
                  <p className="text-gray-500 font-semibold capitalize text-sm">Color: {item.color}</p>
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
            <DialogTitle className="font-display text-3xl text-pink-500 text-center">Who is this for?</DialogTitle>
            <DialogDescription className="text-lg text-center">
              Enter your name so we know who to make this for!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your First Name"
              className="text-xl py-7 px-4 rounded-xl text-center bg-gray-50 border-2 border-gray-200 focus-visible:ring-pink-400 font-bold"
              autoFocus
            />
          </div>
          <Button 
            onClick={handlePlaceOrder}
            disabled={!name.trim() || createOrder.isPending}
            className="w-full bg-pink-500 hover:bg-pink-600 rounded-xl py-6 text-xl font-bold shadow-sm"
          >
            {createOrder.isPending ? 'Placing Order...' : 'Confirm Order!'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
