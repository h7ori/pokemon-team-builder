'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, FileText, Check, AlertCircle } from 'lucide-react';
import { parseShowdownSet, parseShowdownTeam, exportShowdownSet, exportShowdownTeam } from '@/lib/pokemon/showdown-parser';
import type { TeamPokemon } from '@/types/pokemon';

interface ShowdownPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'team';
  currentPokemon?: TeamPokemon;
  currentTeam?: TeamPokemon[];
  onImportSingle?: (pokemon: TeamPokemon) => void;
  onImportTeam?: (pokemonList: TeamPokemon[]) => void;
}

export function ShowdownPasteModal({
  isOpen,
  onClose,
  mode,
  currentPokemon,
  currentTeam,
  onImportSingle,
  onImportTeam,
}: ShowdownPasteModalProps) {
  const initialText =
    mode === 'single'
      ? currentPokemon
        ? exportShowdownSet(currentPokemon)
        : ''
      : currentTeam
      ? exportShowdownTeam(currentTeam)
      : '';

  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    setError('');
    if (!text.trim()) {
      setError('Please paste a Showdown set or team string.');
      return;
    }

    try {
      if (mode === 'single' && onImportSingle) {
        const parsed = parseShowdownSet(text);
        if (!parsed.species) {
          setError('Could not parse valid Pokémon species from text.');
          return;
        }
        onImportSingle(parsed);
      } else if (mode === 'team' && onImportTeam) {
        const parsedTeam = parseShowdownTeam(text);
        if (parsedTeam.length === 0) {
          setError('Could not parse any valid Pokémon from text.');
          return;
        }
        onImportTeam(parsedTeam);
      }
      onClose();
    } catch (e) {
      setError('Failed to parse Showdown set. Check format.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative z-10 w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-4"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              <FileText className="h-5 w-5 text-indigo-500" />
              {mode === 'single' ? 'Showdown Set Import / Export' : 'Showdown Team Import / Export'}
            </div>
            <button
              onClick={onClose}
              className="text-sm px-2 py-1 rounded-lg"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              Close
            </button>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Paste or copy Pokémon Showdown format text below.
          </p>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError('');
            }}
            placeholder={`Lapras-Gmax @ Light Clay  
Ability: Shell Armor  
Level: 87  
Tera Type: Water  
EVs: 236 HP / 88 Def / 140 SpA / 36 SpD / 8 Spe  
Modest Nature  
IVs: 0 Atk  
- Muddy Water  
- Freeze-Dry  
- Psychic Noise  
- Protect`}
            rows={12}
            className="w-full rounded-xl border p-4 font-mono text-xs outline-none focus:border-indigo-500 transition-colors"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          />

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied to Clipboard' : 'Copy Text'}
            </button>

            <button
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Import Set
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
