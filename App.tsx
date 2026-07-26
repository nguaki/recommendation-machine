import React, { useState, useEffect } from 'react';
import { Upload, FileText, LayoutDashboard, GraduationCap, LogOut } from 'lucide-react';
// We import our Firebase logic from the config file we made earlier
import { auth } from './firebaseConfig'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  // --- STATE MANAGEMENT ---
  // Like member variables in a class
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [files] = useState([
    { name: 'sample_data.csv', size: '1.2 MB', date: '2023-11-01' }
  ]);

  // --- LIFECYCLE / CONSTRUCTOR ---
  // This runs when the app "Mounts" (starts up)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup on destroy
  }, []);

  // --- EVENT HANDLERS ---
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("You have been signed out.");
      // The useEffect above will automatically see the change and update the UI
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleUploadClick = () => {
    alert("Upload logic triggered! Next step: Connecting to GCP Bucket.");
  };

  const handleTutorialClick = () => {
    alert("Tutorial coming soon: Explaining the Recommendation Model logic.");
  };

  // --- CONDITIONAL RENDERING ---
  
  if (loading) return <div className="p-10 text-center font-sans">Loading Recommendation Machine...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 font-sans">
        <h1 className="text-2xl font-bold mb-4 text-[#001529]">Recommendation Machine</h1>
        <p className="mb-6 text-gray-600">Please sign in to access your data assets.</p>
        <button 
          onClick={() => window.location.reload()} // Quick hack to refresh for now
          className="bg-[#001529] text-white px-6 py-2 rounded shadow hover:bg-blue-900 transition"
        >
          Go to Login Screen
        </button>
      </div>
    );
  }

  // --- THE MAIN DASHBOARD UI ---
  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      {/* Sidebar - Dark Navy */}
      <aside className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 text-lg font-bold border-b border-gray-700">
          Recommendation Machine
        </div>
        <nav className="flex-1 mt-6">
          <div className="px-4 py-3 bg-blue-600 flex items-center gap-3 cursor-pointer">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div 
            onClick={handleTutorialClick}
            className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer text-gray-300 transition"
          >
            <GraduationCap size={20} /> Tutorial
          </div>
        </nav>

        {/* SIGN OUT BUTTON (Now Functional) */}
        <div 
          onClick={handleSignOut}
          className="p-6 border-t border-gray-700 hover:text-red-400 cursor-pointer flex items-center gap-3 text-gray-400 transition"
        >
          <LogOut size={20} /> Sign Out
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Client Data Console</h2>
          <div className="text-sm text-gray-500">User: {user.email}</div>
        </header>

        <div className="p-8 overflow-y-auto">
          {/* Upload Area (Now Functional) */}
          <div 
            onClick={handleUploadClick}
            className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer mb-8"
          >
            <Upload className="mx-auto text-blue-600 mb-4" size={40} />
            <h3 className="text-lg font-medium text-gray-900">Upload transactional data</h3>
            <p className="text-gray-500 mt-1">Files will be isolated in your unique GCP directory</p>
          </div>

          {/* File Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">File Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Size</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((file, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-2 text-gray-800"><FileText size={16} className="text-gray-400"/> {file.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{file.size}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{file.date}</td>
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
