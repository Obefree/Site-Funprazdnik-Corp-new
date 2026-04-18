export type NavLink = {
  label: string;
  href: string;
};

export const mainNav: NavLink[] = [
  { label: "Продукты", href: "/products" },
  { label: "Кейсы", href: "/cases" },
  { label: "Для HR", href: "/for-hr" },
  { label: "Для руководителей", href: "/for-leaders" },
  { label: "Для маркетинга", href: "/for-marketing" },
  { label: "Контакты", href: "/contacts" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Продукты",
    links: [
      { label: "Онлайн корпоратив", href: "/products/online-corporate" },
      { label: "Гибридный квест", href: "/products/hybrid-quest" },
      { label: "Игрофикация мероприятий", href: "/products/event-gamification" },
      { label: "Долгосрочная программа", href: "/products/ongoing-program" },
    ],
  },
  {
    title: "Решения",
    links: [
      { label: "Для HR", href: "/for-hr" },
      { label: "Для руководителей", href: "/for-leaders" },
      { label: "Для маркетинга", href: "/for-marketing" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "Кейсы", href: "/cases" },
      { label: "Контакты", href: "/contacts" },
    ],
  },
];
