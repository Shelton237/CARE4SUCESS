import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Inscription from "@/pages/Inscription";
import { MemoryRouter } from "react-router-dom-original";
import { renderWithQueryClient } from "@/test/test-utils";

describe("Inscription Component", () => {
    it("ouvre directement le compte parent et affiche les trois étapes", () => {
        renderWithQueryClient(
            <MemoryRouter>
                <Inscription />
            </MemoryRouter>
        );
        expect(screen.getByRole("heading", { name: "Inscription Parent" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Nom complet/)).toBeRequired();
        expect(screen.getByLabelText(/Email de connexion/)).toBeRequired();
        expect(screen.getByLabelText(/^Mot de passe/)).toHaveAttribute("minlength", "8");
        expect(screen.getByRole("list", { name: "Étapes d’inscription" }).children).toHaveLength(3);
    });

    it("permet de revenir au parcours parent après avoir choisi élève", () => {
        renderWithQueryClient(
            <MemoryRouter>
                <Inscription />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole("button", { name: "Élève", exact: true }));
        fireEvent.click(screen.getByRole("button", { name: "Parent", exact: true }));
        expect(screen.getByRole("heading", { name: "Informations Parent" })).toBeInTheDocument();
    });

    it("bascule vers le formulaire élève lors du clic", () => {
        renderWithQueryClient(
            <MemoryRouter>
                <Inscription />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole("button", { name: "Élève", exact: true }));
        expect(screen.getByRole("heading", { name: "Informations Responsable" })).toBeInTheDocument();
    });
});
