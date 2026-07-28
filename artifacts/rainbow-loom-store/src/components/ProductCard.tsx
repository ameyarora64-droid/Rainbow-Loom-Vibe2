import { useState } from 'react';
import { ShoppingBag, Sparkles, Diamond, Circle, Link2, Check, Dog, Cat } from 'lucide-react';
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
type PetType = 'dog' | 'cat';

const PATTERNS: { value: Pattern; label: string; description: string; count: number | 'fish' }[] = [
  { value: 'regular',          label: 'Regular',          description: 'Choose 3 colors',       count: 3 },
  { value: 'dragon_scale',     label: 'Dragon Scale',     description: 'Choose 2 colors',       count: 2 },
  { value: 'fish_scale',       label: 'Fish Scale',       description: 'Choose 1 or 3 colors',  count: 'fish' },
  { value: 'double_fish_scale',label: 'Double Fish Scale',description: 'Choose 4 colors',       count: 4 },
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

function isAnimalCollar(name: string) {
  return name.toLowerCase().includes('collar');
}

export default function ProductCard({ product }: { product: Product }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pattern, setPattern] = useState<Pattern>('regular');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [petStep, setPetStep] = useState(false);
  const [petType, setPetType] = useState<PetType | null>(null);
  const { addItem } = useCart();

  const Icon = ICONS[product.name] || Sparkles;
  const isCollar = isAnimalCollar(product.name);

  const handleOpen = () => {
    setPattern('regular');
    setSelectedColors([]);
    setPetStep(false);
    setPetType(null);
    setModalOpen(true);
  };

  const handlePatternChange = (p: Pattern) => {
    setPattern(p);
    setSelectedColors([]);
  };

  const handleColorClick = (color: string) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) return prev.filter(c => c !== color);
      const max = maxColors(pattern);
      if (prev.length >= max) return [...prev.slice(1), color];
      return [...prev, color];
    });
  };

  const handleAdd = () => {
    if (!isValidSelection(pattern, selectedColors)) return;
    if (isCollar && !petStep) {
      setPetStep(true);
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      colors: selectedColors,
      pattern,
      price: product.price,
      ...(isCollar && petType ? { petType } : {}),
    });
    setModalOpen(false);
    setSelectedColors([]);
    setPetStep(false);
    setPetType(null);
  };

  const handlePetSelect = (pet: PetType) => {
    setPetType(pet);
    addItem({
      productId: product.id,
      productName: product.name,
      colors: selectedColors,
      pattern,
      price: product.price,
      petType: pet,
    });
    setModalOpen(false);
    setSelectedColors([]);
    setPetStep(false);
    setPetType(null);
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
        <span className="text-sm font-bold text-gray-300 bg-gray-100 px-4 py-1 rounded-full">Unavailable</span>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={handleOpen}
        className="bg-white rounded-3xl p-6 shadow-sm border-2 border-pink-100 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer flex flex-col items-center gap-4 group"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-teal-100 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon className="w-16 h-16 text-pink-400" />
        </div>
        <h3 className="font-display text-2xl text-gray-700">{product.name}</h3>
        <p className="text-xl font-bold text-teal-500">${product.price}</p>
        <div className="flex gap-1 flex-wrap justify-center">
          {product.colors.filter(c => c.available).map(c => (
            <div key={c.color} className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: COLOR_MAP[c.color!] || c.color! }} />
          ))}
        </div>
        {isCollar && (
          <div className="flex items-center gap-1 text-xs font-bold text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
            <Dog className="w-3 h-3" /> / <Cat className="w-3 h-3" /> Pet Collar
          </div>
        )}
        <Button className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold">
          Customize & Add
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={open => { if (!open) { setModalOpen(false); setPetStep(false); } }}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-pink-500 text-center">{product.name}</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              {petStep ? 'One more thing — who is this for?' : 'Pick your pattern and colors'}
            </DialogDescription>
          </DialogHeader>

          {/* PET TYPE STEP */}
          {petStep ? (
            <div className="flex flex-col gap-4 py-2">
              <p className="text-center text-gray-600 font-semibold">Do you have a dog or a cat?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePetSelect('dog')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all"
                >
                  <span className="text-5xl">🐕</span>
                  <span className="font-display text-2xl text-orange-500">Dog</span>
                </button>
                <button
                  onClick={() => handlePetSelect('cat')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <span className="text-5xl">🐱</span>
                  <span className="font-display text-2xl text-purple-500">Cat</span>
                </button>
              </div>
              <button onClick={() => setPetStep(false)} className="text-gray-400 text-sm underline text-center">← Back</button>
            </div>
          ) : (
            /* COLOR + PATTERN STEP */
            <div className="flex flex-col gap-5 py-2">
              {/* Pattern picker */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pattern</p>
                <div className="grid grid-cols-2 gap-2">
                  {PATTERNS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => handlePatternChange(p.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        pattern === p.value
                          ? 'border-pink-400 bg-pink-50'
                          : 'border-gray-100 hover:border-pink-200'
                      }`}
                    >
                      <div className="font-bold text-sm text-gray-700">{p.label}</div>
                      <div className="text-xs text-gray-400">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Colors</p>
                <div className="grid grid-cols-4 gap-2">
                  {product.colors.map(c => {
                    const bg = COLOR_MAP[c.color!] || c.color!;
                    const isSelected = selectedColors.includes(c.color!);
                    return (
                      <button
                        key={c.color}
                        disabled={!c.available}
                        onClick={() => handleColorClick(c.color!)}
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
                  ? isCollar ? `Next →` : `Add to Cart ✓`
                  : fishWarning
                  ? 'Pick 1 or 3 colors for Fish Scale'
                  : `Pick ${currentPatternInfo.description.toLowerCase()}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
