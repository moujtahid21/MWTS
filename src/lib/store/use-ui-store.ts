"use client";

import { create } from "zustand";

/** Ephemeral layout state shared between Sidebar and Topbar (not persisted). */
export type UiState = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}));
