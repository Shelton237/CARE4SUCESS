import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Inscription from "@/pages/Inscription";
import { MemoryRouter } from "react-router-dom-original";

describe("Inscription Component", () => {
    it("affiche le choix du profil au démarrage", () => {
        render(
            <MemoryRouter>
                <Inscription />
            </MemoryRouter>
        );
        expect(screen.getByText(/Choisissez votre profil pour continuer/i)).toBeInTheDocument();
        expect(screen.getByText(/Je suis un Parent/i)).toBeInTheDocument();
        expect(screen.getByText(/Je suis un Élève/i)).toBeInTheDocument();
    });

    it("bascule vers le formulaire parent lors du clic", () => {
        render(
            <MemoryRouter>
                <Inscription />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText(/Je suis un Parent/i));
        expect(screen.getByText(/Informations Parent/i)).toBeInTheDocument();
    });

    it("bascule vers le formulaire élève lors du clic", () => {
        render(
            <MemoryRouter>
                <Inscription />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByText(/Je suis un Élève/i));
        expect(screen.getByText(/Informations Responsable/i)).toBeInTheDocument();
    });
});
