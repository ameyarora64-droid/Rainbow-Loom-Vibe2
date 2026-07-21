import { Link, useLocation } from 'wouter';
import { ShoppingCart, LogIn, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function Navbar() {
  const { items } = useCart();
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-teal-400 flex items-center justify-center text-white font-display text-2xl shadow-sm rotate-12">
            RL
          </div>
          <span className="font-display text-xl sm:text-2xl text-pink-500 hidden sm:block drop-shadow-sm">
            The Rainbow Loom Vibe Store
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/track" className={`font-bold text-gray-600 hover:text-pink-500 transition-colors flex items-center gap-2 ${location === '/track' ? 'text-pink-500' : ''}`}>
            <MapPin className="w-5 h-5" />
            <span className="hidden md:inline">Track Order</span>
          </Link>
          <Link href="/admin" className={`font-bold text-gray-600 hover:text-pink-500 transition-colors flex items-center gap-2 ${location.startsWith('/admin') ? 'text-pink-500' : ''}`}>
            <LogIn className="w-5 h-5" />
            <span className="hidden md:inline">Admin Login</span>
          </Link>
          
          <Link href="/cart" className="relative bg-primary hover:bg-pink-600 text-white p-3 rounded-2xl shadow-md transition-transform hover:scale-105 active:scale-95 sm:ml-2 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 font-display text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
