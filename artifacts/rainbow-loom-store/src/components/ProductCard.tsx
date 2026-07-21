import { useState } from 'react';
import { ShoppingBag, Sparkles, Diamond, Circle, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '../contexts/CartContext';
import type { Product } from '@workspace/api-client-react/src/generated/api.schemas';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  black: '#1f2937'
};

const ICONS: Record<string, any> = {
  'Bracelets': Circle,
  'Rings': Diamond,
  'Necklace': Sparkles,
  'Chains': Link2,
  'Charms': ShoppingBag
};

export default function ProductCard({ product }: { product: Product }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { addItem } = useCart();

  const Icon = ICONS[product.name] || Sparkles;

  const handleAdd = () => {
    if (!selectedColor) return;
    addItem({
      productId: product.id,
      productName: product.name,
      color: selectedColor,
      price: product.price
    });
    setModalOpen(false);
    setSelectedColor(null);
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-pink-50 hover:shadow-md transition-all flex flex-col items-center gap-4 group">
        <div className="w-32 h-32 rounded-full bg-pink-50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-16 h-16 text-pink-400" />
        </div>
        <h3 className="font-display text-2xl text-gray-800">{product.name}</h3>
        <p className="text-xl font-bold text-teal-500">${product.price}</p>
        <Button 
          onClick={() => setModalOpen(true)}
          className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold py-6 text-lg shadow-sm mt-auto"
        >
          Add to Cart
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-center text-pink-500 mb-2">
              Choose a Color!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {product.name} - ${product.price}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-6">
            {product.colors.map(c => {
              const bg = COLOR_MAP[c.color] || c.color;
              return (
                <button
                  key={c.color}
                  disabled={!c.available}
                  onClick={() => setSelectedColor(c.color)}
                  className={`relative flex flex-col items-center p-2 rounded-2xl transition-all ${
                    !c.available ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:bg-pink-50'
                  } ${selectedColor === c.color ? 'bg-pink-50 ring-2 ring-pink-400 scale-105 shadow-sm' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full shadow-inner mb-2 border border-black/5" style={{ backgroundColor: bg }} />
                  <span className="text-sm font-bold capitalize text-gray-700">{c.color}</span>
                  {!c.available && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/50 text-red-600 font-display text-xs rotate-[-15deg]">
                      Sold Out
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <Button 
            disabled={!selectedColor}
            onClick={handleAdd}
            className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold py-6 text-xl shadow-sm"
          >
            {selectedColor ? `Add ${selectedColor} to Cart` : 'Select a color'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
