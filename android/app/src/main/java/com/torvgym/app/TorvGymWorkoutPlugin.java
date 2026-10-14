package com.torvgym.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TorvGymWorkout")
public final class TorvGymWorkoutPlugin extends Plugin {
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7301;

    @PluginMethod
    public void startWorkout(PluginCall call) {
        String workoutName = call.getString("workoutName", "Treino em andamento");
        String exerciseName = call.getString("exerciseName", null);
        String setLabel = call.getString("setLabel", null);
        int restRemaining = call.getInt("restRemaining", 0);
        boolean canContinue = call.getBoolean("canContinue", false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                NOTIFICATION_PERMISSION_REQUEST
            );
        }

        Intent intent = new Intent(getContext(), TorvGymWorkoutService.class)
            .setAction(TorvGymWorkoutService.ACTION_START)
            .putExtra(TorvGymWorkoutService.EXTRA_WORKOUT_NAME, workoutName)
            .putExtra(TorvGymWorkoutService.EXTRA_EXERCISE_NAME, exerciseName)
            .putExtra(TorvGymWorkoutService.EXTRA_SET_LABEL, setLabel)
            .putExtra(TorvGymWorkoutService.EXTRA_REST_REMAINING, restRemaining)
            .putExtra(TorvGymWorkoutService.EXTRA_CAN_CONTINUE, canContinue);

        try {
            ContextCompat.startForegroundService(getContext(), intent);
            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        } catch (RuntimeException error) {
            call.reject("Não foi possível iniciar o serviço de treino em segundo plano.", error);
        }
    }

    @PluginMethod
    public void updateWorkout(PluginCall call) {
        String workoutName = call.getString("workoutName", "Treino em andamento");
        String exerciseName = call.getString("exerciseName", null);
        String setLabel = call.getString("setLabel", null);
        int restRemaining = call.getInt("restRemaining", 0);
        boolean canContinue = call.getBoolean("canContinue", false);
        Intent intent = new Intent(getContext(), TorvGymWorkoutService.class)
            .setAction(TorvGymWorkoutService.ACTION_START)
            .putExtra(TorvGymWorkoutService.EXTRA_WORKOUT_NAME, workoutName)
            .putExtra(TorvGymWorkoutService.EXTRA_EXERCISE_NAME, exerciseName)
            .putExtra(TorvGymWorkoutService.EXTRA_SET_LABEL, setLabel)
            .putExtra(TorvGymWorkoutService.EXTRA_REST_REMAINING, restRemaining)
            .putExtra(TorvGymWorkoutService.EXTRA_CAN_CONTINUE, canContinue);
        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (RuntimeException error) {
            call.reject("Não foi possível atualizar a notificação do treino.", error);
        }
    }

    @PluginMethod
    public void configureReminder(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        int hour = Math.max(0, Math.min(23, call.getInt("hour", 18)));
        int minute = Math.max(0, Math.min(59, call.getInt("minute", 0)));
        int intervalDays = Math.max(1, Math.min(7, call.getInt("intervalDays", 1)));
        SharedPreferences prefs = getContext().getSharedPreferences(TorvGymReminderReceiver.PREFS, android.content.Context.MODE_PRIVATE);
        prefs.edit().putBoolean(TorvGymReminderReceiver.KEY_ENABLED, enabled).putInt(TorvGymReminderReceiver.KEY_HOUR, hour).putInt(TorvGymReminderReceiver.KEY_MINUTE, minute).putInt(TorvGymReminderReceiver.KEY_INTERVAL, intervalDays).apply();
        if (enabled) {
            TorvGymReminderReceiver.schedule(getContext(), hour, minute, intervalDays);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST);
        } else TorvGymReminderReceiver.cancel(getContext());
        JSObject result = new JSObject();
        result.put("scheduled", enabled);
        result.put("notificationsEnabled", Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void stopWorkout(PluginCall call) {
        Intent intent = new Intent(getContext(), TorvGymWorkoutService.class)
            .setAction(TorvGymWorkoutService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }
}
