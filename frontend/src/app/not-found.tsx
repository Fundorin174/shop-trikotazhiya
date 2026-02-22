import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страница не найдена",
  description: "Запрашиваемая страница не существует. Вернитесь в каталог тканей Трикотажия.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container-shop flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-heading text-6xl font-bold text-primary-300">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">
        Страница не найдена
      </h2>
      <p className="mt-3 max-w-md text-gray-500">
        Возможно, товар был удалён или ссылка устарела. Попробуйте найти нужную
        ткань в нашем каталоге.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/catalog" className="btn-primary">
          Перейти в каталог
        </Link>
        <Link href="/" className="btn-secondary">
          На главную
        </Link>
      </div>
    </div>
  );
}
