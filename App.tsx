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

// Initialize EmailJS
emailjs.init("YOUR_PUBLIC_KEY"); 



// --- TUTORIAL CONTENT DICTIONARY ---
const tutorialContent: any = {
  en: { title: "How It Works", subtitle: "Enterprise-grade recommendations.", description: "We combine general market trends with your specific data.", layerTop: "Business-Specific Matrix", layerBottom: "General Co-purchase Matrix", result: "Final Unique Model", back: "Back to Home" },
  ko: { title: "작동 원리", subtitle: "기업급 추천 시스템", description: "시장 트렌드와 귀하의 데이터를 결합합니다.", layerTop: "비즈니스별 매트릭스", layerBottom: "일반 공동 구매 매트릭스", result: "최종 독특한 모델", back: "홈으로 돌아가기" },
  ja: { title: "仕組みについて", subtitle: "エンタープライズ級の推奨", description: "市場動向と自社データを組み合わせます。", layerTop: "ビジネス固有のマトリックス", layerBottom: "一般共同購入マトリックス", result: "最終的な独自モデル", back: "ホームに戻る" },
  zh: { title: "工作原理", subtitle: "企业级推荐", description: "我们将市场趋势与您的数据相结合。", layerTop: "业务特定矩阵", layerBottom: "通用共同购买矩阵", result: "最终独特模型", back: "回到首页" },
  es: { title: "Cómo Funciona", subtitle: "Recomendaciones empresariales.", description: "Combinamos tendencias del mercado con sus datos.", layerTop: "Matriz específica", layerBottom: "Matriz general", result: "Modelo único final", back: "Volver al inicio" }
};

