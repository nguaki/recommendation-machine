import React, { useState, useEffect } from 'react';
import { Upload, FileText, LayoutDashboard, GraduationCap, LogOut, Mail, Lock, Play, ArrowRight } from 'lucide-react';
import { auth } from './firebaseConfig'; 
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'login' | 'dashboard'>('home');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Authentication Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setView('dashboard');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setView('home');
  };

  if (loading) return <div className="p-10 text-center font-sans">Loading Recommendation Machine...</div>;

  // --- COMPONENT: PUBLIC HOME PAGE ---
  if (view === 'home' && !user) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        {/* TOP NAVIGATION BAR */}
        <nav className="h-20 px-8 flex items-center justify-between border-b border-gray-100">
          <div className="text-xl font-bold text-[#001529]">Recommendation Machine</div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setView('login'); setIsRegistering(false); }}
              className="px-4 py-2 text-gray-600 font-medium hover:text-[#001529]"
            >
              Sign In
            </button>
            <button 
              onClick={() => { setView('login'); setIsRegistering(true); }}
              className="px-5 py-2 bg-[#001529] text-white rounded-lg font-medium hover:bg-blue-900 transition shadow-sm"
            >
              Create an Account
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-gray-50">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#001529] max-w-4xl leading-tight">
            Boost your e-commerce revenue with precision recommendations.
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl">
            Drop your transactional data, test your models, and view KPI dashboards. 
            Built for business owners who value data-driven growth.
          </p>

          {/* TWO HORIZONTAL BUTTONS */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6">
            <button 
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:border-blue-400 hover:text-blue-600 transition group shadow-sm"
            >
              <Play size={20} className="text-blue-500 group-hover:scale-110 transition" />
              Step 1 - Tutorial
            </button>
            <button 
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#001529] text-white rounded-xl font-bold text-lg hover:bg-blue-900 transition shadow-md group"
            >
              Step 2 - Test with your items
              <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </button>
          </div>

          <div className="mt-16 text-sm text-gray-400 uppercase tracking-widest font-semibold">
            Trusted by modern business owners
          </div>
        </main>
      </div>
    );
  }

  // --- COMPONENT: LOGIN / REGISTER PAGE ---
  if (view === 'login' && !user) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4">
        <button onClick={() => setView('home')} className="mb-8 text-gray-500 hover:text-black flex items-center gap-2">
          ← Back to Home
        </button>
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border">
          <h2 className="text-2xl font-bold text-[#001529] text-center mb-6">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="email" placeholder="Email" required 
              className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Password" required
              className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="w-full bg-[#001529] text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition">
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-sm text-blue-600 hover:underline">
            {isRegistering ? 'Already have an account? Sign In' : 'New here? Create an Account'}
          </button>
        </div>
      </div>
    );
  }

  // --- COMPONENT: LOGGED-IN DASHBOARD ---
  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      <aside className="w-64 bg-[#001529] text-white flex flex-col shadow-xl">
        <div className="p-6 text-lg font-bold border-b border-gray-700">Recommendation Machine</div>
        <nav className="flex-1 mt-6">
          <div className="px-4 py-3 bg-blue-600 flex items-center gap-3 cursor-pointer shadow-inner"><LayoutDashboard size={20} /> Dashboard</div>
          <div className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer text-gray-300"><GraduationCap size={20} /> Tutorial</div>
        </nav>
        <div onClick={handleSignOut} className="p-6 border-t border-gray-700 hover:text-red-400 cursor-pointer flex items-center gap-3 text-gray-400 transition">
          <LogOut size={20} /> Sign Out
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden text-gray-800">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between shadow-sm">
          <h2 className="text-xl font-semibold">Client Data Console</h2>
          <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">{user?.email}</span>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer mb-8 group shadow-sm">
            <Upload className="mx-auto text-blue-600 mb-4 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="text-lg font-medium">Upload transactional data</h3>
            <p className="text-gray-500 mt-1 font-mono text-xs">Isolated GCS Directory: {user?.uid}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr><th className="px-6 py-4">File Name</th><th className="px-6 py-4">Size</th><th className="px-6 py-4">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center gap-2 font-medium"><FileText size={16} className="text-gray-400"/> sample_transactions.csv</td>
                  <td className="px-6 py-4 text-gray-500">1.2 MB</td>
                  <td className="px-6 py-4 text-gray-500">2023-11-01</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
