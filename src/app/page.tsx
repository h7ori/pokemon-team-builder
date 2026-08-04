'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Swords,
  Calculator,
  FolderOpen,
  TrendingUp,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Plus,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { useTeamStore } from '@/stores/team-store';
import { useAuthStore } from '@/stores/auth-store';
import { PokemonSprite } from '@/components/shared/PokemonSprite';
import { TypeBadge } from '@/components/shared/TypeBadge';
import type { PokemonType } from '@/types/pokemon';
import { Dex } from '@pkmn/dex';

const FEATURES = [
  {
    href: '/team-builder',
    icon: Swords,
    title: 'Team Builder',
    description: 'Build and customize your perfect team with full EV/IV, move, and ability support.',
    gradient: 'from-indigo-500 to-purple-600',
    color: '#6366F1',
  },
  {
    href: '/calculator',
    icon: Calculator,
    title: 'Damage Calculator',
    description: 'Calculate exact damage ranges, KO chances, and optimize your sets.',
    gradient: 'from-emerald-500 to-teal-600',
    color: '#10B981',
  },
  {
    href: '/teams',
    icon: FolderOpen,
    title: 'My Teams',
    description: 'Save, organize, and manage unlimited teams with import/export support.',
    gradient: 'from-amber-500 to-orange-600',
    color: '#F59E0B',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function DashboardPage() {
  const { teams, createTeam, setActiveTeam } = useTeamStore();
  const { user, isLoggedIn, setShowAuthModal } = useAuthStore();

  const recentTeams = teams
    .filter((t) => !t.isArchived)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  // Dynamic Most Used Pokémon calculation
  const mostUsedPokemon = useMemo(() => {
    const counts: Record<string, { name: string; num: number; count: number; types: PokemonType[] }> = {};

    teams.forEach((team) => {
      team.pokemon.forEach((p) => {
        if (p.species) {
          if (!counts[p.species]) {
            const spec = Dex.species.get(p.species);
            counts[p.species] = {
              name: p.species,
              num: spec?.num || 0,
              count: 0,
              types: (spec?.types as PokemonType[]) || ['Normal'],
            };
          }
          counts[p.species].count += 1;
        }
      });
    });

    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted.slice(0, 6);
  }, [teams]);

  const handleNewTeam = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true, 'Sign in or create an account to save new teams!');
      return;
    }
    const id = createTeam();
    setActiveTeam(id);
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-8 select-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl p-8 lg:p-12" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-purple-300/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {isLoggedIn && user ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 border border-white/20">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                Welcome back, {user.name}!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-xs font-semibold text-amber-300 border border-amber-500/30">
                Guest Mode — Sign in to save teams to your account
              </div>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Pokémon Team Builder
            </h1>
            <p className="text-slate-300 text-lg max-w-lg">
              Build, analyze, and optimize your competitive teams with a premium 
              modern experience.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleNewTeam}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                New Team
              </button>
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Calculator className="h-4 w-4" />
                Calculator
              </Link>
            </div>
          </div>

          {/* Showcase Pokémon */}
          <div className="hidden lg:flex items-end gap-1">
            {mostUsedPokemon.length > 0
              ? mostUsedPokemon.slice(0, 3).map((pkmn, i) => (
                  <motion.div
                    key={pkmn.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                    className="relative"
                  >
                    <PokemonSprite
                      name={pkmn.name}
                      dexNum={pkmn.num}
                      size={i === 1 ? 110 : 85}
                      animated
                    />
                  </motion.div>
                ))
              : ['Garchomp', 'Dragapult', 'Iron Valiant'].map((name, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                    className="relative"
                  >
                    <PokemonSprite
                      name={name}
                      dexNum={0}
                      size={i === 1 ? 110 : 85}
                      animated
                    />
                  </motion.div>
                ))}
          </div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <motion.div
                className="card card-interactive p-6 h-full"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feature.description}
                </p>
                <div
                  className="flex items-center gap-1 mt-4 text-sm font-medium"
                  style={{ color: feature.color }}
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Star, label: 'Total Teams', value: teams.length, color: '#F59E0B' },
          { icon: Zap, label: 'Pokémon Used', value: teams.reduce((acc, t) => acc + t.pokemon.length, 0), color: '#6366F1' },
          { icon: TrendingUp, label: 'Generations', value: '1-9', color: '#10B981' },
          { icon: Shield, label: 'All Pokémon', value: '1500+', color: '#EF4444' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Requirement 1: Most Used Pokémon by You */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Most Used Pokémon by You
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Based on your saved teams
          </span>
        </div>

        {mostUsedPokemon.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {mostUsedPokemon.map((pkmn, i) => (
              <motion.div
                key={pkmn.name}
                className="card card-interactive p-4 flex flex-col items-center gap-2 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -3 }}
              >
                <PokemonSprite
                  name={pkmn.name}
                  dexNum={pkmn.num}
                  size={72}
                  animated
                />
                <span
                  className="text-xs font-bold truncate w-full"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {pkmn.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                  Used in {pkmn.count} {pkmn.count === 1 ? 'team' : 'teams'}
                </span>
                <div className="flex gap-1 mt-0.5">
                  {pkmn.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center space-y-3 bg-slate-900/60 border-slate-800">
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No Pokémon in your team library yet! Build your first team in the Team Builder to track your most used Pokémon statistics.
            </p>
            <button
              onClick={handleNewTeam}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Build Your First Team
            </button>
          </div>
        )}
      </motion.div>

      {/* Recent Teams */}
      {recentTeams.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Recent Teams
            </h2>
            <Link
              href="/teams"
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: 'var(--color-primary)' }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentTeams.map((team) => (
              <Link key={team.id} href="/team-builder" onClick={() => setActiveTeam(team.id)}>
                <div className="card card-interactive p-4">
                  <h3
                    className="font-semibold mb-2 truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {team.name}
                  </h3>
                  <div className="flex gap-1">
                    {team.pokemon.length > 0 ? (
                      team.pokemon.map((p) => (
                        <div key={p.id} className="w-8 h-8 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
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
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Empty team
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs mt-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {team.pokemon.length}/6 Pokémon • Gen {team.generation}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
