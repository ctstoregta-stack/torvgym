package com.torvgym.app;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.util.Calendar;
public final class TorvGymReminderReceiver extends BroadcastReceiver {
 static final String ACTION_REMINDER="com.torvgym.app.action.TRAINING_REMINDER", PREFS="torvgym_training_reminder", KEY_ENABLED="enabled", KEY_HOUR="hour", KEY_MINUTE="minute", KEY_INTERVAL="interval_days";
 static final int REQUEST_CODE=4202; private static final String CHANNEL="training_reminders";
 @Override public void onReceive(Context c, Intent i) { if(i==null||!ACTION_REMINDER.equals(i.getAction()))return; if(!c.getSharedPreferences(PREFS,Context.MODE_PRIVATE).getBoolean(KEY_ENABLED,false))return; NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE); if(nm==null)return; if(Build.VERSION.SDK_INT>=26)nm.createNotificationChannel(new NotificationChannel(CHANNEL,"Lembretes de treino",NotificationManager.IMPORTANCE_DEFAULT)); Intent open=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP); PendingIntent pi=PendingIntent.getActivity(c,REQUEST_CODE,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE); Notification n=new NotificationCompat.Builder(c,CHANNEL).setSmallIcon(R.drawable.torvgym_logo).setContentTitle("Hora de treinar").setContentText("Seu próximo treino está esperando por você.").setCategory(NotificationCompat.CATEGORY_REMINDER).setAutoCancel(true).setContentIntent(pi).build(); nm.notify(REQUEST_CODE,n); }
 static void cancel(Context c){AlarmManager a=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);if(a!=null)a.cancel(pending(c));}
 static void schedule(Context c,int h,int m,int d){cancel(c);Calendar n=Calendar.getInstance();n.set(Calendar.HOUR_OF_DAY,Math.max(0,Math.min(23,h)));n.set(Calendar.MINUTE,Math.max(0,Math.min(59,m)));n.set(Calendar.SECOND,0);n.set(Calendar.MILLISECOND,0);if(!n.after(Calendar.getInstance()))n.add(Calendar.DAY_OF_YEAR,1);AlarmManager a=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);if(a!=null)a.setInexactRepeating(AlarmManager.RTC_WAKEUP,n.getTimeInMillis(),Math.max(1,Math.min(7,d))*AlarmManager.INTERVAL_DAY,pending(c));}
 private static PendingIntent pending(Context c){return PendingIntent.getBroadcast(c,REQUEST_CODE,new Intent(c,TorvGymReminderReceiver.class).setAction(ACTION_REMINDER),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
}