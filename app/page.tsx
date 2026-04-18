import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { FeatureCard } from "@/components/FeatureCard";
import { ProductCard } from "@/components/ProductCard";
import { CaseCard } from "@/components/CaseCard";
import { MetricsStrip } from "@/components/MetricsStrip";
import { CTABlock } from "@/components/CTABlock";
import { Button, ArrowRight } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { Container } from "@/components/Container";
import { products } from "@/lib/products";
import { cases } from "@/lib/cases";

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Experience → Dynamics → Signal"
        title={
          <>
            Игровые события для{" "}
            <span className="text-brand">распределённых команд</span>, после которых люди действительно становятся ближе
          </>
        }
        description="Онлайн, оффлайн и гибридные форматы для команд, которым важно не просто провести корпоратив, а улучшить связи, ускорить онбординг и понять, что происходит внутри коллектива."
        actions={
          <>
            <Button href="/contacts" size="lg" className="group">
              Назначить встречу
              <ArrowRight />
            </Button>
            <Button href="/products" size="lg" variant="secondary">
              Получить идеи
            </Button>
          </>
        }
        aside={
          <div className="relative">
            <div className="relative rounded-[24px] border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Пульс команды</p>
                <Tag variant="brand">Живой сигнал</Tag>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Связность", v: 82 },
                  { label: "Вовлечение", v: 91 },
                  { label: "Онбординг", v: 76 },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-line p-3">
                    <p className="text-xs text-muted">{s.label}</p>
                    <p className="mt-1.5 text-2xl font-semibold text-ink">{s.v}<span className="text-sm text-muted">%</span></p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${s.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-surface p-4">
                <p className="text-xs text-muted">После события</p>
                <p className="mt-1 text-sm text-ink">
                  Команда стала плотнее общаться между отделами. Удалённые сотрудники включаются активнее.
                </p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden md:block rounded-2xl border border-line bg-white p-4 shadow-soft">
              <p className="text-xs text-muted">Вовлечённость</p>
              <p className="mt-1 text-xl font-semibold text-ink">80–95%</p>
            </div>
          </div>
        }
      />

      {/* Под hero — 3 направления */}
      <section className="-mt-12 md:-mt-16 pb-16 md:pb-24">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<IconLink />}
              title="Сплочение и знакомство"
              description="Люди начинают взаимодействовать проще и быстрее — без неловких знакомств на пустом месте."
            />
            <FeatureCard
              icon={<IconPulse />}
              title="Пульс-чек команды"
              description="Формат, через который видно реальные проблемы: напряжение, выпадение, слабые связи."
            />
            <FeatureCard
              icon={<IconOnboarding />}
              title="Онбординг и интеграция"
              description="Новые сотрудники быстрее входят в коллектив и раньше начинают работать в полную силу."
            />
          </div>
        </Container>
      </section>

      {/* Проблема */}
      <Section
        eyebrow="Проблема"
        title={<>Команда работает вместе,<br className="hidden md:block" /> но не чувствует себя командой</>}
        description="Это типичная точка распределённых и гибридных коллективов — людей много, процессов много, а ощущения общего дела нет."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Сотрудники знают роли, но не знают людей",
            "Удалёнщики выпадают из коммуникации",
            "Новички долго адаптируются",
            "Коммуникация напряжённая",
            "Нет неформального контакта",
            "Корпоративы не дают эффекта",
          ].map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-xl border border-line bg-white p-5">
              <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </span>
              <p className="text-[15px] leading-relaxed text-ink">{p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Решение */}
      <Section
        eyebrow="Решение"
        title="Мы проектируем события, которые работают на команду и бизнес"
        description="Не развлекательный слой поверх работы, а продуктовый инструмент: формат, метрики, результат."
        className="bg-white border-y border-line"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Сплочение",
              description: "Люди начинают взаимодействовать проще и быстрее.",
              icon: <IconLink />,
            },
            {
              title: "Пульс-чек",
              description: "Можно увидеть реальные проблемы команды.",
              icon: <IconPulse />,
            },
            {
              title: "Онбординг",
              description: "Новые сотрудники быстрее входят в коллектив.",
              icon: <IconOnboarding />,
            },
          ].map((c) => (
            <FeatureCard key={c.title} {...c} />
          ))}
        </div>
      </Section>

      {/* Как это работает */}
      <Section eyebrow="Как это работает" title="Четыре шага до результата">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", title: "Разбираем задачу", text: "Смотрим на команду, контекст и что на самом деле нужно изменить." },
            { n: "02", title: "Подбираем формат", text: "Онлайн, оффлайн или гибрид. Под размер команды, цели и тон." },
            { n: "03", title: "Проводим событие", text: "Ведущий, сценарий, механики. Вовлекаем всех, а не только активных." },
            { n: "04", title: "Даём результат", text: "Фиксируем сигнал о команде и даём понятный артефакт для HR / руководителя." },
          ].map((s) => (
            <div key={s.n} className="card card-hover">
              <p className="text-xs font-medium tracking-[0.16em] text-brand">{s.n}</p>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Продукты */}
      <Section
        eyebrow="Продукты"
        title="Четыре формата под разные задачи"
        description="Выберите формат под контекст команды или напишите нам — предложим подходящий."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button href="/products" variant="secondary" size="lg" className="group">
            Все продукты
            <ArrowRight />
          </Button>
        </div>
      </Section>

      {/* Почему мы */}
      <Section
        eyebrow="Почему мы"
        title="Продукт, а не пакет услуг"
        className="bg-white border-y border-line"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Не шаблонные решения", text: "Сценарий всегда собирается под контекст команды." },
            { title: "Продукт, а не услуги", text: "Формат, механика и метрика — единая система." },
            { title: "Умеем гибрид", text: "Онлайн и оффлайн в одном сценарии без «второго сорта»." },
            { title: "Не душно", text: "Взрослый тон, без конфетти и корпоративной неловкости." },
            { title: "Эффект для бизнеса", text: "Сигнал, который видят HR и руководители." },
            { title: "Опыт в масштабе", text: "Команды от 20 до нескольких сотен человек." },
          ].map((c) => (
            <FeatureCard key={c.title} title={c.title} description={c.text} />
          ))}
        </div>
      </Section>

      {/* Кейсы */}
      <Section
        eyebrow="Кейсы"
        title="Что мы делали для похожих команд"
        description="Короткие истории: задача, формат, результат."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {cases.slice(0, 3).map((c) => (
            <CaseCard key={c.slug} item={c} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button href="/cases" variant="secondary" size="lg" className="group">
            Все кейсы
            <ArrowRight />
          </Button>
        </div>
      </Section>

      {/* Доверие */}
      <Section
        eyebrow="Доверие"
        title="Цифры, которые стоят за продуктом"
        align="center"
        className="bg-white border-y border-line"
      >
        <MetricsStrip
          items={[
            { value: "50+", label: "реализованных проектов" },
            { value: "5000+", label: "участников в форматах" },
            { value: "4.6–4.8", label: "средняя оценка участников" },
          ]}
        />
        <p className="mt-4 text-center text-xs text-muted">
          <em className="not-italic">Значения агрегированы по проектам и могут уточняться.</em>
        </p>
      </Section>

      {/* Финальный CTA */}
      <CTABlock
        title="Нужен формат, который реально работает?"
        description="Обсудим контекст команды и предложим формат под задачу. Без шаблонных презентаций."
        primaryLabel="Назначить встречу"
        secondaryHref="/products"
        secondaryLabel="Посмотреть продукты"
      />
    </>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 14a4 4 0 0 1 0-5.656l3-3a4 4 0 0 1 5.657 5.656l-1.5 1.5M14 10a4 4 0 0 1 0 5.656l-3 3a4 4 0 0 1-5.657-5.656l1.5-1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 12h3l2-5 4 10 2-5h7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconOnboarding() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" strokeLinecap="round" />
    </svg>
  );
}
