import { registerPlugin } from "@capacitor/core";
type WorkoutOptions = {
  workoutName: string;
  exerciseName?: string;
  setLabel?: string;
  restRemaining?: number;
  canContinue?: boolean;
};
type ReminderOptions = { enabled: boolean; hour: number; minute: number; intervalDays: number };
type TorvGymWorkoutPlugin = {
  startWorkout(options: WorkoutOptions): Promise<{ started: boolean }>;
  stopWorkout(): Promise<void>;
  updateWorkout(options: WorkoutOptions): Promise<void>;
  configureReminder(
    options: ReminderOptions,
  ): Promise<{ scheduled: boolean; notificationsEnabled: boolean }>;
};
export const TorvGymWorkout = registerPlugin<TorvGymWorkoutPlugin>("TorvGymWorkout");
export async function configureNativeTrainingReminder(options: ReminderOptions) {
  try {
    return await TorvGymWorkout.configureReminder(options);
  } catch {
    return { scheduled: false, notificationsEnabled: false };
  }
}
export async function startNativeWorkoutNotification(
  workoutName: string,
  options?: Omit<WorkoutOptions, "workoutName">,
) {
  try {
    await TorvGymWorkout.startWorkout({ workoutName, ...options });
  } catch {
    /* Recurso opcional Android. */
  }
}
export async function updateNativeWorkoutNotification(
  workoutName: string,
  options?: Omit<WorkoutOptions, "workoutName">,
) {
  try {
    await TorvGymWorkout.updateWorkout({ workoutName, ...options });
  } catch {
    /* Recurso opcional Android. */
  }
}
export async function stopNativeWorkoutNotification() {
  try {
    await TorvGymWorkout.stopWorkout();
  } catch {
    /* Recurso opcional Android. */
  }
}
