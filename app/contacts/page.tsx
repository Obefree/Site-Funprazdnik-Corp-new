import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Оставьте заявку или напишите напрямую — ответим в течение рабочего дня.",
};

export default function ContactsPage() {
  return (
    <>
      <section className="border-b border-line bg-white py-16 md:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Контакты</p>
            <h1 className="text-display-lg font-semibold">Обсудим задачу</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Короткая форма или прямой контакт — как удобнее. Отвечаем в течение рабочего дня и
              предлагаем встречу на 20–30 минут.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ContactForm />

          <aside className="space-y-6">
            <div className="card">
              <p className="eyebrow mb-3">Прямой контакт</p>
              <ul className="space-y-3 text-[15px]">
                <li className="flex items-center justify-between gap-3">
                  <span className="text-muted">Email</span>
                  <a href="mailto:hello@funprazdnik.corp" className="text-ink hover:text-brand">
                    hello@funprazdnik.corp
                  </a>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-muted">Telegram</span>
                  <a href="#" className="text-ink hover:text-brand">
                    @funprazdnik_corp
                  </a>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-muted">LinkedIn</span>
                  <a href="#" className="text-ink hover:text-brand">
                    funprazdnik-corp
                  </a>
                </li>
              </ul>
            </div>

            <div className="card">
              <p className="eyebrow mb-3">Как проходит встреча</p>
              <ul className="space-y-3 text-[15px] text-ink">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  Обсуждаем команду, контекст и задачу
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  Предлагаем формат и ориентиры по результату
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  Без шаблонной презентации и продажи
                </li>
              </ul>
              <p className="mt-4 text-xs text-muted">20–30 минут. Онлайн.</p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
