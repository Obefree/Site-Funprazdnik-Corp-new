import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { CTABlock } from "@/components/CTABlock";
import { CasesExplorer } from "@/components/CasesExplorer";

export const metadata: Metadata = {
  title: "Кейсы",
  description:
    "Примеры проектов: гибридные форматы, онбординг, тимбилдинг и игрофикация мероприятий.",
};

export default function CasesPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="Кейсы"
        title="Что мы делали для команд и брендов"
        description="Короткие истории проектов: задача, формат, результат. Фильтруйте по типу формата и задаче."
      />

      <Section>
        <CasesExplorer />
      </Section>

      <CTABlock
        title="Покажем кейсы под ваш контекст"
        description="На встрече подберём релевантные проекты и расскажем, как шли к результату."
        primaryLabel="Назначить встречу"
      />
    </>
  );
}
