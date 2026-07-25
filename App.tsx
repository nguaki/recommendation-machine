*import React, { useState } from 'react';
import { Upload, FileText, LayoutDashboard, GraduationCap, LogOut } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState([
    { name: 'sample_data.csv', size: '1.2 MB', date: '2023-11-01' }
  ]);

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Sidebar - Dark Navy */}
      <aside className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 text-lg font-bold border-b border-gray-700">
          Recommendation Machine
        </div>
        <nav className="flex-1 mt-6">
          <div className="px-4 py-3 bg-blue-600 flex items-center gap-3 cursor-pointer">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className="px-4 py-3 hover:bg-gray-800 flex items-center gap-3 cursor-pointer text-gray-300">
            <GraduationCap size={20} /> Tutorial
          </div>
        </nav>
        <div className="p-6 border-t border-gray-700 hover:text-red-400 cursor-pointer flex items-center gap-3 text-gray-400">
          <LogOut size={20} /> Sign Out
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Client Data Console</h2>
        </header>
        <div className="p-8 overflow-y-auto">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-8">
            <Upload className="mx-auto text-blue-600 mb-4" size={40} />
            <h3 className="text-lg font-medium text-gray-900">Upload transactional data</h3>
            <p className="text-gray-500">Select a CSV file to begin analysis</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-sm font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {files.map((file, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-2"><FileText size={16}/> {file.name}</td>
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
