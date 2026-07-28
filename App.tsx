import React, { useState, useEffect } from 'react';
import { Upload, FileText, LayoutDashboard, GraduationCap, LogOut, Mail, Lock, Play, ArrowRight, Globe, ChevronLeft } from 'lucide-react';
import { auth } from './firebaseConfig'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// --- TRANSLATIONS DICTIONARY ---
const content: any = {
  en: {
    title: "How It Works",
    subtitle: "Enterprise-grade recommendations for businesses of all sizes.",
    description: "Most small businesses don't have enough data to build models like Netflix. We solve this by combining general market trends with your specific customer data.",
    layerTop: "Business-Specific Matrix (Your Data)",
    layerBottom: "General Co-purchase Matrix (Market Trends)",
    result: "Final Model: Your Unique Recommendation Engine",
    back: "Back to Home"
  },
  ko: {
    title: "작동 원리",
    subtitle: "모든 규모의 비즈니스를 위한 기업급 추천 시스템",
    description: "대부분의 중소기업은 넷플릭스와 같은 모델을 만들기에 데이터가 부족합니다. 우리는 일반적인 시장 트렌드와 귀하의 특정 고객 데이터를 결합하여 이를 해결합니다.",
    layerTop: "비즈니스별 매트릭스 (귀하의 데이터)",
    layerBottom: "일반 공동 구매 매트릭스 (시장 트렌드)",
    result: "최종 모델: 귀하만의 독특한 추천 엔진",
    back: "홈으로 돌아가기"
  },
  ja: {
    title: "仕組みについて",
    subtitle: "あらゆる規模のビジネスに対応するエン터プライ즈級の推奨事項",
    description: "ほとんどの中小企業は、Netflixのようなモデルを構築するのに十分なデータを持っていません。私たちは、一般的な市場動向とお客様の特定の顧客データを組み合わせることでこれを解決します。",
    layerTop: "ビジネス固有のマトリックス (自社データ)",
    layerBottom: "一般共同購入マトリックス (市場トレンド)",
    result: "最終モデル：独自のレコメンデーションエンジン",
    back: "ホームに戻る"
  },
  zh: {
    title: "工作原理",
    subtitle: "适用于各种规模企业的企业级推荐",
    description: "大多数小企业没有足够的数据来构建像 Netflix 这样的模型。我们通过将一般市场趋势与您的特定客户数据相结合来解决这个问题。",
    layerTop: "业务特定矩阵 (您的数据)",
    layerBottom: "通用共同购买矩阵 (市场趋势)",
    result: "最终模型：您独特的推荐引擎",
    back: "回到首页"
  },
  es: {
    title: "Cómo Funciona",
    subtitle: "Recomendaciones de nivel empresarial para empresas de todos los tamaños.",
    description: "La mayoría de las pequeñas empresas no tienen suficientes datos para crear modelos como Netflix. Resolvemos esto combinando las tendencias generales del mercado con sus datos de clientes específicos.",
    layerTop: "Matriz específica del negocio (Sus datos)",
    layerBottom: "Matriz general de co-compra (Tendencias del mercado)",
    result: "Modelo final: Su motor de recomendación único",
    back: "Volver al inicio"
  }
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'login' | 'dashboard' | 'tutorial'>('home');
  const [lang, setLang] = useState<'en' | 'ko' | 'ja' | 'zh' | 'es'>('en');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    } catch (err: any) { setError(err.message); }
  };

  if (loading) return <div className="p-10 text-center font-sans">Initializing...</div>;

  // --- VIEW: TUTORIAL (The 2-Layer Matrix Logic) ---
  if (view === 'tutorial') {
    const t = content[lang];
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <nav className="h-16 px-8 flex items-center justify-between border-b bg-gray-50">
          <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-600 hover:text-black">
            <ChevronLeft size={20} /> {t.back}
          </button>
          <div className="flex gap-2">
            {['en', 'ko', 'ja', 'zh', 'es'].map((l) => (
              <button 
                key={l} 
                onClick={() => setLang(l as any)}
                className={`px-3 py-1 text-xs rounded border ${lang === l ? 'bg-[#001529] text-white' : 'bg-white text-gray-600'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl font-bold text-[#001529] mb-4">{t.title}</h1>
          <p className="text-xl text-blue-600 font-medium mb-6">{t.subtitle}</p>
          <p className="text-gray-600 leading-relaxed mb-12 text-lg">{t.description}</p>

          {/* DIAGRAM SECTION */}
          <div className="relative py-20 flex flex-col items-center">
            {/* Top Matrix Layer */}
            <div className="w-64 h-32 bg-blue-500/20 border-2 border-blue-600 rounded-lg transform -skew-x-12 flex items-center justify-center text-blue-800 font-bold shadow-xl relative z-20">
              {t.layerTop}
            </div>
            
            {/* Connector */}
            <div className="h-12 w-1 bg-gray-300 my-2"></div>

            {/* Bottom Matrix Layer */}
            <div className="w-64 h-32 bg-gray-100 border-2 border-gray-400 rounded-lg transform -skew-x-12 flex items-center justify-center text-gray-500 font-bold shadow-lg">
              {t.layerBottom}
            </div>

            {/* Addition Sign */}
            <div className="absolute right-1/4 top-1/2 transform translate-x-20 text-4xl font-light text-gray-400">+</div>

            <div className="mt-16 p-6 border-t-4 border-[#001529] bg-gray-50 rounded-b-xl w-full">
              <h3 className="text-2xl font-bold text-[#001529]">{t.result}</h3>
            </div>
          </div>
        </div>
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
            <button className="flex items-center gap-3 px-8 py-4 bg-[#001529] text-white rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg">
              Step 2 - Test with your items <ArrowRight size={20} />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- VIEW: LOGIN --- (Existing Logic)
  if (view === 'login' && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full p-3 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full p-3 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full py-3 bg-[#001529] text-white rounded font-bold">{isRegistering ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="mt-4 text-blue-600 text-sm w-full text-center">
            {isRegistering ? 'Have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD --- (Existing Logic)
  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      <aside className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 text-lg font-bold border-b border-gray-700">Recommendation Machine</div>
        <nav className="flex-1 mt-6">
          <div className="px-4 py-3 bg-blue-600 flex items-center gap-3"><LayoutDashboard size={20} /> Dashboard</div>
          <div onClick={() => setView('tutorial')} className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer"><GraduationCap size={20} /> Tutorial</div>
        </nav>
        <div onClick={() => signOut(auth)} className="p-6 border-t border-gray-700 flex items-center gap-3 cursor-pointer"><LogOut size={20} /> Sign Out</div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Welcome, {user?.email}</h2>
        <div className="bg-white p-12 border-2 border-dashed border-gray-300 rounded-xl text-center">
          <Upload className="mx-auto text-blue-600 mb-4" size={40} />
          <h3 className="text-lg font-medium">Ready to upload data?</h3>
        </div>
      </main>
    </div>
  );
}
