import { getTeamInfo } from "@/lib/teams";

interface TeamBadgeProps {
  teamName: string;
  className?: string;
  reversed?: boolean;
}

export default function TeamBadge({ teamName, className = "", reversed = false }: TeamBadgeProps) {
  const { name, flagUrl } = getTeamInfo(teamName);

  return (
    <div className={`flex items-center gap-2 ${reversed ? "flex-row-reverse" : "flex-row"} ${className}`}>
      {flagUrl ? (
        <img 
          src={flagUrl} 
          alt={`${name} flagga`} 
          className="w-6 h-4 object-cover rounded-[2px] shadow-sm border border-white/10"
        />
      ) : (
        <div className="w-6 h-4 bg-secondary rounded-[2px] border border-border flex items-center justify-center">
          <span className="text-[8px] font-bold text-muted-foreground">?</span>
        </div>
      )}
      <span className="truncate">{name}</span>
    </div>
  );
}
