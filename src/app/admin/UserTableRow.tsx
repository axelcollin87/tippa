'use client';

import { resetPassword, deleteUser } from './userActions';
import { Trash2 } from 'lucide-react';

interface UserTableRowProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    totalScore: number;
    isAdmin: boolean;
  };
}

export default function UserTableRow({ user }: UserTableRowProps) {
  const handleResetPassword = async (formData: FormData) => {
    try {
      await resetPassword(formData);
      alert(`Lösenordet för ${user.name || user.email} har återställts till abc123`);
    } catch (error) {
      alert('Kunde inte återställa lösenordet.');
    }
  };

  const handleDeleteUser = async (formData: FormData) => {
    if (confirm(`Är du säker på att du vill radera ${user.name || user.email}? All data för användaren kommer att försvinna permanent.`)) {
      try {
        await deleteUser(formData);
      } catch (error) {
        alert('Kunde inte radera användaren.');
      }
    }
  };

  return (
    <tr key={user.id}>
      <td className="py-4">
        <p className="font-bold text-sm text-foreground">{user.name || 'Inget namn'}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </td>
      <td className="py-4 font-black text-primary">{user.totalScore}p</td>
      <td className="py-4">
        <div className="flex justify-end gap-2">
          <form action={handleResetPassword}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-border transition-colors"
            >
              Reset PWD (abc123)
            </button>
          </form>
          {!user.isAdmin && (
            <form action={handleDeleteUser}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive p-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
