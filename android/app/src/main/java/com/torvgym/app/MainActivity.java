package com.torvgym.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private TorvGymUpdater updater;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TorvGymWorkoutPlugin.class);
        super.onCreate(savedInstanceState);
        updater = new TorvGymUpdater(this);
        updater.checkForUpdate();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (updater != null) {
            updater.onResume();
        }
    }

    @Override
    public void onDestroy() {
        if (updater != null) {
            updater.shutdown();
            updater = null;
        }
        super.onDestroy();
    }
}
