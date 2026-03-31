import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Login from "@/pages/auth/Login";
import { MemoryRouter } from "react-router-dom-original";

// Mock des dépendances
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
  ROLE_REDIRECTS: {
    admin: "/admin",
    teacher: "/teacher",
    parent: "/parent",
    student: "/student",
    advisor: "/advisor"
  }
}));

describe("Login Component", () => {
  it("affiche le titre de connexion", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
  });

  it("affiche les champs Email et Mot de passe", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/votre@email.cm/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });
});
