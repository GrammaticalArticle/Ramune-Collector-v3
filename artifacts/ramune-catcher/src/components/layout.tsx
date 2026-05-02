import { Link, useLocation } from "wouter";
import { Home, ScanBarcode, Grid2x2, MapPin, Users } from "lucide-react";
import { WelcomeModal } from "./welcome-modal";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/catch", label: "Catch", icon: ScanBarcode },
    { href: "/collection", label: "Collection", icon: Grid2x2 },
    { href: "/map", label: "Snack Map", icon: MapPin },
    { href: "/friends", label: "Friends", icon: Users },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row w-full max-w-7xl mx-auto">
      <WelcomeModal />
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border z-10 sticky top-0">
        <div className="font-black text-xl text-primary tracking-tight">RAMUNE CATCHER</div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-card/50 backdrop-blur-sm border-r border-border p-6 sticky top-0 h-[100dvh]">
        <div className="font-black text-2xl text-primary tracking-tight mb-12 leading-none">
          RAMUNE<br />CATCHER
        </div>
        <nav className="flex-1 space-y-2">
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
                <item.icon className="w-5 h-5" strokeWidth={2.5} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
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
          {navItems.map((item) => (
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
                <span className="text-[10px] font-bold">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}