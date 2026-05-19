'use client';

import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') window.history.back();
      }}
      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-[10px] md:text-sm uppercase tracking-widest"
    >
      <ArrowLeft size={14} /> Tillbaka
    </button>
  );
}
