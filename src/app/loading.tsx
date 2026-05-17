import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <Loader2 className="animate-spin text-primary w-6 h-6 absolute" />
      </div>
      <p className="text-sm font-black text-muted-foreground uppercase tracking-widest animate-pulse">
        Laddar...
      </p>
    </div>
  );
}
