import { useState } from 'react';
import { ShoppingBag, Sparkles, Diamond, Circle, Link2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '../contexts/CartContext';
import type { Product, CartItemPattern } from '@workspace/api-client-react';

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

type Pattern = CartItemPattern;

const PATTERNS: { value: Pattern; label: string; description: string; count: number | 'fish' }[] = [
  { value: 'regular',          label: 'Regular',          description: 'Choose 3 colors',           count: 3 },
  { value: 'dragon_scale',     label: 'Dragon Scale',     description: 'Choose 2 colors',           count: 2 },
  { value: 'fish_scale',       label: 'Fish Scale',       description: 'Choose 1 or 3 colors',      count: 'fish' },
  { value: 'double_fish_scale',label: 'Double Fish Scale','description': 'Choose 4 colors',          count: 4 },
];

function isValidSelection(pattern: Pattern, colors: string[]): boolean {
  const n = colors.length;
  switch (pattern) {
    case 'regular':           return n === 3;
    case 'dragon_scale':      return n === 2;
    case 'fish_scale':        return n === 1 || n === 3;
    case 'double_fish_scale': return n === 4;
    default:                  return false;
  }
}

function maxColors(pattern: Pattern): number {
  return pattern === 'double_fish_scale' ? 4 : pattern === 'regular' ? 3 : pattern === 'fish_scale' ? 3 : 2;
}

export default function ProductCard({ product }: { product: Product }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pattern, setPattern] = useState<Pattern>('regular');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const { addItem } = useCart();

  const Icon = ICONS[product.name] || Sparkles;

  const handleOpen = () => {
    setPattern('regular');
    setSelectedColors([]);
    setModalOpen(true);
  };

  const handlePatternChange = (p: Pattern) => {
    setPattern(p);
    setSelectedColors([]);
  };

  const handleColorClick = (color: string) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      }
      const max = maxColors(pattern);
      if (prev.length >= max) {
        // replace oldest with new
        return [...prev.slice(1), color];
      }
      return [...prev, color];
    });
  };

  const handleAdd = () => {
    if (!isValidSelection(pattern, selectedColors)) return;
    addItem({
      productId: product.id,
      productName: product.name,
      colors: selectedColors,
      pattern,
      price: product.price
    });
    setModalOpen(false);
    setSelectedColors([]);
  };

  const valid = isValidSelection(pattern, selectedColors);
  const fishWarning = pattern === 'fish_scale' && selectedColors.length === 2;

  const currentPatternInfo = PATTERNS.find(p => p.value === pattern)!;

  if (!product.available) {
    return (
      <div className="bg-white/60 rounded-3xl p-6 shadow-sm border-2 border-gray-100 flex flex-col items-center gap-4 opacity-60">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="w-16 h-16 text-gray-300" />
        </div>
        <h3 className="font-display text-2xl text-gray-400">{product.name}</h3>
        <p className="text-xl font-bold text-gray-300">${product.price}</p>
        <div className="w-full rounded-xl bg-gray-100 text-gray-400 font-bold py-4 text-lg text-center">
          Unavailable
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-pink-50 hover:shadow-md transition-all flex flex-col items-center gap-4 group">
        <div className="w-32 h-32 rounded-full bg-pink-50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-16 h-16 text-pink-400" />
        </div>
        <h3 className="font-display text-2xl text-gray-800">{product.name}</h3>
        <p className="text-xl font-bold text-teal-500">${product.price}</p>
        <Button
          onClick={handleOpen}
          className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold py-6 text-lg shadow-sm mt-auto"
        >
          Add to Cart
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-center text-pink-500 mb-1">
              {product.name} — ${product.price}
            </DialogTitle>
            <DialogDescription className="text-center text-base text-gray-500">
              Pick a style, then choose your colors!
            </DialogDescription>
          </DialogHeader>

          {/* Pattern Selector */}
          <div className="mt-2">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Style / Scale</p>
            <div className="grid grid-cols-2 gap-2">
              {PATTERNS.map(p => (
                <button
                  key={p.value}
                  onClick={() => handlePatternChange(p.value)}
                  className={`rounded-2xl px-4 py-3 text-left transition-all border-2 ${
                    pattern === p.value
                      ? 'border-pink-400 bg-pink-50 shadow-sm'
                      : 'border-gray-100 bg-gray-50 hover:border-pink-200'
                  }`}
                >
                  <p className={`font-bold text-sm ${pattern === p.value ? 'text-pink-600' : 'text-gray-700'}`}>
                    {p.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected colors preview */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Selected:</span>
            <div className="flex gap-1.5">
              {selectedColors.length === 0
                ? <span className="text-sm text-gray-300 italic">none yet</span>
                : selectedColors.map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: COLOR_MAP[c] || c }}
                      title={c}
                    />
                  ))
              }
            </div>
            {fishWarning && (
              <span className="text-xs text-amber-500 font-bold ml-1">Fish Scale needs 1 or 3!</span>
            )}
          </div>

          {/* Color grid */}
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Colors</p>
            <div className="grid grid-cols-4 gap-3">
              {product.colors.map(c => {
                const bg = COLOR_MAP[c.color] || c.color;
                const isSelected = selectedColors.includes(c.color);
                return (
                  <button
                    key={c.color}
                    disabled={!c.available}
                    onClick={() => handleColorClick(c.color)}
                    className={`relative flex flex-col items-center p-2 rounded-2xl transition-all ${
                      !c.available
                        ? 'opacity-40 cursor-not-allowed grayscale'
                        : isSelected
                        ? 'bg-pink-50 ring-2 ring-pink-400 scale-105 shadow-sm'
                        : 'hover:bg-pink-50'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full shadow-inner mb-1 border border-black/5" style={{ backgroundColor: bg }}>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold capitalize text-gray-700">{c.color}</span>
                    {!c.available && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/50 text-red-500 font-display text-[10px] rotate-[-12deg]">
                        Sold Out
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            disabled={!valid}
            onClick={handleAdd}
            className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold py-6 text-xl shadow-sm mt-2"
          >
            {valid
              ? `Add to Cart ✓`
              : fishWarning
              ? 'Pick 1 or 3 colors for Fish Scale'
              : `Pick ${currentPatternInfo.description.toLowerCase()}`}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
