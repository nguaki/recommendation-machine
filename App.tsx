import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, LayoutDashboard, GraduationCap, LogOut, 
  Mail, Lock, Play, ArrowRight, Globe, ChevronLeft, Send, 
  Building2, Package, UserCheck, CreditCard, CheckCircle2 
} from 'lucide-react';
import { auth, db } from './firebaseConfig'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your Public Key
emailjs.init("YOUR_PUBLIC_KEY"); 

export default function App() {
  // --- CORE STATE ---
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'login' | 'dashboard' | 'tutorial' | 'testForm' | 'billing'>('home');
  
  // --- AUTH STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  // --- BILLING STATE ---
  const [hasAgreed, setHasAgreed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ setupPaid: false, subActive: false });

  // --- LEAD FORM STATE ---
  const [formData, setFormData] = useState({ country: '', industry: '', skuCount: '', hasFrontend: '', userEmail: '' });
  const [items, setItems] = useState(Array(10).fill(null).map(() => ({ name: '', brand: '', volume: '', description: '' })));
  const [submitting, setSubmitting] = useState(false);

  // Authentication Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setView('dashboard');
      else setView('home');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- HANDLERS ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) { setError(err.message); }
  };

  const handleSignOut = () => {
    signOut(auth);
    setView('home');
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const itemsSummary = items.filter(i => i.name.trim() !== '').map((i, idx) => `ITEM_${idx+1}: [${i.name} | ${i.brand} | ${i.volume}]`).join('\n');
    const payload = { ...formData, items_summary: itemsSummary };

    try {
      await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', payload);
      alert("Success! Request sent to James.");
      setView('home');
    } catch (err) { alert("Sent to database, but email failed."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-10 text-center font-sans">Initializing Machine...</div>;

  // --- VIEW: TUTORIAL ---
  if (view === 'tutorial') {
    return (
      <div className="min-h-screen bg-white p-10 font-sans">
        <button onClick={() => setView('home')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft/> Back</button>
        <h1 className="text-3xl font-bold text-[#001529]">How the Matrix Model Works</h1>
        <div className="mt-10 p-10 bg-gray-50 border rounded-xl text-center text-gray-500 italic">
          [Diagram showing Top Layer: Business Specific vs Bottom Layer: General Co-purchase]
        </div>
      </div>
    );
  }

  // --- VIEW: TEST FORM (STEP 2) ---
  if (view === 'testForm') {
    return (
      <div className="min-h-screen bg-gray-50 p-10 font-sans">
        <button onClick={() => setView('home')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft/> Back</button>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
            <h2 className="text-2xl font-bold mb-6">Model Feasibility Test</h2>
            {/* Form inputs would go here - keeping it brief for the view switcher demo */}
            <p className="text-gray-500 mb-4">Please fill out your business profile and 10 items.</p>
            <button onClick={handleLeadSubmit} className="bg-[#001529] text-white px-6 py-2 rounded">Submit Test Data</button>
        </div>
      </div>
    );
  }

  // --- VIEW: LOGIN / REGISTER ---
  if (view === 'login' && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">{isRegistering ? 'Create Account' : 'Sign In'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-3 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full py-3 bg-[#001529] text-white rounded font-bold">{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-blue-600 text-sm">
            {isRegistering ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: HOME PAGE ---
  if (view === 'home' && !user) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <nav className="h-20 px-8 flex items-center justify-between border-b">
          <div className="text-xl font-bold text-[#001529]">Recommendation Machine</div>
          <div className="flex gap-4">
            <button onClick={() => setView('login')} className="text-gray-600 font-medium">Sign In</button>
            <button onClick={() => { setView('login'); setIsRegistering(true); }} className="bg-[#001529] text-white px-5 py-2 rounded-lg">Get Started</button>
          </div>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl font-extrabold text-[#001529] max-w-4xl">Build Your Custom Recommender Model.</h1>
          <div className="mt-10 flex gap-6">
            <button onClick={() => setView('tutorial')} className="px-8 py-4 border-2 rounded-xl font-bold flex items-center gap-2"><Play size={20}/> Step 1 - Tutorial</button>
            <button onClick={() => setView('testForm')} className="px-8 py-4 bg-[#001529] text-white rounded-xl font-bold flex items-center gap-2">Step 2 - Test Items <ArrowRight size={20}/></button>
          </div>
        </main>
      </div>
    );
  }

  // --- DASHBOARD WRAPPER (SIDEBAR + CONTENT) ---
  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 text-lg font-bold border-b border-gray-700">Recommendation Machine</div>
        <nav className="flex-1 mt-6">
          <div 
            onClick={() => setView('dashboard')}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div 
            onClick={() => setView('billing')}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${view === 'billing' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            <CreditCard size={20} /> Payment & Plan
          </div>
          <div className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer text-gray-300">
            <GraduationCap size={20} /> Tutorial
          </div>
        </nav>
        <div onClick={handleSignOut} className="p-6 border-t border-gray-700 hover:text-red-400 cursor-pointer flex items-center gap-3 text-gray-400 transition">
          <LogOut size={20} /> Sign Out
        </div>
      </aside>

      {/* Dynamic Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">{view}</h2>
          <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{user?.email}</span>
        </header>

        <div className="p-8 overflow-y-auto">
          {/* VIEW: BILLING / PAYMENT */}
          {view === 'billing' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
                <div className="p-6 bg-gray-50 border rounded-xl">
                  <h3 className="font-bold mb-3">Service & Data Agreement</h3>
                  <div className="h-32 overflow-y-auto text-xs text-gray-600 bg-white p-4 border rounded mb-4">
                    I acknowledge that the recommendation model is generated based on semantic LLM reasoning 
                    and my provided transactional data. I agree to the initialization fee based on SKU count 
                    and the monthly recurring subscription for ongoing model optimization.
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" checked={hasAgreed} onChange={e => setHasAgreed(e.target.checked)} />
                    <span className="text-sm font-semibold">I accept the terms and authorize model creation.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`p-6 rounded-xl border-2 ${hasAgreed ? 'border-blue-100 bg-blue-50/30' : 'opacity-40'}`}>
                    <h4 className="font-bold">1. Initial Model Creation</h4>
                    <p className="text-xs text-gray-500 mb-4">One-time fee based on SKU complexity.</p>
                    <div className="text-3xl font-black mb-6">$499</div>
                    <button disabled={!hasAgreed} className="w-full py-3 bg-[#001529] text-white rounded-lg font-bold disabled:bg-gray-300">
                      Pay Setup Fee
                    </button>
                  </div>
                  <div className={`p-6 rounded-xl border-2 ${hasAgreed ? 'border-green-100 bg-green-50/30' : 'opacity-40'}`}>
                    <h4 className="font-bold">2. Monthly Subscription</h4>
                    <p className="text-xs text-gray-500 mb-4">Recurring optimization & data ingress.</p>
                    <div className="text-3xl font-black mb-6">$99<span className="text-sm font-normal">/mo</span></div>
                    <button disabled={!hasAgreed} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold disabled:bg-gray-300">
                      Start Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DASHBOARD (UPLOAD) */}
          {view === 'dashboard' && (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-8">
                  <Upload className="mx-auto text-blue-600 mb-4" size={40} />
                  <h3 className="text-lg font-medium text-gray-900">Upload Data for Modeling</h3>
                  <p className="text-gray-500">Your files are kept in isolated GCS directory: {user?.uid.slice(0,8)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4 text-gray-400 italic text-center">
                   Payment required to activate automated processing.
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
