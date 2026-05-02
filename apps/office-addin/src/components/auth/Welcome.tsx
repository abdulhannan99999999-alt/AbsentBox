import React from 'react';

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-8">
      <img src="/logo.jpeg" alt="Absentbox Logo" className="w-48 mb-12" />
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome To Absentbox!</h1>
      <p className="text-slate-500 mb-12">Your industrial mailbox assistant.</p>
      <button 
        onClick={onNext}
        className="px-12 py-4 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors"
      >
        Sign in with Microsoft
      </button>
    </div>
  );
}
