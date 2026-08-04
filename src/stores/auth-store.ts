'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: UserAccount | null;
  isLoggedIn: boolean;
  showAuthModal: boolean;
  authModalMessage: string;
  login: (name: string, email: string) => void;
  logout: () => void;
  setShowAuthModal: (show: boolean, message?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      showAuthModal: false,
      authModalMessage: '',

      login: (name: string, email: string) => {
        const newUser: UserAccount = {
          id: `user-${Date.now()}`,
          name: name.trim() || 'Pokémon Trainer',
          email: email.trim() || 'trainer@poke.com',
          avatar: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${Math.floor(Math.random() * 898) + 1}.png`,
          createdAt: new Date().toISOString(),
        };
        set({ user: newUser, isLoggedIn: true, showAuthModal: false, authModalMessage: '' });
      },

      logout: () => {
        set({ user: null, isLoggedIn: false });
      },

      setShowAuthModal: (show: boolean, message: string = '') => {
        set({ showAuthModal: show, authModalMessage: message });
      },
    }),
    {
      name: 'pokemon_team_builder_auth_v1',
    }
  )
);
