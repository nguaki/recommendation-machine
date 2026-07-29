import React, { useState, useEffect } from 'react';
import { Upload, FileText, LayoutDashboard, GraduationCap, LogOut, Mail, Lock, Play, ArrowRight, Globe, ChevronLeft, Send, Building2, Package, UserCheck } from 'lucide-react';
import { auth, db } from './firebaseConfig'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'login' | 'dashboard' | 'tutorial' | 'testForm'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    country: '',
    industry: '',
    skuCount: '',
    hasFrontend: '',
    userEmail: ''
  });

  const [items, setItems] = useState(
    Array(10).fill(null).map(() => ({ name: '', brand: '', volume: '', description: '' }))
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setView('dashboard');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LOGIC: FORM VALIDATION ---
  // Submit is active only if Email is present AND at least the first item has a name
  const isFormValid = formData.userEmail.includes('@') && items[0].name.length > 2;

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      items: items.filter(i => i.name !== ''), // Only send items that have names
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Save to Firestore (Durable Record)
      await addDoc(collection(db, "leads"), {
        ...payload,
        createdAt: serverTimestamp()
      });

      // 2. Prepare Email Body (Parseable JSON-like format)
      const emailBody = `
--- NEW MODEL REQUEST ---
ID: ${Math.random().toString(36).substr(2, 9)}
COUNTRY: ${payload.country}
INDUSTRY: ${payload.industry}
SKU_COUNT: ${payload.skuCount}
HAS_FRONTEND: ${payload.hasFrontend}
RECIPIENT_EMAIL: ${payload.userEmail}

ITEMS_START
${payload.items.map((item, idx) => 
  `ITEM_${idx+1}: [NAME: ${item.name} | BRAND: ${item.brand} | VOL: ${item.volume} | DESC: ${item.description}]`
).join('\n')}
ITEMS_END
--- END REQUEST ---
      `;

      // For this prototype, we'll use a mailto link or alert. 
      // In production, we'd trigger a Firebase Cloud Function to send the SMTP email.
      window.location.href = `mailto:jamesche0409@gmail.com?subject=New Recommender Model Request&body=${encodeURIComponent(emailBody)}`;
      
      alert("Form submitted! Your email client will now open to send the parseable request to James.");
      setView('home');
    } catch (err) {
      console.error(err);
      alert("Submission failed. Check console.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-sans">Initializing...</div>;

  // --- VIEW: TEST FORM ---
  if (view === 'testForm') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans pb-20">
        <nav className="h-16 px-8 flex items-center justify-between border-b bg-white sticky top-0 z-50">
          <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-600 hover:text-black">
            <ChevronLeft size={20} /> Back
          </button>
          <span className="font-bold text-[#001529]">Step 2: Model Feasibility Test</span>
        </nav>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mt-12 px-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-8">
            
            {/* 1. Country */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><Globe size={16}/> 1. Select Country</label>
              <select 
                required className="w-full p-3 border rounded-lg bg-gray-50"
                value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}
              >
                <option value="">Choose a country...</option>
                <option value="USA">United States</option>
                <option value="Korea">South Korea</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
                <option value="Spain">Spain</option>
              </select>
            </div>

            {/* 2. Industry */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><Building2 size={16}/> 2. Industry Vertical</label>
              <select 
                required className="w-full p-3 border rounded-lg bg-gray-50"
                value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})}
              >
                <option value="">Select industry...</option>
                <option value="Retail">Retail & E-commerce</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Construction">Construction</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Healthcare">Healthcare</option>
                <option value="IT">Information Technology</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* 3. SKU Count */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><Package size={16}/> 3. Approx. Number of Unique Items (SKUs)</label>
              <input 
                type="number" placeholder="e.g. 500" required className="w-full p-3 border rounded-lg bg-gray-50"
                value={formData.skuCount} onChange={e => setFormData({...formData, skuCount: e.target.value})}
              />
            </div>

            {/* 4. Frontend Dev */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><UserCheck size={16}/> 4. Do you have a Front-end Engineer?</label>
              <div className="flex gap-4">
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border">
                    <input type="radio" name="frontend" value={opt} onChange={e => setFormData({...formData, hasFrontend: e.target.value})} /> {opt}
                  </label>
                ))}
              </div>
            </div>

            {/* 5. 10 Items */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">5. Enter up to 10 Real Items</label>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      placeholder={`Item ${idx+1} Name*`}
                      className="p-2 border rounded text-sm"
                      value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)}
                    />
                    <input 
                      placeholder="Brand (Optional)"
                      className="p-2 border rounded text-sm"
                      value={item.brand} onChange={e => handleItemChange(idx, 'brand', e.target.value)}
                    />
                    <input 
                      placeholder="Volume/Size (Optional)"
                      className="p-2 border rounded text-sm"
                      value={item.volume} onChange={e => handleItemChange(idx, 'volume', e.target.value)}
                    />
                    <input 
                      placeholder="Description (Optional)"
                      className="p-2 border rounded text-sm"
                      value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">6. Email Address to Receive the Model</label>
              <input 
                type="email" placeholder="you@company.com" required className="w-full p-3 border rounded-lg bg-gray-50 border-blue-200"
                value={formData.userEmail} onChange={e => setFormData({...formData, userEmail: e.target.value})}
              />
            </div>

            {/* 7. Disclaimer */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
              <strong>7. Notice:</strong> This preliminary model will be generated based on your order request and provided items. Our team will review the logical fit before processing.
            </div>

            {/* Submit Button */}
            <button 
              disabled={!isFormValid || submitting}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg
                ${isFormValid ? 'bg-[#001529] text-white hover:bg-blue-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <Send size={20} /> {submitting ? 'Processing...' : 'Submit Request to James'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- VIEW: TUTORIAL ---
  if (view === 'tutorial') {
    return (
      <div className="min-h-screen p-10 font-sans">
        <button onClick={() => setView('home')} className="mb-4 flex items-center gap-2"><ChevronLeft/> Back</button>
        <h1 className="text-3xl font-bold mb-4 text-[#001529]">How it Works</h1>
        <p className="text-gray-600">Model creation logic explanation goes here...</p>
      </div>
    );
  }

  // --- VIEW: HOME PAGE ---
  if (view === 'home' && !user) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <nav className="h-20 px-8 flex items-center justify-between border-b">
          <div className="text-xl font-bold text-[#001529]">Recommendation Machine</div>
          <div className="flex gap-4">
            <button onClick={() => setView('login')} className="px-4 py-2 text-gray-600 font-medium">Sign In</button>
            <button onClick={() => { setView('login'); setIsRegistering(true); }} className="px-5 py-2 bg-[#001529] text-white rounded-lg font-medium">Create Account</button>
          </div>
        </nav>

        <main className="text-center py-32 px-4 max-w-5xl mx-auto">
          <h1 className="text-6xl font-extrabold text-[#001529] leading-tight mb-8">
            Global Knowledge. <br/> Local Results.
          </h1>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              onClick={() => setView('tutorial')}
              className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:border-blue-400 transition"
            >
              <Play size={20} className="text-blue-500" /> Step 1 - Tutorial
            </button>
            <button 
              onClick={() => setView('testForm')}
              className="flex items-center gap-3 px-8 py-4 bg-[#001529] text-white rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg"
            >
              Step 2 - Test with your items <ArrowRight size={20} />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- OTHER VIEWS (LOGIN/DASHBOARD) ---
  // ... (Keep your existing Login/Dashboard code here)
  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold">Logged In Dashboard</h1>
      <button onClick={() => signOut(auth)} className="mt-4 bg-red-500 text-white p-2 px-4 rounded">Log Out</button>
    </div>
  );
}