export default function App() {
  // --- CORE STATE ---
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'login' | 'dashboard' | 'tutorial' | 'testForm' | 'billing'>('home');
  const [lang, setLang] = useState<'en' | 'ko' | 'ja' | 'zh' | 'es'>('en');

  const [skuCount, setSkuCount] = useState(0); 
  const [needsStratification, setNeedsStratification] = useState(false);

  // --- AUTH STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  // --- BILLING STATE ---
  const [hasAgreed, setHasAgreed] = useState(false);

  // --- LEAD FORM STATE ---
  const [formData, setFormData] = useState({ country: '', industry: '', skuCount: '', hasFrontend: '', userEmail: '' });
  const [items, setItems] = useState(Array(10).fill(null).map(() => ({ name: '', brand: '', volume: '', description: '' })));
  const [submitting, setSubmitting] = useState(false);

const getInitializationPrice = (n: number) => {
  if (n <= 0) return 0;
  if (n <= 100) return 58.93;
  if (n <= 200) return 85.95;
  if (n <= 300) return 131.00;
  if (n <= 400) return 194.11;
  if (n <= 500) return 275.28;
  if (n <= 600) return 374.55;
  if (n <= 700) return 491.84;
  if (n <= 800) return 627.19;
  if (n <= 900) return 780.63;
  if (n <= 1000) return 952.10;
  return null; // Signals "Contact for Assessment"
};

  const initPrice = getInitializationPrice(skuCount);
  const stratificationPrice = skuCount > 300 && needsStratification ? 149.00 : 0;
  const finalTotal = initPrice + stratificationPrice;
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setView('dashboard');
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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const validItems = items.filter(i => i.name.trim() !== '');
    const itemsSummary = validItems.map((i, idx) => `ITEM_${idx+1}: [${i.name} | ${i.brand} | ${i.volume}]`).join('\n');
    const payload = { ...formData, items_summary: itemsSummary };

    try {
      await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', payload);
      alert("Success! Request sent to James.");
      setView('home');
    } catch (err) { alert("Sent to database, but email failed."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-10 text-center font-sans text-[#001529] font-bold">Recommendation Machine Initializing...</div>;

  // --- VIEW: TUTORIAL (MULTILINGUAL + DIAGRAM) ---
  if (view === 'tutorial') {
    const t = tutorialContent[lang];
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <nav className="h-16 px-8 flex items-center justify-between border-b bg-gray-50">
          <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-600 hover:text-black">
            <ChevronLeft size={20} /> {t.back}
          </button>
          <div className="flex gap-2">
            {['en', 'ko', 'ja', 'zh', 'es'].map((l) => (
              <button key={l} onClick={() => setLang(l as any)} className={`px-3 py-1 text-xs rounded border ${lang === l ? 'bg-[#001529] text-white' : 'bg-white text-gray-600'}`}>{l.toUpperCase()}</button>
            ))}
          </div>
        </nav>
        <div className="max-w-4xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl font-bold text-[#001529] mb-4">{t.title}</h1>
          <p className="text-xl text-blue-600 font-medium mb-6">{t.subtitle}</p>
          <p className="text-gray-600 leading-relaxed mb-12 text-lg">{t.description}</p>
          <div className="relative py-20 flex flex-col items-center">
            <div className="w-64 h-32 bg-blue-500/20 border-2 border-blue-600 rounded-lg transform -skew-x-12 flex items-center justify-center text-blue-800 font-bold shadow-xl relative z-20">{t.layerTop}</div>
            <div className="h-12 w-1 bg-gray-300 my-2"></div>
            <div className="w-64 h-32 bg-gray-100 border-2 border-gray-400 rounded-lg transform -skew-x-12 flex items-center justify-center text-gray-500 font-bold shadow-lg">{t.layerBottom}</div>
            <div className="mt-16 p-6 border-t-4 border-[#001529] bg-gray-50 rounded-b-xl w-full">
              <h3 className="text-2xl font-bold text-[#001529]">{t.result}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: TEST FORM (10 ITEMS) ---
  if (view === 'testForm') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans pb-20">
        <nav className="h-16 px-8 flex items-center justify-between border-b bg-white sticky top-0 z-50">
          <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-600 hover:text-black"><ChevronLeft size={20} /> Back</button>
          <span className="font-bold text-[#001529]">Model Feasibility Test</span>
        </nav>
        <form onSubmit={handleLeadSubmit} className="max-w-3xl mx-auto mt-12 px-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-6">
            <div><label className="block text-sm font-bold mb-2">1. Country</label><input className="w-full p-3 border rounded bg-gray-50" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required placeholder="e.g. Korea" /></div>
            <div><label className="block text-sm font-bold mb-2">2. Industry</label><input className="w-full p-3 border rounded bg-gray-50" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} required placeholder="e.g. Retail" /></div>
            <div><label className="block text-sm font-bold mb-2">3. SKU Count</label><input type="number" className="w-full p-3 border rounded bg-gray-50" value={formData.skuCount} onChange={e => setFormData({...formData, skuCount: e.target.value})} required /></div>
            <div><label className="block text-sm font-bold mb-4">5. Enter 10 Items</label>
              {items.map((item, idx) => (
                <div key={idx} className="mb-4 p-4 border rounded bg-gray-50 grid grid-cols-2 gap-2">
                  <input placeholder={`Item ${idx+1} Name`} className="p-2 border rounded text-sm" value={item.name} onChange={e => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} />
                  <input placeholder="Brand" className="p-2 border rounded text-sm" value={item.brand} onChange={e => { const n = [...items]; n[idx].brand = e.target.value; setItems(n); }} />
                </div>
              ))}
            </div>
            <div><label className="block text-sm font-bold mb-2">6. Your Email</label><input type="email" className="w-full p-3 border rounded bg-gray-50 border-blue-200" value={formData.userEmail} onChange={e => setFormData({...formData, userEmail: e.target.value})} required /></div>
            <button disabled={submitting} className="w-full py-4 bg-[#001529] text-white rounded-xl font-bold flex items-center justify-center gap-2">
              <Send size={20}/> {submitting ? 'Sending...' : 'Submit Request to James'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- VIEW: LOGIN / REGISTER ---
  if (view === 'login' && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <button onClick={() => setView('home')} className="mb-4 text-sm text-gray-500">← Back</button>
          <h2 className="text-2xl font-bold text-center mb-6">{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full p-3 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full p-3 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button className="w-full py-3 bg-[#001529] text-white rounded font-bold">{isRegistering ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-blue-600 text-sm w-full text-center">{isRegistering ? 'Login Instead' : 'Create Account Instead'}</button>
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
            <button onClick={() => setView('login')} className="text-gray-600 font-medium hover:text-black transition">Sign In</button>
            <button onClick={() => { setView('login'); setIsRegistering(true); }} className="bg-[#001529] text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-900 transition">Get Started</button>
          </div>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-white to-gray-50">
          <h1 className="text-6xl font-extrabold text-[#001529] max-w-4xl leading-tight">Global Knowledge. <br/> Local Results.</h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl">Precision recommendations for businesses that don't have Netflix-scale data.</p>
          <div className="mt-12 flex flex-col sm:flex-row gap-6">
            <button onClick={() => setView('tutorial')} className="px-8 py-4 border-2 rounded-xl font-bold flex items-center gap-2 hover:border-blue-400 transition"><Play size={20} className="text-blue-500" /> Step 1 - Tutorial</button>
            <button onClick={() => setView('testForm')} className="px-8 py-4 bg-[#001529] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition shadow-lg">Step 2 - Test with your items <ArrowRight size={20}/></button>
          </div>
        </main>
      </div>
    );
  }

  // --- DASHBOARD WRAPPER (SIDEBAR + LOGGED-IN CONTENT) ---
  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      <aside className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 text-lg font-bold border-b border-gray-700">Recommendation Machine</div>
        <nav className="flex-1 mt-6">
          <div onClick={() => setView('dashboard')} className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><LayoutDashboard size={20} /> Dashboard</div>
          <div onClick={() => setView('billing')} className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${view === 'billing' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><CreditCard size={20} /> Payment & Plan</div>
          <div onClick={() => setView('tutorial')} className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer text-gray-300"><GraduationCap size={20} /> Tutorial</div>
        </nav>
        <div onClick={() => { signOut(auth); setView('home'); }} className="p-6 border-t border-gray-700 hover:text-red-400 cursor-pointer flex items-center gap-3 text-gray-400 transition"><LogOut size={20} /> Sign Out</div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">{view}</h2>
          <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">{user?.email}</span>
        </header>
        <div className="p-8 overflow-y-auto">          
          {view === 'billing' && (
  <div className="max-w-5xl mx-auto space-y-8 pb-20">
    <div className="bg-white rounded-2xl shadow-sm border p-8">
      <h3 className="text-2xl font-bold text-[#001529] mb-6">1. Initialization Price Calculator</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: The Calculator */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Enter Total Distinct SKUs (N)</label>
            <input 
              type="number" 
              className="w-full p-4 border-2 border-blue-100 rounded-xl bg-gray-50 text-xl font-bold focus:border-blue-500 outline-none"
              placeholder="e.g. 500"
              value={skuCount || ''}
              onChange={(e) => setSkuCount(Number(e.target.value))}
            />
          </div>

          <div className="p-6 bg-[#001529] text-white rounded-xl shadow-inner">
            <div className="flex justify-between items-center mb-4 border-b border-blue-900 pb-4">
              <span className="text-blue-300">Total Combinations C(N,2):</span>
              <span className="text-2xl font-mono">
                {skuCount > 1 ? (skuCount * (skuCount - 1) / 2).toLocaleString() : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-300 font-bold">Initialization Price:</span>
              <span className="text-3xl font-black">
                {skuCount > 1000 ? (
                  <span className="text-lg text-yellow-400">Personal Assessment Required</span>
                ) : (
                  `$${getInitializationPrice(skuCount)}`
                )}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 italic">
            * C(N,2) represents the number of unique pair combinations calculated to build your co-purchase matrix.
          </div>
        </div>

        {/* Right: Reference Table */}
        <div className="bg-gray-50 rounded-xl p-4 border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-bold uppercase tracking-wider">Total Items</th>
                <th className="pb-2 font-bold uppercase tracking-wider text-right">Init. Price</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((val) => (
                <tr key={val} className={skuCount > val - 100 && skuCount <= val ? "bg-blue-100 font-bold" : ""}>
                  <td className="py-2">{val.toLocaleString()}</td>
                  <td className="py-2 text-right">${getInitializationPrice(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-[10px] rounded text-center border border-yellow-200 uppercase font-bold">
            Above 1,000 items: 1:1 Personal Assessment
          </div>
        </div>
      </div>
    </div>


    {/* NEW: STRATIFICATION OPTION */}
    <div className={`p-6 rounded-2xl border-2 transition-all ${needsStratification ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start gap-4">
        <input 
          type="checkbox" 
          className="w-6 h-6 mt-1 accent-[#001529]" 
          checked={needsStratification}
          onChange={(e) => setNeedsStratification(e.target.checked)}
        />
        <div>
          <h4 className="font-bold text-[#001529]">Add Data Stratification & Hygiene Audit</h4>
          <p className="text-sm text-gray-600">
            I need James to assist in creating 2-level categories to prune the co-purchase matrix and improve recommendation diversity.
          </p>
          {skuCount > 300 && (
            <span className="text-blue-600 font-bold text-sm">+$149.00 Audit Fee</span>
          )}
        </div>
      </div>
    </div>

 {/* UPDATED: PAYMENT ACTIONS */}
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <div className="mb-8">
        <h3 className="font-bold mb-2">Final Quote</h3>
        <div className="flex justify-between items-end">
          <div className="text-sm text-gray-500">
            Initialization: ${initPrice} <br/>
            {stratificationPrice > 0 && <>Data Audit: ${stratificationPrice} <br/></>}
            <span className="text-xl font-bold text-[#001529]">Total: ${finalTotal.toFixed(2)}</span>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-[#001529]" checked={hasAgreed} onChange={e => setHasAgreed(e.target.checked)} />
            <span className="text-sm font-semibold">I accept this custom quote.</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <button 
          disabled={!hasAgreed || skuCount > 1000 || skuCount === 0}
          onClick={() => alert(`Requesting Invoice for $${finalTotal.toFixed(2)}`)}
          className="flex-1 py-4 bg-[#001529] text-white rounded-xl font-bold disabled:bg-gray-200"
        >
          {skuCount > 1000 ? "Request Personal Assessment" : "Request Setup Invoice"}
        </button>
        
        {/* Monthly Plan remains the same */}
         <div className="flex-1 p-4 bg-green-50 border-2 border-green-100 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-green-700 uppercase">Monthly Maintenance</div>
            <div className="text-2xl font-black text-[#001529]">$99<span className="text-sm font-normal">/mo</span></div>
          </div>
          <button 
            disabled={!hasAgreed}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-200 transition"
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  </div>
)}                  
          {view === 'dashboard' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-8">
                <Upload className="mx-auto text-blue-600 mb-4" size={40} />
                <h3 className="text-lg font-medium">Upload Production Data</h3>
                <p className="text-gray-500">Your UID: {user?.uid.slice(0,8)}...</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6"><h4 className="font-bold mb-4">Latest Model Status</h4><p className="text-sm text-gray-500 italic">No production data uploaded yet. Please pay initialization fee to activate.</p></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
