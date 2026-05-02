import React, { useState } from 'react';
import { Calendar, User, Shield, CheckCircle } from 'lucide-react';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);

  const steps = [
    { title: 'Profile Setup', icon: <User size={20}/> },
    { title: 'Absence Period', icon: <Calendar size={20}/> },
    { title: 'Rules', icon: <Shield size={20}/> },
    { title: 'Success', icon: <CheckCircle size={20}/> }
  ];

  return (
    <div className="p-8 max-w-md mx-auto">
      {/* Progress Stepper */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
        {steps.map((s, i) => (
          <div key={i} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${step > i ? 'bg-red-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
            {s.icon}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold mb-2">Configure Your Profile</h2>
          <p className="text-sm text-slate-500 mb-8">Let's set up how you want to be seen.</p>
          <div className="space-y-4">
             <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-50">Upload</div>
             <input type="text" placeholder="Your Display Name" className="w-full p-3 bg-slate-50 border rounded-lg" />
             <button onClick={() => setStep(2)} className="w-full py-3 bg-red-500 text-white rounded-lg font-bold mt-8">Next Step</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in">
          <h2 className="text-2xl font-bold mb-2">When were you away?</h2>
          <p className="text-sm text-slate-500 mb-8">Select the dates you want us to process.</p>
          <div className="grid grid-cols-1 gap-4">
             <input type="date" className="p-3 border rounded-lg" />
             <input type="date" className="p-3 border rounded-lg" />
             <button onClick={() => setStep(3)} className="w-full py-3 bg-red-500 text-white rounded-lg font-bold mt-8">Apply Filter</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in">
          <h2 className="text-2xl font-bold mb-2">Smart Rules</h2>
          <p className="text-sm text-slate-500 mb-8">What should we prioritize first?</p>
          <div className="space-y-3">
             <RuleToggle label="Identify Customers automatically" />
             <RuleToggle label="Flag emails from my supervisor" />
             <RuleToggle label="Group newsletters together" />
             <button onClick={() => setStep(4)} className="w-full py-3 bg-red-500 text-white rounded-lg font-bold mt-8">Finish Setup</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center animate-bounce-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
          <p className="text-sm text-slate-500 mb-8">Absentbox is now ready to clean your inbox.</p>
          <button onClick={onComplete} className="w-full py-3 bg-red-500 text-white rounded-lg font-bold">Go to Dashboard</button>
        </div>
      )}
    </div>
  );
}

function RuleToggle({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
      <span className="text-sm font-semibold">{label}</span>
      <div className="w-10 h-5 bg-red-500 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div>
    </div>
  );
}
