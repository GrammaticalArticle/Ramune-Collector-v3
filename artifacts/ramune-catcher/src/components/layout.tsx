import { Link, useLocation } from "wouter";
import { Home, ScanBarcode, Grid2x2, MapPin, Users, UserCircle, Trophy, Globe, Mail } from "lucide-react";
import { WelcomeModal } from "./welcome-modal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row w-full max-w-7xl mx-auto">
      <WelcomeModal />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border z-10 sticky top-0">
        <div className="font-black text-xl text-primary tracking-tight">RAMUNE CATCHER</div>
        <div className="flex items-center gap-1">
          <a
            href="mailto:tymofiizeniuk@gmail.com?subject=Support%20Request"
            className="flex items-center justify-center w-8 h-8 rounded-lg border-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Mail className="w-4 h-4" strokeWidth={2.5} />
          </a>
        <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
          <SelectTrigger className="w-auto h-8 px-2.5 rounded-lg border-2 font-black text-xs gap-1.5 shadow-none">
            <Globe className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <SelectValue>
              <span className="font-black">{currentLang?.flag} {currentLang?.label}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end" className="z-[9999]">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} className="font-bold">
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

        {/* Support Button */}
        <div className="mt-4">
          <a
            href="mailto:tymofiizeniuk@gmail.com?subject=Support%20Request"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all hover-elevate text-muted-foreground hover:bg-muted w-full"
          >
            <Mail className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            <span className="truncate">{t.support.button}</span>
          </a>
        </div>

        {/* Language Switcher */}
        <div className="mt-2 pt-4 border-t border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Language</p>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-full rounded-xl border-2 shadow-none font-bold h-10 gap-2">
              <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
              <SelectValue>
                <span className="flex items-center gap-2 font-black">
                  <span>{currentLang?.flag}</span>
                  <span>{currentLang?.label}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="font-bold">
                  <span className="flex items-center gap-2.5">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
