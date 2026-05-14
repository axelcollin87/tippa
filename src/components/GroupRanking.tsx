"use client";

import { useState, useEffect } from "react";
import { saveGroupPlacement } from "@/app/bets/actions";
import TeamBadge from "./TeamBadge";
import { ChevronUp, ChevronDown, Save, Lock } from "lucide-react";

interface Props {
  groupName: string;
  teams: string[];
  initialPlacements: { teamName: string; predictedRank: number }[];
  isLocked: boolean;
}

export default function GroupRanking({ groupName, teams, initialPlacements, isLocked }: Props) {
  const [orderedTeams, setOrderedTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Skapa en initial ordning baserat på tips eller alfabetisk ordning
    const placementMap = new Map<number, string>();
    initialPlacements.forEach(p => placementMap.set(p.predictedRank, p.teamName));
    
    const sorted: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const team = placementMap.get(i);
      if (team && teams.includes(team)) {
        sorted.push(team);
      }
    }
    
    // Lägg till resterande lag som inte fanns i tipsen
    teams.forEach(t => {
      if (!sorted.includes(t)) sorted.push(t);
    });

    setOrderedTeams(sorted.slice(0, 4));
  }, [groupName, teams, initialPlacements]);

  const move = (index: number, direction: 'up' | 'down') => {
    if (isLocked) return;
    const newOrder = [...orderedTeams];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    setOrderedTeams(newOrder);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("groupName", groupName);
    orderedTeams.forEach((team, i) => {
      formData.append(`rank${i + 1}`, team);
    });

    try {
      await saveGroupPlacement(formData);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden max-w-md mx-auto md:mx-0">
      <div className="bg-secondary/30 px-4 py-2 border-b border-border flex justify-between items-center">
         <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Placering 1-4</span>
         {isLocked && <Lock size={12} className="text-muted-foreground" />}
      </div>
      
      <div className="divide-y divide-border">
        {orderedTeams.map((team, index) => {
          const rank = index + 1;
          const isAdvancing = rank <= 2;
          
          return (
            <div key={team} className="flex items-center p-3 gap-4 group hover:bg-secondary/10 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-colors ${
                isAdvancing 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-destructive/80 text-white"
              }`}>
                {rank}
              </div>
              
              <div className="flex-1 min-w-0">
                <TeamBadge teamName={team} className="font-bold text-base md:text-lg" />
              </div>

              {!isLocked && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(index, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg disabled:opacity-0 transition-all active:scale-90"
                    title="Flytta upp"
                  >
                    <ChevronUp size={24} />
                  </button>
                  <button
                    onClick={() => move(index, 'down')}
                    disabled={index === orderedTeams.length - 1}
                    className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg disabled:opacity-0 transition-all active:scale-90"
                    title="Flytta ner"
                  >
                    <ChevronDown size={24} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLocked && (
        <div className="p-4 bg-secondary/10 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95"
          >
            {isLoading ? "Sparar..." : (
              <>
                <Save size={18} />
                Spara Tabell
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
