import { useEffect, useRef, useState, useCallback } from "react";
import { getVapidPublicKey, subscribePushWeb, unsubscribePush } from "@/api/backoffice";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const subRef = useRef<PushSubscription | null>(null);

  // Initialise l'état depuis le SW existant
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        subRef.current = existing;
        setIsSubscribed(true);
      }
    }).catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result !== "granted") return;

      const reg = await navigator.serviceWorker.ready;

      // Récupère la clé VAPID depuis le backend
      const { publicKey } = await getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      subRef.current = sub;
      setIsSubscribed(true);

      // Envoie la subscription au backend
      await subscribePushWeb(sub.toJSON() as PushSubscriptionJSON);
    } catch (err) {
      console.error("[push] subscribe failed", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    const sub = subRef.current;
    if (!sub) return;
    setIsLoading(true);
    try {
      await unsubscribePush(sub.endpoint);
      await sub.unsubscribe();
      subRef.current = null;
      setIsSubscribed(false);
    } catch (err) {
      console.error("[push] unsubscribe failed", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
