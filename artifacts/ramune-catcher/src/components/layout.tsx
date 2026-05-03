import { Link, useLocation } from "wouter";
import { Home, ScanBarcode, Grid2x2, MapPin, Users, UserCircle, Trophy } from "lucide-react";
import { WelcomeModal } from "./welcome-modal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/catch", label: t.nav.catch, icon: ScanBarcode },
    { href: "/collection", label: t.nav.collection, icon: Grid2x2 },
    { href: "/map", label: t.nav.map, icon: MapPin },
    { href: "/friends", label: t.nav.friends, icon: Users },
    { href: "/leaderboard", label: t.nav.leaderboard, icon: Trophy },
    { href: "/account", label: t.nav.account, icon: UserCircle },
  ];

  const mobileNavItems = navItems.slice(0, 6);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row w-full max-w-7xl mx-auto">
      <WelcomeModal />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border z-10 sticky top-0">
        <div className="font-black text-xl text-primary tracking-tight">RAMUNE CATCHER</div>
        <div className="flex items-center gap-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as Language)}
              className={cn(
                "px-2 py-1 rounded-lg text-xs font-black transition-all",
                language === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-card/50 backdrop-blur-sm border-r border-border p-6 sticky top-0 h-[100dvh]">
        <div className="font-black text-2xl text-primary tracking-tight mb-10 leading-none">
          RAMUNE<br />CATCHER
        </div>
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all hover-elevate",
                  location === item.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span className="truncate">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Language Switcher */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Language</p>
          <div className="flex gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as Language)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black transition-all",
                  language === lang.code
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
                title={lang.flag}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 pb-24 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-50">
        <div className="flex justify-around p-2">
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex-1 block">
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="w-6 h-6 mb-1" strokeWidth={location === item.href ? 3 : 2} />
                <span className="text-[9px] font-bold truncate max-w-full">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
