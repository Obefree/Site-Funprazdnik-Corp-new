import { Container } from "@/components/Container";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4 justify-center">Ошибка 404</p>
          <h1 className="text-display-lg font-semibold">Страница не найдена</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Возможно, страница переехала или адрес введён с ошибкой.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/" size="lg">На главную</Button>
            <Button href="/products" size="lg" variant="secondary">К продуктам</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
