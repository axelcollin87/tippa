'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ShareLeagueButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Bygg den fullständiga inbjudningslänken
    const url = `${window.location.origin}/leagues/join/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-secondary/80 transition-colors"
      title="Kopiera inbjudningslänk"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      {copied ? 'Kopierad!' : 'Dela inbjudningslänk'}
    </button>
  );
}
