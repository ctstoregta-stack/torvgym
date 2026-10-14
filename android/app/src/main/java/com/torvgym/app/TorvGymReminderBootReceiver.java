package com.torvgym.app;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
public final class TorvGymReminderBootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){if(i==null||!Intent.ACTION_BOOT_COMPLETED.equals(i.getAction()))return;SharedPreferences p=c.getSharedPreferences(TorvGymReminderReceiver.PREFS,Context.MODE_PRIVATE);if(p.getBoolean(TorvGymReminderReceiver.KEY_ENABLED,false))TorvGymReminderReceiver.schedule(c,p.getInt(TorvGymReminderReceiver.KEY_HOUR,18),p.getInt(TorvGymReminderReceiver.KEY_MINUTE,0),p.getInt(TorvGymReminderReceiver.KEY_INTERVAL,1));}
}