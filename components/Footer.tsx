import Link from "next/link";
import { footerNav } from "@/lib/navigation";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-site py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-soft">
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
                  <path d="M3 10c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5H3Z" fill="currentColor" opacity="0.9"/>
                  <path d="M8 10v5.5a2 2 0 0 0 4 0V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M5 10h2M9.5 10h1M12.5 10h2.5" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
                  <path d="M6.5 15.8h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Mycelium Lab</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              Игровые и иммерсивные форматы для распределённых команд. Experience → Dynamics → Signal.
            </p>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{group.title}</p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/80 transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Mycelium Lab. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@myceliumlab.io" className="hover:text-brand">hello@myceliumlab.io</a>
            <span className="text-line">·</span>
            <a href="#" className="hover:text-brand">Telegram</a>
            <span className="text-line">·</span>
            <a href="#" className="hover:text-brand">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
