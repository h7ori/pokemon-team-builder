'use client';

import { motion } from 'framer-motion';
import { FolderOpen, Plus, Star, Archive, Trash2, Copy, MoreHorizontal, ShieldAlert, LogIn } from 'lucide-react';
import { useTeamStore } from '@/stores/team-store';
import { useAuthStore } from '@/stores/auth-store';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const {
    teams,
    createTeam,
    setActiveTeam,
    deleteTeam,
    duplicateTeam,
    toggleFavorite,
    toggleArchive,
  } = useTeamStore();

  const { isLoggedIn, setShowAuthModal } = useAuthStore();
  const router = useRouter();

  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredTeams = useMemo(() => {
    switch (filter) {
      case 'favorites':
        return teams.filter((t) => t.isFavorite && !t.isArchived);
      case 'archived':
        return teams.filter((t) => t.isArchived);
      default:
        return teams.filter((t) => !t.isArchived);
    }
  }, [teams, filter]);

  const sortedTeams = useMemo(
    () => [...filteredTeams].sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredTeams]
  );

  const handleNewTeam = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true, 'Sign in or create an account to save teams to your library!');
      return;
    }
    const id = createTeam();
    setActiveTeam(id);
    router.push('/team-builder');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none">
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              My Teams
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {teams.length} team{teams.length !== 1 ? 's' : ''} saved {isLoggedIn ? 'in your account' : '(Sign in to save)'}
            </p>
          </div>
        </div>

        <button
          onClick={handleNewTeam}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Team
        </button>
      </motion.div>

      {/* Account Notice if Guest */}
      {!isLoggedIn && (
        <div className="card p-4 bg-amber-500/10 border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-amber-300">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Guest Mode Active:</strong> Teams are only saved to persistent library when signed in to an account.
            </span>
          </div>
          <button
            onClick={() => setShowAuthModal(true, 'Sign in or create an account to save your teams!')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black shadow hover:bg-amber-400 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In / Register
          </button>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2"
      >
        {[
          { key: 'all' as const, label: 'All Teams' },
          { key: 'favorites' as const, label: 'Favorites' },
          { key: 'archived' as const, label: 'Archived' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background:
                filter === f.key ? 'var(--color-primary)' : 'var(--bg-secondary)',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Teams list */}
      {sortedTeams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card flex flex-col items-center justify-center py-16 text-center space-y-3"
        >
          <FolderOpen
            className="h-12 w-12 text-slate-500"
          />
          <p className="text-base font-bold text-white">
            No teams saved yet
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            {isLoggedIn
              ? 'Create your first team to get started building and optimizing competitive sets.'
              : 'Sign in to create and save teams to your account library across devices.'}
          </p>
          <button
            onClick={handleNewTeam}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {isLoggedIn ? 'Create Team' : 'Sign In & Create Team'}
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {sortedTeams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card card-interactive p-4 relative"
            >
              <Link
                href="/team-builder"
                onClick={() => setActiveTeam(team.id)}
                className="flex items-center gap-4"
              >
                {/* Pokémon sprites */}
                <div className="flex -space-x-2 flex-shrink-0">
                  {team.pokemon.length > 0 ? (
                    team.pokemon.slice(0, 6).map((p, j) => (
                      <div
                        key={p.id}
                        className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center"
                        style={{
                          background: 'var(--bg-secondary)',
                          borderColor: 'var(--bg-card)',
                          zIndex: 6 - j,
                        }}
                      >
                        {p.species && (
                          <PokemonSprite
                            name={p.species}
                            dexNum={0}
                            size={32}
                            animated={false}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center border-dashed"
                      style={{
                        borderColor: 'var(--border-secondary)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-semibold truncate text-white"
                    >
                      {team.name}
                    </h3>
                    {team.isFavorite && (
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p
                    className="text-xs text-slate-400"
                  >
                    {team.pokemon.length}/6 Pokémon • Gen {team.generation} •
                    Updated {new Date(team.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>

              {/* Actions menu */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(menuOpen === team.id ? null : team.id);
                  }}
                  className="p-1.5 rounded-lg transition-colors text-slate-400 hover:bg-slate-800"
                  aria-label="Team options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {menuOpen === team.id && (
                  <div
                    className="absolute right-0 mt-1 w-40 rounded-xl border overflow-hidden z-20 shadow-lg bg-slate-900 border-slate-800"
                  >
                    <button
                      onClick={() => {
                        toggleFavorite(team.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {team.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button
                      onClick={() => {
                        duplicateTeam(team.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        toggleArchive(team.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {team.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => {
                        deleteTeam(team.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
