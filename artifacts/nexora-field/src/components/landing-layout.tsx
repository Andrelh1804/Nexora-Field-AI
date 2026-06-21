import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const API = "/api";

const SOLUTIONS = [
  { label: "Telecom", href: "/solucoes#telecom", icon: "📡" },
  { label: "Fibra Óptica", href: "/solucoes#fibra", icon: "💡" },
  { label: "Infraestrutura TI", href: "/solucoes#ti", icon: "💻" },
  { label: "Redes", href: "/solucoes#redes", icon: "🔗" },
  { label: "CFTV", href: "/solucoes#cftv", icon: "📹" },
  { label: "Automação Industrial", href: "/solucoes#automacao", icon: "⚙️" },
  { label: "Eletrônica", href: "/solucoes#eletronica", icon: "🔌" },
  { label: "Energia Solar", href: "/solucoes#solar", icon: "☀️" },
];

function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${isActive(path) ? "text-primary" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/nexora-logo.png" alt="Nexora Field" className="h-9 w-9" />
            <span className="text-white font-semibold text-lg hidden sm:block">Nexora Field</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className={navLinkClass("/")}>Home</Link>
            <Link href="/como-funciona" className={navLinkClass("/como-funciona")}>Como Funciona</Link>

            <div
              className="relative"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button className={`text-sm font-medium transition-colors flex items-center gap-1 ${location.startsWith("/solucoes") ? "text-primary" : "text-slate-300 hover:text-white"}`}>
                Soluções
                <svg className={`w-3 h-3 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-3 grid grid-cols-2 gap-1">
                  {SOLUTIONS.map((s) => (
                    <a key={s.label} href={s.href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </a>
                  ))}
                  <div className="col-span-2 mt-1 pt-1 border-t border-white/10">
                    <Link href="/especialidades" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors font-medium">
                      Ver todas as especialidades →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/academy" className={navLinkClass("/academy")}>Academy</Link>
            <Link href="/planos" className={navLinkClass("/planos")}>Planos</Link>
            <Link href="/contato" className={navLinkClass("/contato")}>Contato</Link>
          </nav>

          <div className="flex items-center gap-2">
            <a href="/app/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Entrar</Button>
            </a>
            <a href="/app/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">Criar Conta</Button>
            </a>
            <button
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-slate-950 px-4 py-4 flex flex-col gap-1">
          <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Home</Link>
          <Link href="/como-funciona" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Como Funciona</Link>
          <Link href="/solucoes" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Soluções</Link>
          <Link href="/especialidades" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Especialidades</Link>
          <Link href="/academy" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Academy</Link>
          <Link href="/planos" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Planos</Link>
          <Link href="/faq" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">FAQ</Link>
          <Link href="/contato" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Contato</Link>
          <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
            <a href="/app/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full border-white/20 text-slate-300">Entrar</Button>
            </a>
            <a href="/app/register" className="flex-1">
              <Button size="sm" className="w-full">Criar Conta</Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function LandingFooter() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const res = await fetch(`${API}/landing/settings`);
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const email = settings?.["footer.email"] || "contato@nexorafield.com.br";
  const phone = settings?.["footer.phone"] || "(11) 3000-0000";

  return (
    <footer className="bg-slate-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/nexora-logo.png" alt="Nexora Field" className="h-9 w-9" />
              <span className="text-white font-semibold text-lg">Nexora Field</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Marketplace de Field Services impulsionado por IA. Conectamos empresas com técnicos especializados.
            </p>
            <div className="flex gap-3">
              {settings?.["footer.instagram"] && (
                <a href={settings["footer.instagram"]} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {settings?.["footer.linkedin"] && (
                <a href={settings["footer.linkedin"]} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/como-funciona", label: "Como Funciona" },
                { href: "/solucoes", label: "Soluções" },
                { href: "/especialidades", label: "Especialidades" },
                { href: "/planos", label: "Planos" },
                { href: "/ranking", label: "Ranking" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 hover:text-white text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Recursos</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/academy", label: "Academy" },
                { href: "/blog", label: "Blog" },
                { href: "/faq", label: "FAQ" },
                { href: "/comunidade", label: "Comunidade" },
                { href: "/contato", label: "Contato" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 hover:text-white text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contato</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>{phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Nexora Field AI · CNPJ 58.453.955/0001-84 · Todos os direitos reservados</span>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-slate-300 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-slate-300 transition-colors">Termos de Uso</Link>
            <Link href="/contato" className="hover:text-slate-300 transition-colors">Contato</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <LandingNavbar />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
