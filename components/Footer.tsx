import Link from "next/link";
import { footerNav } from "@/lib/navigation";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-site py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
                </svg>
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Funprazdnik Corp</span>
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
          <p>© {new Date().getFullYear()} Funprazdnik Corp. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@funprazdnik.corp" className="hover:text-brand">hello@funprazdnik.corp</a>
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
