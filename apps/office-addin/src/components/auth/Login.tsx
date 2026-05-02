import React from 'react';

export default function Login({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) {
  return (
    <div className="flex min-h-screen p-8 gap-12 bg-white">
      {/* Figma Left Column: Branding & Features */}
      <div className="flex-1 border-r border-slate-100 pr-12 flex flex-col items-center justify-center">
        <img src="../../logo.jpeg" alt="Logo" className="w-48 mb-12" />
        <div className="space-y-4 text-left max-w-sm">
          <FeatureItem text="Automatic filtering of important and urgent emails" />
          <FeatureItem text="Intelligent categorization of emails" />
          <FeatureItem text="Summary of longer emails and feedbacks" />
          <FeatureItem text="Quick overview of tasks assigned to you" />
          <FeatureItem text="Recognition and filtering of spam/newsletters" />
        </div>
      </div>

      {/* Figma Right Column: Action */}
      <div className="flex-1 flex flex-col justify-center max-w-sm">
        <h2 className="text-3xl font-bold mb-10 text-slate-800">Welcome To Absentbox!</h2>
        <div className="space-y-6">
          <InputGroup label="EMAIL" placeholder="mario@absentbox.de" type="email" />
          <InputGroup label="PASSWORD" placeholder="********" type="password" />
          
          <div className="flex justify-between items-center text-xs text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" defaultChecked /> Save Login data
            </label>
            <button className="hover:underline">Forgot your password?</button>
          </div>

          <button onClick={onLogin} className="w-full py-3.5 rounded-lg border-2 border-red-500 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all">
            Login
          </button>

          <div className="pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-4">Not registered yet?</p>
            <button onClick={onRegister} className="w-full py-3.5 rounded-lg border-2 border-slate-800 text-slate-800 font-bold hover:bg-slate-800 hover:text-white transition-all">
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-red-500 font-bold mt-0.5">✓</span>
      <p className="text-xs leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function InputGroup({ label, placeholder, type }: { label: string, placeholder: string, type: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">{label}</label>
      <input type={type} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder={placeholder} />
    </div>
  );
}
