# Funprazdnik Corp — сайт продукта

Production-ready сайт B2B-продукта для работы с распределёнными и гибридными командами через игровые и иммерсивные форматы.

Формула продукта: **Experience → Dynamics → Signal** (Событие → Поведение → Понимание команды).

Сайт сделан как продуктовый, а не как сайт event-агентства: минимализм, воздух, крупная типографика, понятные сценарии для HR, руководителей и маркетинга.

---

## Стек

- [Next.js 14](https://nextjs.org/) (App Router)
- React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) с кастомной палитрой и spacing system
- Inter (via `next/font`)

## Запуск

Требуется Node.js 18.17+ (рекомендуется 20+).

```bash
npm install
npm run dev
```

Сайт поднимется на [http://localhost:3000](http://localhost:3000).

### Продакшн-сборка

```bash
npm run build
npm run start
```

### Линт

```bash
npm run lint
```

## Структура

```
app/
  layout.tsx               # Общий layout (Header / Footer, шрифты, SEO)
  page.tsx                 # Главная (9 экранов)
  globals.css              # Базовые стили и утилиты
  for-hr/                  # Решения для HR
  for-leaders/             # Решения для руководителей
  for-marketing/           # Решения для маркетинга
  products/
    page.tsx               # Обзор всех продуктов
    [slug]/page.tsx        # Страница конкретного продукта
  cases/                   # Кейсы с фильтрами
  contacts/                # Контакты + форма
  not-found.tsx            # 404

components/
  Header.tsx               # Верхнее меню + мобильное меню
  Footer.tsx
  Hero.tsx                 # Hero-секция
  Section.tsx              # Универсальная секция с eyebrow/title/description
  Container.tsx
  Button.tsx               # Primary / secondary / ghost варианты
  Tag.tsx
  FeatureCard.tsx
  ProductCard.tsx
  CaseCard.tsx
  CasesExplorer.tsx        # Клиентский фильтр кейсов
  MetricsStrip.tsx
  CTABlock.tsx
  ContactForm.tsx
  SolutionPage.tsx         # Переиспользуемый шаблон for-hr/leaders/marketing

lib/
  cn.ts                    # Склейка классов
  navigation.ts            # Навигация (header / footer)
  products.ts              # Данные 4 продуктов
  cases.ts                 # Данные кейсов и тегов
```

## Палитра и UI

- Primary `#4F46E5`, hover `#4338CA`
- Text `#1C1C1E`, muted `#6B7280`
- Background `#F7F8FA`, White `#FFFFFF`
- Borders `#E5E7EB`
- Container 1280px, 12-column, spacing 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
- Radius 12–16px, мягкие тени (`shadow-card`, `shadow-soft`, `shadow-hover`)

## Замена контента

Большая часть контента вынесена в `lib/*.ts`:

- `lib/products.ts` — продукты (название, аудитория, задача, шаги, метрики, форматы, длительность)
- `lib/cases.ts` — кейсы и фильтрующие теги
- `lib/navigation.ts` — навигация

Все спорные метрики помечены курсивом (`<em>`) и сопровождаются ремаркой — согласно требованию промпта.

Форма в `ContactForm.tsx` — заглушка (имитирует отправку). Для продакшена подключите её к CRM / email-сервису / API route.

## SEO

- Метаданные на уровне `app/layout.tsx` и на каждой странице (`export const metadata`)
- Семантические заголовки (`h1`/`h2`/`h3`)
- Open Graph / robots выставлены в `layout.tsx`

## Деплой

Сайт настроен на **статический экспорт** (`output: 'export'` в `next.config.mjs`).
После `npm run build` готовый сайт лежит в папке `out/` — это обычная статика,
которую можно залить на любой хостинг (CDN / S3 / GitHub Pages / Cloudflare Pages / Netlify / любой nginx).

### GitHub Pages (настроено из коробки)

В репозитории есть workflow `.github/workflows/deploy.yml`, который при пуше в `main`
собирает сайт и публикует на GitHub Pages.

Один раз включить в настройках репозитория:

1. GitHub → **Settings** → **Pages** → Source: **GitHub Actions**
2. Запушить любой коммит в `main` (или запустить workflow вручную во вкладке **Actions**)
3. После успешного деплоя адрес сайта: `https://<username>.github.io/<repo-name>/`

Workflow автоматически проставляет `basePath = /<repo-name>` через переменную `NEXT_PUBLIC_BASE_PATH`.

### Cloudflare Pages

1. Cloudflare Dashboard → **Pages** → **Create project** → **Connect to Git**
2. Выбрать репозиторий
3. Build settings:
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
4. Save and Deploy

На корневом домене `basePath` не нужен — оставить пустым (значение по умолчанию).

### Netlify

1. **Add new site** → **Import from Git**
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
3. Deploy

### Свой сервер (nginx / любой статический хостинг)

```bash
npm ci
npm run build
# содержимое out/ отдать как статику
```

### Локально

```bash
npm install
npm run dev            # разработка
npm run build          # production-сборка в out/
npx serve out          # проверить статику локально
```

## Что дальше

- Подключить реальную форму (API route + CRM / email)
- Заменить placeholder-изображения в `CaseCard` на реальные фото команд
- Добавить страницы отдельных кейсов (`/cases/[slug]`) при необходимости
- Подключить аналитику (Plausible / Umami / GA4)
