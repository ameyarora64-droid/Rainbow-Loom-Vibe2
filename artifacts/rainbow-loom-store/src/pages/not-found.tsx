import { Link } from "wouter";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative z-10">
      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm mb-8 border-4 border-pink-100">
        <Search className="w-16 h-16 text-pink-300" />
      </div>
      <h1 className="font-display text-6xl text-pink-500 mb-6 drop-shadow-sm">404 - Oops!</h1>
      <p className="text-2xl text-gray-600 mb-10 max-w-md font-bold bg-white/50 backdrop-blur px-6 py-4 rounded-2xl shadow-sm border border-white">
        We looked under the craft table, but we couldn't find the page you're looking for.
      </p>
      <Link href="/">
        <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-2xl px-10 py-8 text-2xl font-bold shadow-sm transition-transform hover:scale-105 active:scale-95">
          Take me Home
        </Button>
      </Link>
    </div>
  );
}
