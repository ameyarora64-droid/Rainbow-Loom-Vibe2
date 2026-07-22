import { useState } from 'react';
import { useGetOrder, getGetOrderQueryKey } from '@workspace/api-client-react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', green: '#22c55e', blue: '#3b82f6',
  purple: '#a855f7', pink: '#ec4899', black: '#1f2937'
};

export default function Track() {
  const [inputVal, setInputVal] = useState('');
  const [searchId, setSearchId] = useState<string>('');

  const { data: order, isLoading, isError } = useGetOrder(searchId, {
    query: {
      enabled: !!searchId,
      retry: false,
      queryKey: getGetOrderQueryKey(searchId)
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) setSearchId(inputVal.trim());
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border-2 border-pink-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10" />
          </div>
          <h1 className="font-display text-5xl text-teal-500 mb-4">Track Order</h1>
          <p className="text-lg text-gray-500 font-bold">Enter your order number to see details!</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <Input 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="#RL-1234"
            className="text-xl py-7 px-6 rounded-2xl border-2 border-gray-200 focus-visible:ring-teal-400 font-bold bg-gray-50"
          />
          <Button type="submit" className="bg-teal-500 hover:bg-teal-600 rounded-2xl px-8 h-auto shadow-sm transition-transform hover:scale-105 active:scale-95">
            <Search className="w-6 h-6" />
          </Button>
        </form>

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full"></div>
          </div>
        )}

        {isError && (
          <div className="text-center p-6 bg-red-50 text-red-500 rounded-2xl font-bold text-lg border border-red-100">
            Order not found. Please check the number and try again!
          </div>
        )}

        {order && (
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-teal-400"></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gray-200 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Customer</p>
                <p className="font-display text-3xl text-gray-800">{order.customerName}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                <p className="font-display text-3xl text-pink-500">${order.total}</p>
              </div>
            </div>

            <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-4 text-sm">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 flex-shrink-0">
                    {item.colors.map((c: string, ci: number) => (
                      <div key={ci} className="w-9 h-9 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: COLOR_MAP[c] || c }} />
                    ))}
                  </div>
                  <span className="font-bold text-gray-800 flex-1 text-lg">{item.productName}</span>
                  <span className="text-teal-600 font-bold text-xl">${item.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
