import { registerPlugin } from "@capacitor/core";

type TorvGymWorkoutPlugin = {
  startWorkout(options: { workoutName: string }): Promise<{ started: boolean }>;
  stopWorkout(): Promise<void>;
};

export const TorvGymWorkout = registerPlugin<TorvGymWorkoutPlugin>("TorvGymWorkout");

export async function startNativeWorkoutNotification(workoutName: string) {
  try {
    await TorvGymWorkout.startWorkout({ workoutName });
  } catch {
    // No navegador/PWA ou em plataformas sem o plugin nativo, o treino
    // continua funcionando normalmente; a notificação é um recurso Android.
  }
}

export async function stopNativeWorkoutNotification() {
  try {
    await TorvGymWorkout.stopWorkout();
  } catch {
    // Intencionalmente silencioso fora do Android.
  }
}
