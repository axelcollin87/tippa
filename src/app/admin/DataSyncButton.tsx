"use client";

import { useState } from "react";
import { syncWithGitHub } from "./actions";

export default function DataSyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await syncWithGitHub();
      if (result.success) {
        setMessage(`Synk lyckades! Uppdaterade ${result.count} matcher.`);
      } else {
        setMessage(`Fel: ${result.error}`);
      }
    } catch (e: any) {
      setMessage(`Kritiskt fel: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={handleSync}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-bold text-white transition-colors ${
          isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Synkar..." : "Synka matcher från GitHub"}
      </button>
      {message && <span className="text-sm font-medium text-muted-foreground">{message}</span>}
    </div>
  );
}
