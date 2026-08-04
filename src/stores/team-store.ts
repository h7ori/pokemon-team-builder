// Team state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, TeamPokemon } from '@/types/pokemon';
import { createEmptyTeam, createEmptyPokemon } from '@/types/pokemon';

interface TeamState {
  // Data
  teams: Team[];
  activeTeamId: string | null;
  selectedSlot: number | null;

  // Computed
  activeTeam: () => Team | null;
  activePokemon: () => TeamPokemon | null;

  // Team actions
  createTeam: () => string;
  deleteTeam: (id: string) => void;
  duplicateTeam: (id: string) => void;
  renameTeam: (id: string, name: string) => void;
  setActiveTeam: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  setTeamFolder: (id: string, folder: string) => void;
  setTeamGeneration: (id: string, gen: number) => void;

  // Pokémon actions
  setSelectedSlot: (slot: number | null) => void;
  addPokemon: (teamId: string, pokemon: TeamPokemon) => void;
  removePokemon: (teamId: string, slotIndex: number) => void;
  updatePokemon: (teamId: string, slotIndex: number, updates: Partial<TeamPokemon>) => void;
  swapPokemon: (teamId: string, fromIndex: number, toIndex: number) => void;
  setPokemonSpecies: (teamId: string, slotIndex: number, species: string) => void;

  // Import/Export
  importTeam: (team: Team) => void;
  exportTeam: (id: string) => Team | null;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: [],
      activeTeamId: null,
      selectedSlot: null,

      activeTeam: () => {
        const state = get();
        return state.teams.find((t) => t.id === state.activeTeamId) ?? null;
      },

      activePokemon: () => {
        const state = get();
        const team = state.activeTeam();
        if (!team || state.selectedSlot === null) return null;
        return team.pokemon[state.selectedSlot] ?? null;
      },

      createTeam: () => {
        const newTeam = createEmptyTeam();
        set((state) => ({
          teams: [...state.teams, newTeam],
          activeTeamId: newTeam.id,
        }));
        return newTeam.id;
      },

      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
          activeTeamId: state.activeTeamId === id ? null : state.activeTeamId,
        })),

      duplicateTeam: (id) =>
        set((state) => {
          const team = state.teams.find((t) => t.id === id);
          if (!team) return state;
          const duplicate: Team = {
            ...team,
            id: crypto.randomUUID(),
            name: `${team.name} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pokemon: team.pokemon.map((p) => ({ ...p, id: crypto.randomUUID() })),
          };
          return { teams: [...state.teams, duplicate] };
        }),

      renameTeam: (id, name) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, name, updatedAt: Date.now() } : t
          ),
        })),

      setActiveTeam: (id) => set({ activeTeamId: id, selectedSlot: null }),

      toggleFavorite: (id) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
          ),
        })),

      toggleArchive: (id) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, isArchived: !t.isArchived } : t
          ),
        })),

      setTeamFolder: (id, folder) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, folder } : t
          ),
        })),

      setTeamGeneration: (id, gen) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, generation: gen, updatedAt: Date.now() } : t
          ),
        })),

      setSelectedSlot: (slot) => set({ selectedSlot: slot }),

      addPokemon: (teamId, pokemon) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId || t.pokemon.length >= 6) return t;
            return { ...t, pokemon: [...t.pokemon, pokemon], updatedAt: Date.now() };
          }),
        })),

      removePokemon: (teamId, slotIndex) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t;
            const newPokemon = [...t.pokemon];
            newPokemon.splice(slotIndex, 1);
            return { ...t, pokemon: newPokemon, updatedAt: Date.now() };
          }),
          selectedSlot:
            state.selectedSlot === slotIndex ? null : state.selectedSlot,
        })),

      updatePokemon: (teamId, slotIndex, updates) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t;
            const newPokemon = [...t.pokemon];
            if (newPokemon[slotIndex]) {
              newPokemon[slotIndex] = { ...newPokemon[slotIndex], ...updates };
            }
            return { ...t, pokemon: newPokemon, updatedAt: Date.now() };
          }),
        })),

      swapPokemon: (teamId, fromIndex, toIndex) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t;
            const newPokemon = [...t.pokemon];
            [newPokemon[fromIndex], newPokemon[toIndex]] = [
              newPokemon[toIndex],
              newPokemon[fromIndex],
            ];
            return { ...t, pokemon: newPokemon, updatedAt: Date.now() };
          }),
        })),

      setPokemonSpecies: (teamId, slotIndex, species) => {
        const state = get();
        const team = state.teams.find((t) => t.id === teamId);
        if (!team) return;

        if (slotIndex >= team.pokemon.length) {
          // Add new Pokémon
          const newPokemon = createEmptyPokemon();
          newPokemon.species = species;
          get().addPokemon(teamId, newPokemon);
        } else {
          // Update existing
          get().updatePokemon(teamId, slotIndex, { species });
        }
      },

      importTeam: (team) =>
        set((state) => ({
          teams: [...state.teams, { ...team, id: crypto.randomUUID() }],
        })),

      exportTeam: (id) => {
        const state = get();
        return state.teams.find((t) => t.id === id) ?? null;
      },
    }),
    {
      name: 'pokemon-team-builder-teams',
      version: 1,
    }
  )
);
