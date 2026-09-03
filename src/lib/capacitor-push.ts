import { Capacitor } from "@capacitor/core";
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from "@capacitor/push-notifications";
import { subscribeFCM } from "@/api/backoffice";

let initialized = false;

export async function initCapacitorPush(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  initialized = true;

  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === "prompt") {
    permStatus = await PushNotifications.requestPermissions();
  }
  if (permStatus.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token: Token) => {
    try {
      await subscribeFCM(token.value);
    } catch (err) {
      console.error("[fcm] register failed", err);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("[fcm] registrationError", err);
  });

  // Notification reçue en foreground — affichée en in-app via l'UI
  PushNotifications.addListener("pushNotificationReceived", (_notification: PushNotificationSchema) => {
    // L'invalidation du cache React Query permet au NotificationCenter de se rafraîchir
    window.dispatchEvent(new CustomEvent("care4success:push-received"));
  });

  // Clic sur une notification système (background/killed)
  PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
    const link: string | undefined = action.notification.data?.link;
    if (link) window.location.hash = link;
  });
}
