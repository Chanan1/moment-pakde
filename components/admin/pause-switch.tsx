"use client";

import { useState } from "react";
import { toggleConfessPause } from "@/lib/actions/admin";

interface AdminPauseSwitchProps {
  initialPaused: boolean;
}

export function AdminPauseSwitch({ initialPaused }: AdminPauseSwitchProps) {
  const [paused, setPaused] = useState(initialPaused);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const nextState = !paused;
    const confirmMessage = nextState
      ? "Aktifkan jeda confess darurat? Pengguna tidak akan bisa mengirim confess baru sampai dibuka kembali."
      : "Buka kembali pengiriman confess?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const res = await toggleConfessPause(nextState);
      if (res.ok) {
        setPaused(res.data.paused);
      } else {
        alert(res.message);
      }
    } catch {
      alert("Gagal mengubah status saklar jeda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label="Saklar darurat jeda confess"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        paused
          ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          paused ? "bg-red-500 animate-pulse" : "bg-emerald-400"
        }`}
      />
      <span>
        {loading
          ? "Memproses..."
          : paused
          ? "Confess Dijeda (Darurat)"
          : "Confess Aktif"}
      </span>
    </button>
  );
}
