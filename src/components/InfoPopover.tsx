import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

export default function InfoPopover({ title, children }: { title?: string, children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger>
        <button
          className="text-muted-foreground hover:text-primary transition-colors focus:outline-none inline-flex items-center justify-center rounded-full hover:bg-secondary/50 p-1 -m-1"
          aria-label="Mer information"
        >
          <Info size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5 bg-card border-border shadow-2xl rounded-2xl z-50">
        {title && (
          <h4 className="font-black text-foreground mb-2 text-xs uppercase tracking-widest border-b border-border pb-2">
            {title}
          </h4>
        )}
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2 font-medium">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
