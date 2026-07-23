import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Crée un QueryClient "silencieux" pour les tests : pas de retry, pas de
 * refetch automatique en arrière-plan, afin de garder les tests déterministes
 * et rapides (aucune requête réseau réelle ne doit jamais partir en test
 * unitaire, on mocke toujours les fonctions d'API appelées par les hooks).
 */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
}

interface AllProvidersProps {
    children: ReactNode;
    queryClient?: QueryClient;
}

function AllProviders({ children, queryClient }: AllProvidersProps) {
    return (
        <QueryClientProvider client={queryClient ?? createTestQueryClient()}>
            {children}
        </QueryClientProvider>
    );
}

/**
 * Wrapper de rendu partagé pour les tests de composants qui dépendent de
 * TanStack Query (via `useQuery`/`useMutation`), afin d'éviter l'erreur
 * "No QueryClient set, use QueryClientProvider to set one" et de ne pas
 * dupliquer ce provider dans chaque fichier de test.
 *
 * Ne fournit volontairement pas de Router : les tests qui en ont besoin
 * (ex: MemoryRouter) continuent de l'ajouter explicitement autour du
 * composant testé, pour rester proches du rendu réel de l'app.
 */
export function renderWithQueryClient(
    ui: ReactElement,
    options?: RenderOptions & { queryClient?: QueryClient }
) {
    const { queryClient, ...renderOptions } = options ?? {};
    return render(ui, {
        wrapper: ({ children }) => (
            <AllProviders queryClient={queryClient}>{children}</AllProviders>
        ),
        ...renderOptions,
    });
}
