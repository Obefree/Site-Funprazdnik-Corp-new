"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNav } from "@/lib/navigation";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Mycelium Lab</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink/80 transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="/contacts" size="md">
            Назначить встречу
          </Button>
        </div>

        <button
          className="lg:hidden h-10 w-10 rounded-xl border border-line bg-white"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Меню</span>
          <svg viewBox="0 0 20 20" className="mx-auto h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            ) : (
              <path d="M4 7h12M4 13h12" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-line/80 bg-white transition-[max-height] duration-300 ease-out-soft",
          open ? "max-h-[420px]" : "max-h-0",
        )}
      >
        <div className="container-site flex flex-col gap-1 py-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] text-ink transition-colors hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
          <div className="px-3 py-3">
            <Button href="/contacts" size="md" className="w-full">
              Назначить встречу
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-soft">
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
        {/* Шляпка */}
        <path d="M3 10c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5H3Z" fill="currentColor" opacity="0.9"/>
        {/* Ножка */}
        <path d="M8 10v5.5a2 2 0 0 0 4 0V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        {/* Прожилки снизу шляпки */}
        <path d="M5 10h2M9.5 10h1M12.5 10h2.5" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
        {/* Земля */}
        <path d="M6.5 15.8h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    </span>
  );
}
