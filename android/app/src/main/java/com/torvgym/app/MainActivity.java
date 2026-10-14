package com.torvgym.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private TorvGymUpdater updater;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TorvGymWorkoutPlugin.class);
        registerPlugin(TorvGymSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);
        updater = new TorvGymUpdater(this);
        updater.checkForUpdate();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new Event('torvgym:hardware-back'))",
                null
            );
            return;
        }
        super.onBackPressed();
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
