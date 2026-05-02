import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../auth";

export default function Welcome({ onNext }: { onNext: () => void }) {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
      onNext(); // Navigate to Dashboard after successful login
    } catch (e) {
      console.error("Login failed:", e);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* BRAND SIDE: FIGMA MATCH */}
      <div className="flex-[1.2] bg-white p-12 border-r border-slate-100 flex flex-col items-center justify-center">
        <img src="/logo.jpeg" alt="Absentbox Logo" className="w-[220px] mb-10" />
        <div className="max-w-[380px] space-y-4">
          {[
            "Automatic filtering of important and urgent emails",
            "Intelligent categorization of emails",
            "Summary of longer emails and feedbacks",
            "Quick overview of tasks assigned to you",
            "Recognition and filtering of spam/newsletters"
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="text-red-500 font-bold">✓</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* FORM SIDE: FIGMA MATCH */}
      <div className="flex-1 p-12 flex flex-col justify-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-10">Welcome To Absentbox!</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Email</label>
            <input 
              type="email" 
              placeholder="mario@absentbox.de"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Password</label>
            <input 
              type="password" 
              placeholder="********"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-red-500" defaultChecked /> Save Login data
            </label>
            <a href="#" className="hover:text-red-500 transition-colors">Forgot your password?</a>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full py-4 border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            Sign in with Microsoft
          </button>

          <div className="pt-10 text-center">
            <p className="text-xs text-slate-400 mb-4 font-semibold uppercase tracking-widest">Not registered yet?</p>
            <button className="w-full py-4 border-2 border-slate-800 text-slate-800 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-all">
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
