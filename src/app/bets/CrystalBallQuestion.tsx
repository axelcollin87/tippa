'use client';

import { useState } from 'react';
import { saveCrystalBallBet } from '@/app/bets/actions';
import { Save, Lock, CheckCircle2, Trophy, Medal } from 'lucide-react';

interface Team {
  name: string;
}

export default function CrystalBallQuestion({ 
  question, 
  userBet, 
  allTeams,
  isLocked: externalIsLocked
}: { 
  question: any, 
  userBet: any, 
  allTeams: { english: string, swedish: string }[],
  isLocked?: boolean
}) {
  const [answer, setAnswer] = useState(userBet?.answer || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const now = new Date();
  const isLocked = externalIsLocked !== undefined ? externalIsLocked : now > new Date(question.lockedAt);
  const hasChanges = answer !== (userBet?.answer || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSaving || isLocked || !answer) return;

    setIsSaving(true);
    const formData = new FormData();
    formData.append('questionId', question.id);
    formData.append('answer', answer);

    try {
      await saveCrystalBallBet(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Kunde inte spara tipset.');
    } finally {
      setIsSaving(false);
    }
  };

  const isResolved = question.correctAnswer !== null;
  // Svaret sparas som engelska i DB, så vi jämför case-insensitive
  const isCorrect = isResolved && userBet?.answer?.toLowerCase() === question.correctAnswer?.toLowerCase();

  let borderClass = 'border-border';
  let icon = <Medal className="text-muted-foreground" size={20} />;
  let pointsColor = 'text-primary bg-primary/10';

  if (question.question.includes('Guld')) {
    icon = <Trophy className="text-yellow-500" size={24} />;
    pointsColor = 'text-yellow-600 bg-yellow-500/10';
  } else if (question.question.includes('Silver')) {
    icon = <Medal className="text-slate-400" size={24} />;
    pointsColor = 'text-slate-600 bg-slate-400/10';
  } else if (question.question.includes('Brons')) {
    icon = <Medal className="text-amber-600" size={24} />;
    pointsColor = 'text-amber-700 bg-amber-600/10';
  }

  if (isResolved) {
    borderClass = isCorrect ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-red-500 opacity-80';
  } else if (hasChanges) {
    borderClass = 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]';
  }

  return (
    <div className={`bg-card p-5 md:p-6 rounded-3xl border-2 transition-all ${borderClass} relative overflow-hidden`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-black text-foreground text-sm md:text-base uppercase tracking-tight">{question.question}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${pointsColor}`}>
              {question.points} Poäng
            </span>
            {isLocked && !isResolved && (
              <span className="text-[9px] font-black uppercase tracking-widest text-destructive flex items-center gap-1">
                <Lock size={10} /> Låst
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="relative">
          <select
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isLocked}
            className="w-full bg-background border border-border p-3 md:p-4 rounded-xl text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed appearance-none"
          >
            <option value="">Välj lag...</option>
            {allTeams.map(team => (
              <option key={team.english} value={team.english}>{team.swedish}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown size={18} />
          </div>
          
          {showSuccess && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 animate-in fade-in zoom-in">
              <CheckCircle2 size={18} />
              <span className="text-xs font-bold">Sparat</span>
            </div>
          )}
        </div>

        {isResolved && (
          <div className="p-3 bg-secondary/30 rounded-xl border border-border">
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Officiellt resultat:</p>
            <p className="font-bold text-foreground text-sm uppercase">
              {allTeams.find(t => t.english === question.correctAnswer)?.swedish || question.correctAnswer}
            </p>
            {userBet && (
              <p className={`text-[10px] font-black mt-2 uppercase ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? `+${question.points} POÄNG` : '0 POÄNG'}
              </p>
            )}
          </div>
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={!hasChanges || isSaving || !answer}
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              hasChanges && answer
                ? 'bg-primary text-primary-foreground hover:scale-[1.02]'
                : 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Sparar...' : <><Save size={16} /> {userBet ? 'Uppdatera' : 'Spara val'}</>}
          </button>
        )}
      </form>
    </div>
  );
}

function ChevronDown({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

