"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Провайдеры клиентской части приложения.
 * - React Query для кеширования запросов к Medusa
 * - (сюда добавляются другие провайдеры: тема, авторизация и т.д.)
 */
export function Providers({ children }: { children: ReactNode }) {
  // Создаём QueryClient внутри useState, чтобы не шарить между запросами (SSR-safe)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Данные «свежие» 60 секунд
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
