package com.torvgym.app;

import android.os.Bundle;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private TorvGymUpdater updater;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TorvGymWorkoutPlugin.class);
        registerPlugin(TorvGymSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);

        // Use AndroidX's dispatcher so Back is intercepted on modern Android
        // versions, including gesture navigation and predictive Back.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "window.dispatchEvent(new Event('torvgym:hardware-back'))",
                        null
                    );
                } else {
                    // Keep the native fallback only if the WebView is not ready.
                    finish();
                }
            }
        });

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
