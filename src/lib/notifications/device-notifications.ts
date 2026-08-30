/**
 * Real device notifications.
 *
 * Uses the browser Notification API (through the service-worker registration
 * when available, so notifications survive a backgrounded tab on Android /
 * installed PWAs, and fall back to the page-level Notification otherwise).
 */

const STORAGE_KEY = "agripen:notifications-enabled";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export function notificationsEnabled(): boolean {
  if (!notificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  const permission =
    Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission === "granted") setNotificationsEnabled(true);
  return permission;
}

export async function showDeviceNotification(input: {
  title: string;
  body?: string;
  tag?: string;
  link?: string | null;
}): Promise<void> {
  if (!notificationsEnabled()) return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") {
    // The in-app bell already surfaces it while the user is looking at the app.
    return;
  }

  const options: NotificationOptions = {
    body: input.body ?? "",
    icon: "/assets/branding/pwa-192.png",
    badge: "/assets/branding/pwa-192.png",
    tag: input.tag,
    data: { link: input.link ?? "/dashboard" },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(input.title, options);
        return;
      }
    }
    new Notification(input.title, options);
  } catch {
    /* notifications must never break the app */
  }
}
