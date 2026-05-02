import React from 'react';
import { Check } from 'lucide-react';

export default function Billing({ onBack }: { onBack: () => void }) {
  const plans = [
    {
      name: '14 Day Trial',
      price: '0',
      features: ['Wunderbar einfache Projektplanung', 'Kostenlos'],
      btn: 'Wählen',
      highlight: false
    },
    {
      name: 'Free',
      price: '0',
      features: ['Entrümpeln Sie Ihren Kopf und sparen Sie Zeit mit Free.', 'Unbegrenzte Umfrageerstellung', 'Unbegrenztes Teilen', 'Vorranging Support'],
      btn: 'Wählen',
      highlight: true
    },
    {
      name: 'Premium',
      price: '15',
      features: ['Entrümpeln Sie Ihren Kopf und sparen Sie Zeit mit Premium.', 'Alle Free Features', 'Erweiterte Analytics', 'Vorranging Support', 'Eigene Branding-Optionen'],
      btn: 'Wählen',
      highlight: false
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-8 text-sm text-slate-500 hover:text-black">← Back to Dashboard</button>
      
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Wähle deinen Plan</h1>
        <p className="text-slate-500 text-sm">Wählen Sie monatlich oder jährlich und können Sie jederzeit kündigen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <div key={i} className={`p-8 rounded-2xl border ${plan.highlight ? 'border-blue-500 ring-4 ring-blue-50 shadow-xl' : 'border-slate-100'} relative bg-white`}>
            {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">Beliebt</span>}
            
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">€</span>
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-400 text-xs">/ Monat</span>
              </div>
            </div>

            <button className={`w-full py-2.5 rounded-lg font-bold text-sm mb-8 transition-all ${plan.highlight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white text-blue-500 border border-blue-500 hover:bg-blue-50'}`}>
              {plan.btn}
            </button>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kernfunktionen</p>
              {plan.features.map((feat, j) => (
                <div key={j} className="flex gap-3 items-start">
                  <Check size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-tight">{feat}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
