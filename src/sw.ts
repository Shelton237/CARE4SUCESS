/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Workbox : précache les assets générés par Vite PWA
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── PUSH : affichage de la notification ─────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; link?: string; tag?: string; icon?: string } = {};
  try { payload = event.data.json(); } catch { payload = { title: "Care4Success", body: event.data.text() }; }

  const title = payload.title || "Care4Success";
  const options: NotificationOptions = {
    body:    payload.body   || "",
    icon:    payload.icon   || "/favicon.png",
    badge:   "/favicon.png",
    tag:     payload.tag    || "care4success",
    data:    { link: payload.link || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── CLIC sur la notification ─────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link: string = event.notification.data?.link || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            (client as WindowClient).navigate(link);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(link);
      })
  );
});

// ── SKIP WAITING (mise à jour instantanée) ───────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
