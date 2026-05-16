'use client';

import { useState } from 'react';
import { saveCrystalBallBet } from '@/app/bets/actions';
import { Save, Lock, CheckCircle2 } from 'lucide-react';

export default function CrystalBallQuestion({ question, userBet }: { question: any, userBet: any }) {
  const [answer, setAnswer] = useState(userBet?.answer || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const now = new Date();
  const isLocked = now > new Date(question.lockedAt);
  const hasChanges = answer !== (userBet?.answer || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSaving || isLocked) return;

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
  const isCorrect = isResolved && userBet?.answer?.toLowerCase() === question.correctAnswer?.toLowerCase();

  let borderClass = 'border-border';
  if (isResolved) {
    borderClass = isCorrect ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-red-500 opacity-80';
  } else if (hasChanges) {
    borderClass = 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]';
  }

  return (
    <div className={`bg-card p-6 rounded-[2rem] border-2 transition-all ${borderClass}`}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="font-bold text-foreground text-lg">{question.question}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              {question.points} Poäng
            </span>
            {isLocked && !isResolved && (
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-1">
                <Lock size={10} /> Låst
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isLocked}
            placeholder="Skriv in ditt tips..."
            className="w-full bg-background border border-border p-4 rounded-xl text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          />
          {showSuccess && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 animate-in fade-in zoom-in">
              <CheckCircle2 size={18} />
              <span className="text-xs font-bold">Sparat</span>
            </div>
          )}
        </div>

        {isResolved && (
          <div className="p-3 bg-secondary/30 rounded-xl border border-border">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Rätt svar:</p>
            <p className="font-bold text-foreground">{question.correctAnswer}</p>
            {userBet && (
              <p className={`text-xs font-black mt-2 uppercase ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? `+${question.points} POÄNG` : '0 POÄNG'}
              </p>
            )}
          </div>
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={!hasChanges || isSaving}
            className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              hasChanges
                ? 'bg-primary text-primary-foreground hover:scale-[1.02]'
                : 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Sparar...' : <><Save size={16} /> {userBet ? 'Uppdatera Tips' : 'Spara Tips'}</>}
          </button>
        )}
      </form>
    </div>
  );
}
