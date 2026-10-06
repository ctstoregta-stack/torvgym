package com.torvgym.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public final class TorvGymWorkoutService extends Service {
    static final String ACTION_START = "com.torvgym.app.action.START_WORKOUT";
    static final String ACTION_STOP = "com.torvgym.app.action.STOP_WORKOUT";
    static final String EXTRA_WORKOUT_NAME = "workout_name";
    static final String EXTRA_EXERCISE_NAME = "exercise_name";
    static final String EXTRA_SET_LABEL = "set_label";
    static final String EXTRA_REST_REMAINING = "rest_remaining";
    static final String EXTRA_CAN_CONTINUE = "can_continue";
    private static final String CHANNEL_ID = "active_workout";
    private static final int NOTIFICATION_ID = 4201;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopWorkout();
            return START_NOT_STICKY;
        }

        String workoutName = intent != null ? intent.getStringExtra(EXTRA_WORKOUT_NAME) : null;
        String exerciseName = intent != null ? intent.getStringExtra(EXTRA_EXERCISE_NAME) : null;
        String setLabel = intent != null ? intent.getStringExtra(EXTRA_SET_LABEL) : null;
        int restRemaining = intent != null ? intent.getIntExtra(EXTRA_REST_REMAINING, 0) : 0;
        boolean canContinue = intent != null && intent.getBooleanExtra(EXTRA_CAN_CONTINUE, false);
        startWorkout(workoutName, exerciseName, setLabel, restRemaining, canContinue);
        return START_STICKY;
    }

    private void startWorkout(String workoutName, String exerciseName, String setLabel, int restRemaining, boolean canContinue) {
        String safeName = workoutName == null || workoutName.trim().isEmpty()
            ? "Treino em andamento"
            : workoutName.trim();

        Intent openIntent = new Intent(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            NOTIFICATION_ID,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.torvgym_logo)
            .setContentTitle("TorvGym — Treino ativo")
            .setContentText(exerciseName == null || exerciseName.trim().isEmpty() ? safeName + " continua ativo" : exerciseName + (setLabel == null ? "" : " · " + setLabel))
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText(buildNotificationText(safeName, exerciseName, setLabel, restRemaining, canContinue)))
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentIntent)
            .setAutoCancel(false)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private String buildNotificationText(String workoutName, String exerciseName, String setLabel, int restRemaining, boolean canContinue) {
        StringBuilder text = new StringBuilder(workoutName);
        if (exerciseName != null && !exerciseName.trim().isEmpty()) text.append("
").append(exerciseName.trim());
        if (setLabel != null && !setLabel.trim().isEmpty()) text.append(" · ").append(setLabel.trim());
        if (restRemaining > 0) text.append("
Descanso: ").append(restRemaining).append("s");
        if (canContinue) text.append("
Toque para continuar");
        return text.toString();
    }

    private void stopWorkout() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Treino em andamento",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Indica quando existe um treino ativo em segundo plano.");
        channel.setShowBadge(false);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // O serviço é independente da Activity e continua ativo quando o
        // usuário remove o TorvGym da lista de aplicativos recentes.
        super.onTaskRemoved(rootIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
