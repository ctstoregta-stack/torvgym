import { registerPlugin } from "@capacitor/core";

type TorvGymWorkoutPlugin = {
  startWorkout(options: { workoutName: string; exerciseName?: string; setLabel?: string; restRemaining?: number; canContinue?: boolean }): Promise<{ started: boolean }>;
  stopWorkout(): Promise<void>;
  updateWorkout(options: { workoutName: string; exerciseName?: string; setLabel?: string; restRemaining?: number; canContinue?: boolean }): Promise<void>;
};

export const TorvGymWorkout = registerPlugin<TorvGymWorkoutPlugin>("TorvGymWorkout");

export async function startNativeWorkoutNotification(workoutName: string, options?: { exerciseName?: string; setLabel?: string; restRemaining?: number; canContinue?: boolean }) {
  try {
    await TorvGymWorkout.startWorkout({ workoutName, ...options });
  } catch {
    // No navegador/PWA ou em plataformas sem o plugin nativo, o treino
    // continua funcionando normalmente; a notificação é um recurso Android.
  }
}

export async function updateNativeWorkoutNotification(workoutName: string, options?: { exerciseName?: string; setLabel?: string; restRemaining?: number; canContinue?: boolean }) {
  try {
    await TorvGymWorkout.updateWorkout({ workoutName, ...options });
  } catch {
    // Recurso opcional do Android.
  }
}

export async function stopNativeWorkoutNotification() {
  try {
    await TorvGymWorkout.stopWorkout();
  } catch {
    // Intencionalmente silencioso fora do Android.
  }
}
