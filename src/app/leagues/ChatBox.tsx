'use client';

import { useState, useEffect } from 'react';
import { sendLeagueComment } from './actions';
import { getLeagueComments } from './chatActions';
import { Send } from 'lucide-react';

export default function ChatBox({ leagueId, initialComments, currentUserId }: { 
  leagueId: string, 
  initialComments: any[], 
  currentUserId: string 
}) {
  const [comment, setComment] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [comments, setComments] = useState(initialComments);

  // Poll for new comments every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const latestComments = await getLeagueComments(leagueId);
        setComments(latestComments);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [leagueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || isPending) return;

    setIsPending(true);
    try {
      await sendLeagueComment(leagueId, comment);
      setComment('');
      // Fetch immediately after sending to show our own comment instantly
      const updatedComments = await getLeagueComments(leagueId);
      setComments(updatedComments);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-border bg-secondary/30">
        <h3 className="font-black text-xl uppercase tracking-tight">Trashtalk</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse">
        {/* flex-col-reverse makes the first element (newest from DB) appear at the bottom */}
        {comments.map((c) => {
          const isMe = c.userId === currentUserId;
          return (
            <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  {c.user.name}
                </span>
                <span className="text-[9px] text-muted-foreground/50">
                  {new Date(c.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm font-medium ${
                isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-secondary text-foreground rounded-tl-none'
              }`}>
                {c.content}
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
            Inga meddelanden än. Börja snacka!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-secondary/10 flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Skriv något..."
          className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
