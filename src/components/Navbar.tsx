'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  Dices,
  Trophy,
  User,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    (window as any).__openTourMenu = () => setIsMobileMenuOpen(true);
    (window as any).__closeTourMenu = () => setIsMobileMenuOpen(false);

    return () => {
      delete (window as any).__openTourMenu;
      delete (window as any).__closeTourMenu;
    };
  }, []);

  if (!session || pathname === '/login') return null;

  const navLinks = [
    { name: 'Start', href: '/', icon: Home },
    { name: 'Mina Tips', href: '/bets', icon: Dices },
    { name: 'Ligor', href: '/leagues', icon: Trophy },
    { name: 'Profil', href: '/profile', icon: User },
    { name: 'Regler', href: '/rules', icon: BookOpen },
  ];

  if (session.user.isAdmin) {
    navLinks.push({ name: 'Admin', href: '/admin', icon: Settings });
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="px-2 h-8 bg-primary rounded-md flex items-center justify-center font-black text-primary-foreground text-sm tracking-tighter">
                TIPPWITS
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">
                VM 2026
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={
                    link.href === '/bets'
                      ? 'tour-nav-bets'
                      : link.href === '/leagues'
                        ? 'tour-nav-leagues'
                        : undefined
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all hover:bg-secondary group ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`}
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="w-px h-6 bg-border mx-2"></div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
            >
              <LogOut size={18} />
              <span className="hidden lg:inline">Logga ut</span>
            </button>
          </div>

          <div className="flex md:hidden">
            <button
              id="tour-hamburger-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary/80 hover:text-primary p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border shadow-xl">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={
                    link.href === '/bets'
                      ? 'tour-nav-bets-mobile'
                      : link.href === '/leagues'
                        ? 'tour-nav-leagues-mobile'
                        : undefined
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-base font-black uppercase tracking-widest ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border mt-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl text-base font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
              >
                <LogOut size={20} />
                Logga ut
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
