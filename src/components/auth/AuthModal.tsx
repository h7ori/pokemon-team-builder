'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogIn, Sparkles, Shield, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, authModalMessage, login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);

  if (!showAuthModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(name || 'Pokémon Trainer', email || 'trainer@pokebuilder.com');
  };

  const handleQuickDemoLogin = (trainerName: string, trainerEmail: string) => {
    login(trainerName, trainerEmail);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={() => setShowAuthModal(false)}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-5 bg-slate-900 border-slate-700 text-white"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-3 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  {isSignUp ? 'Create Trainer Account' : 'Sign In'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isSignUp ? 'Sign in to save and manage your teams' : 'Welcome back, Trainer!'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Account Notice Banner */}
          {authModalMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
              <span>{authModalMessage}</span>
            </div>
          )}

          {/* Account vs Guest mode info */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              Account Requirement Notice
            </div>
            <p className="leading-relaxed text-[11px] text-slate-400">
              You can test the Team Builder & Damage Calculator in <strong>Guest Mode</strong> without an account, but saving your teams to your library requires an account!
            </p>
          </div>

          {/* Sign In / Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Trainer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Red, Ash, Cynthia"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainer@pokebuilder.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500 flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              {isSignUp ? 'Create Account & Save Team' : 'Sign In'}
            </button>
          </form>

          {/* 1-Click Quick Demo Login options */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 text-center">
              Or Instant 1-Click Sign In
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Red', 'red@kanto.com')}
                className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all text-center"
              >
                Sign in as <strong>Red</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Cynthia', 'cynthia@sinnoh.com')}
                className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all text-center"
              >
                Sign in as <strong>Cynthia</strong>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
