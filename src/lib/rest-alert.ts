const KEY = "torvgym.rest-alert.v1";

export type RestAlertPrefs = { vibrate: boolean; sound: boolean };

export const DEFAULT_REST_ALERT: RestAlertPrefs = { vibrate: true, sound: false };

const VIBRATION_PATTERN = [200, 100, 200, 100, 400];

export function loadRestAlertPrefs(): RestAlertPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_REST_ALERT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_REST_ALERT };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_REST_ALERT };
    const { vibrate, sound } = parsed as Record<string, unknown>;
    return {
      vibrate: typeof vibrate === "boolean" ? vibrate : DEFAULT_REST_ALERT.vibrate,
      sound: typeof sound === "boolean" ? sound : DEFAULT_REST_ALERT.sound,
    };
  } catch {
    return { ...DEFAULT_REST_ALERT };
  }
}

export function saveRestAlertPrefs(prefs: RestAlertPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Armazenamento indisponível: a preferência vale só nesta sessão.
  }
}

function playBeeps() {
  const Ctor =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Ctor) return false;
  try {
    const context = new Ctor();
    void context.resume?.().catch(() => {});
    const start = context.currentTime + 0.02;
    for (let i = 0; i < 3; i += 1) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = start + i * 0.28;
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.22);
    }
    window.setTimeout(() => void context.close().catch(() => {}), 1500);
    return true;
  } catch {
    return false;
  }
}

/** Avisa que o descanso terminou, respeitando as preferências do usuário. */
export function playRestAlert(prefs: RestAlertPrefs = loadRestAlertPrefs()) {
  let vibrated = false;
  let sounded = false;
  if (prefs.vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      vibrated = Boolean(navigator.vibrate?.(VIBRATION_PATTERN));
    } catch {
      vibrated = false;
    }
  }
  if (prefs.sound) sounded = playBeeps();
  return { vibrated, sounded };
}
