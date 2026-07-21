import { useGetProducts } from '@workspace/api-client-react';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { data: products, isLoading, isError } = useGetProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl md:text-7xl text-pink-500 mb-6 drop-shadow-sm">
          Welcome to the Vibe!
        </h1>
        <p className="text-xl md:text-2xl text-teal-600 font-bold bg-white/70 inline-block px-8 py-3 rounded-full backdrop-blur-md shadow-sm border border-white">
          Get your customized rainbow loom bracelets and more!
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-16 h-16 border-8 border-pink-200 border-t-pink-500 rounded-full"></div>
        </div>
      ) : isError ? (
        <div className="text-center text-red-500 bg-red-50 p-6 rounded-3xl max-w-md mx-auto border border-red-100 font-bold">
          Oops! Something went wrong loading the products.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
