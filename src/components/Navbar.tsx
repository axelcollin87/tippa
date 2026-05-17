'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
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
    { name: 'Start', href: '/' },
    { name: 'Mina Tips', href: '/bets' },
    { name: 'Ligor', href: '/leagues' },
    { name: 'Regler', href: '/rules' },
  ];

  if (session.user.isAdmin) {
    navLinks.push({ name: 'Admin', href: '/admin' });
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-26 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-primary-foreground">
                TIPPWITS
              </div>
              <span className="font-bold text-lg tracking-wide hidden sm:block">
                VM-TIPSET 2026
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
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
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? 'text-primary border-b-2 border-primary py-5'
                    : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <button
              onClick={() => signOut()}
              className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors ml-4"
            >
              Logga ut
            </button>
          </div>

          <div className="flex md:hidden">
            <button
              id="tour-hamburger-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
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
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                signOut();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10 mt-4"
            >
              Logga ut
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
