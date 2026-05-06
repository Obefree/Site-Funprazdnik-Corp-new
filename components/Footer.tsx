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
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4.5 12.5c0-3.1 3.3-5.5 7.5-5.5s7.5 2.4 7.5 5.5H4.5Z" fill="currentColor" stroke="none" />
                  <path d="M9.2 12.5v4.2a2.8 2.8 0 0 0 5.6 0v-4.2" />
                  <path d="M12 9.2v1.6M8.5 9.6v1.2M15.5 9.6v1.2" strokeLinecap="round" />
                  <path d="M6.8 17.3h10.4" strokeLinecap="round" />
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
