import { useEffect, useRef, useId } from "react";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
                    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
                };
            };
        };
    }
}

interface GoogleSignInButtonProps {
    onCredential: (idToken: string) => void;
    text?: "signin_with" | "signup_with" | "continue_with";
    disabled?: boolean;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_SCRIPT_ID = "google-identity-services-script";

export function GoogleSignInButton({ onCredential, text = "continue_with", disabled }: GoogleSignInButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const uid = useId();

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || disabled) return;

        const renderButton = () => {
            if (!window.google || !containerRef.current) return;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (resp) => onCredential(resp.credential),
            });
            containerRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(containerRef.current, {
                theme: "outline",
                size: "large",
                width: 320,
                text,
                locale: "fr",
            });
        };

        if (window.google) {
            renderButton();
            return;
        }

        const existing = document.getElementById(GOOGLE_SCRIPT_ID);
        if (!existing) {
            const script = document.createElement("script");
            script.id = GOOGLE_SCRIPT_ID;
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.onload = renderButton;
            document.head.appendChild(script);
        } else {
            existing.addEventListener("load", renderButton, { once: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled]);

    if (!GOOGLE_CLIENT_ID) return null;

    return <div ref={containerRef} id={`google-btn-${uid}`} className="flex justify-center" />;
}
