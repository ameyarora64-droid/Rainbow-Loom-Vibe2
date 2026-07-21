import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAdminLogin } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(
      { data: { passcode } },
      {
        onSuccess: (data) => {
          if (data.success) {
            localStorage.setItem('admin_token', data.token);
            setLocation('/admin/dashboard');
          } else {
            setError('Invalid passcode');
          }
        },
        onError: () => {
          setError('Invalid passcode');
        }
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-sm border border-pink-100 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-gray-700 to-gray-900"></div>
        <div className="text-center mb-8 mt-4">
          <div className="w-20 h-20 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="font-display text-4xl text-gray-800">Admin Area</h1>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Input 
              type="password"
              placeholder="Enter Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="text-center text-xl py-7 rounded-xl bg-gray-50 border-2 font-bold"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-center font-bold bg-red-50 py-2 rounded-lg">{error}</p>}
          <Button 
            type="submit" 
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-7 text-xl font-bold rounded-xl shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            disabled={loginMutation.isPending || !passcode}
          >
            {loginMutation.isPending ? 'Checking...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}
