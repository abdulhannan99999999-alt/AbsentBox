import React from 'react';
import { Mail, Clock, Shield, Star, Users, Briefcase, Trash2, Send, Calendar, UserPlus } from 'lucide-react';

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const categories = [
    { name: 'High priority', count: 10, color: 'bg-red-500', active: true },
    { name: 'Customer', count: 22, color: 'bg-emerald-100 text-emerald-800' },
    { name: 'Supervisor', count: 4, color: 'bg-emerald-100 text-emerald-800' },
    { name: 'In CC', count: 34, color: 'bg-slate-100 text-slate-800' },
  ];

  return (
    <div className="p-5">
      {/* Top Bar - Figma Match */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 overflow-x-auto scrollbar-hide">
        <div className="w-10 h-10 rounded-full bg-red-400 flex items-center justify-center text-white font-bold shrink-0">MK</div>
        {categories.map((cat, i) => (
          <div key={i} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${cat.active ? 'bg-red-500 text-white' : cat.color}`}>
            {cat.name} <span className="bg-black/10 px-1.5 py-0.5 rounded-md text-[10px]">{cat.count}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-8 mt-6">
        {/* Sidebar - Figma Match */}
        <aside className="w-32 flex flex-col gap-6">
          <div className="w-16 h-16 rounded-full border-[4px] border-red-500 flex items-center justify-center text-2xl font-bold">227</div>
          <nav className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
            <button className="flex items-center gap-2 hover:text-red-500"><Clock size={14}/> Answer today</button>
            <button className="flex items-center gap-2 hover:text-red-500"><Send size={14}/> Forward</button>
            <button className="flex items-center gap-2 hover:text-red-500"><Calendar size={14}/> Plan meeting</button>
            <button className="flex items-center gap-2 hover:text-red-500"><UserPlus size={14}/> Delegate</button>
            <button className="text-slate-400 italic font-normal">+ add your label</button>
          </nav>
        </aside>

        {/* Email List - Figma Match */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold">High Priority</h2>
             <select className="text-xs bg-transparent border-none font-semibold outline-none cursor-pointer">
                <option>Sort: Newest</option>
             </select>
          </div>
          
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-slate-50 relative group cursor-pointer hover:bg-slate-50/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold">AL</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">Andreas Lange</span>
                  <span className="text-[10px] text-slate-400">16 Sep 2018</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pr-8">
                  Hi Mario, regarding the project proposal we discussed last week...
                </p>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
