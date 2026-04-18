"use client";

import { useState } from "react";
import { Button } from "./Button";

type Status = "idle" | "sending" | "sent";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    // Заглушка — в проде подключить backend / CRM
    setTimeout(() => setStatus("sent"), 700);
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 shadow-card">
        <h3 className="text-xl font-semibold text-ink">Заявка отправлена</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Свяжемся в течение рабочего дня и предложим удобное время встречи.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Имя" name="name" required />
        <Field label="Компания" name="company" required />
        <Field label="Рабочий email" name="email" type="email" required className="md:col-span-2" />
        <SelectField
          label="Запрос"
          name="topic"
          className="md:col-span-2"
          options={[
            "Онлайн корпоратив",
            "Гибридный квест",
            "Игрофикация мероприятий",
            "Долгосрочная программа",
            "Пока не знаю — обсудить",
          ]}
        />
        <Textarea
          label="Контекст команды"
          name="message"
          placeholder="Размер команды, формат, сроки, задача"
          className="md:col-span-2"
        />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          Нажимая кнопку, вы соглашаетесь с обработкой данных для связи по вашему запросу.
        </p>
        <Button size="lg" className="md:w-auto w-full" type="submit">
          {status === "sending" ? "Отправляем…" : "Отправить"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-white p-3.5 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  className,
}: {
  label: string;
  name: string;
  options: string[];
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <select
        name={name}
        className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
