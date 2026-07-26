import React, { useState, useEffect } from 'react';
import { Upload, FileText, LayoutDashboard, GraduationCap, LogOut, Mail, Lock } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const [files] = useState([
    { name: 'sample_data.csv', size: '1.2 MB', date: '2023-11-01' }
  ]);

  // Observer for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- ACTIONS ---

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

  const handleSignOut = () => signOut(auth);

  if (loading) return <div className="p-10 text-center font-sans">Initializing Machine...</div>;

  // --- VIEW 1: AUTHENTICATION (LOGIN/REGISTER) ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F3F4F6] font-sans px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#001529]">Recommendation Machine</h1>
            <p className="text-gray-500 text-sm mt-2">
              {isRegistering ? 'Create your business account' : 'Sign in to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email" required
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="name@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" required
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            <button type="submit" className="w-full bg-[#001529] text-white py-3 rounded-lg font-semibold hover:bg-blue-900 transition mt-4 shadow-md">
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Create one'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD (ONLY SHOWN IF LOGGED IN) ---
  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      <aside className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 text-lg font-bold border-b border-gray-700">Recommendation Machine</div>
        <nav className="flex-1 mt-6">
          <div className="px-4 py-3 bg-blue-600 flex items-center gap-3 cursor-pointer"><LayoutDashboard size={20} /> Dashboard</div>
          <div className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer text-gray-300 transition"><GraduationCap size={20} /> Tutorial</div>
        </nav>
        <div onClick={handleSignOut} className="p-6 border-t border-gray-700 hover:text-red-400 cursor-pointer flex items-center gap-3 text-gray-400 transition">
          <LogOut size={20} /> Sign Out
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden text-gray-800">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between">
          <h2 className="text-xl font-semibold">Client Data Console</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">{user.email}</span>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer mb-8 group">
            <Upload className="mx-auto text-blue-600 mb-4 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="text-lg font-medium">Upload transactional data</h3>
            <p className="text-gray-500 mt-1">Files are isolated in your secure GCP bucket: {user.uid.slice(0,8)}...</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-sm font-semibold text-gray-600">
                <tr><th className="px-6 py-4">File Name</th><th className="px-6 py-4">Size</th><th className="px-6 py-4">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {files.map((file, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-2 font-medium"><FileText size={16} className="text-gray-400"/> {file.name}</td>
                    <td className="px-6 py-4 text-gray-500">{file.size}</td>
                    <td className="px-6 py-4 text-gray-500">{file.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
