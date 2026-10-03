package com.torvgym.app;

import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class TorvGymUpdater {
    private static final String TAG = "TorvGymUpdater";
    private static final String RELEASE_API = "https://api.github.com/repos/ctstoregta-stack/torvgym/releases/latest";
    private static final String RELEASE_ASSET_NAME = "torvgym-release.apk";
    private static final String PREFS = "torvgym_updater";
    private static final String PREF_LAST_DISMISSED = "last_dismissed_tag";
    private static final String PREF_PENDING_DOWNLOAD_ID = "pending_download_id";
    private static final Pattern VERSION_TAG = Pattern.compile("^v1\\.0\\.(\\d+)$");

    private final BridgeActivity activity;
    private final SharedPreferences preferences;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final BroadcastReceiver downloadReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
            long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
            if (downloadId != pendingDownloadId) return;
            if (downloadId != pendingDownloadId) return;
            clearPendingDownload();
            openDownloadedApk(downloadId);
        }
    };

    private long pendingDownloadId = -1L;
    private String pendingAssetUrl;
    private String pendingTag;
    private boolean receiverRegistered;

    TorvGymUpdater(@NonNull BridgeActivity activity) {
        this.activity = activity;
        this.preferences = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        this.pendingDownloadId = preferences.getLong(PREF_PENDING_DOWNLOAD_ID, -1L);
    }

    void checkForUpdate() {
        executor.execute(() -> {
            try {
                Release release = fetchLatestRelease();
                if (release == null || release.versionCode <= BuildConfig.VERSION_CODE) return;
                if (release.tag.equals(preferences.getString(PREF_LAST_DISMISSED, ""))) return;
                activity.runOnUiThread(() -> showUpdateDialog(release));
            } catch (Exception e) {
                Log.d(TAG, "Falha ao verificar atualização", e);
            }
        });
    }

    private Release fetchLatestRelease() throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(RELEASE_API).openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(10000);
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/vnd.github+json");
        connection.setRequestProperty("User-Agent", "TorvGym-Updater");

        try {
            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return null;

            StringBuilder body = new StringBuilder();
            try (InputStream stream = connection.getInputStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
                String line;
                while ((line = reader.readLine()) != null) body.append(line);
            }

            JSONObject json = new JSONObject(body.toString());
            String tag = json.optString("tag_name", "");
            Matcher matcher = VERSION_TAG.matcher(tag);
            if (!matcher.matches()) return null;

            String assetUrl = null;
            JSONArray assets = json.optJSONArray("assets");
            if (assets != null) {
                for (int i = 0; i < assets.length(); i++) {
                    JSONObject asset = assets.optJSONObject(i);
                    if (asset != null && RELEASE_ASSET_NAME.equals(asset.optString("name"))) {
                        assetUrl = asset.optString("browser_download_url", null);
                        break;
                    }
                }
            }

            if (assetUrl == null || !assetUrl.startsWith("https://github.com/")) return null;
            return new Release(Integer.parseInt(matcher.group(1)), tag, assetUrl);
        } finally {
            connection.disconnect();
        }
    }

    private void showUpdateDialog(Release release) {
        new AlertDialog.Builder(activity)
            .setTitle("Nova atualização do TorvGym")
            .setMessage("A versão " + release.tag + " está disponível. Deseja atualizar agora?")
            .setNegativeButton("Agora não", (dialog, which) -> preferences.edit().putString(PREF_LAST_DISMISSED, release.tag).apply())
            .setPositiveButton("Atualizar", (dialog, which) -> beginUpdate(release))
            .show();
    }

    private void beginUpdate(Release release) {
        pendingAssetUrl = release.assetUrl;
        pendingTag = release.tag;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !activity.getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.getPackageName())
                );
                activity.startActivityForResult(intent, 9100);
            } catch (Exception e) {
                Log.w(TAG, "Não foi possível abrir a configuração de instalação", e);
            }
            return;
        }

        startDownload();
    }

    void onResume() {
        if (pendingDownloadId != -1L) {
            registerDownloadReceiver();
            resumePendingDownload();
            return;
        }
        if (pendingAssetUrl == null) return;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O
            || activity.getPackageManager().canRequestPackageInstalls()) {
            startDownload();
        }
    }

    private void startDownload() {
        if (pendingDownloadId != -1L || pendingAssetUrl == null) return;

        registerDownloadReceiver();
        DownloadManager downloadManager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) return;

        String fileName = "TorvGym-update-" + pendingTag + ".apk";
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(pendingAssetUrl));
        request.setTitle("Atualizando TorvGym");
        request.setDescription("Baixando " + pendingTag);
        request.setMimeType("application/vnd.android.package-archive");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

        pendingDownloadId = downloadManager.enqueue(request);
        preferences.edit().putLong(PREF_PENDING_DOWNLOAD_ID, pendingDownloadId).apply();
        pendingAssetUrl = null;
        pendingTag = null;
    }

    private void resumePendingDownload() {
        if (pendingDownloadId == -1L) return;
        DownloadManager downloadManager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) return;

        try (android.database.Cursor cursor = downloadManager.query(
            new DownloadManager.Query().setFilterById(pendingDownloadId))) {
            if (cursor == null || !cursor.moveToFirst()) {
                clearPendingDownload();
                return;
            }
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                long completedId = pendingDownloadId;
                clearPendingDownload();
                openDownloadedApk(completedId);
            } else if (status == DownloadManager.STATUS_FAILED) {
                Log.w(TAG, "Download da atualização falhou; será permitido tentar novamente.");
                clearPendingDownload();
            }
        } catch (Exception e) {
            Log.w(TAG, "Não foi possível recuperar o download da atualização", e);
        }
    }

    private void clearPendingDownload() {
        pendingDownloadId = -1L;
        preferences.edit().remove(PREF_PENDING_DOWNLOAD_ID).apply();
    }

    @SuppressWarnings("deprecation")
    private void registerDownloadReceiver() {
        if (receiverRegistered) return;
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            activity.registerReceiver(downloadReceiver, filter);
        }
        receiverRegistered = true;
    }

    private void openDownloadedApk(long downloadId) {
        DownloadManager downloadManager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) return;

        Uri uri = downloadManager.getUriForDownloadedFile(downloadId);
        if (uri == null) return;

        Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.putExtra(Intent.EXTRA_RETURN_RESULT, true);

        try {
            activity.startActivity(intent);
        } catch (Exception e) {
            Log.w(TAG, "Não foi possível abrir o instalador do Android", e);
        }
    }

    void shutdown() {
        if (receiverRegistered) {
            try {
                activity.unregisterReceiver(downloadReceiver);
            } catch (IllegalArgumentException ignored) {}
            receiverRegistered = false;
        }
        executor.shutdownNow();
    }

    private static final class Release {
        final int versionCode;
        final String tag;
        final String assetUrl;

        Release(int versionCode, String tag, String assetUrl) {
            this.versionCode = versionCode;
            this.tag = tag;
            this.assetUrl = assetUrl;
        }
    }
}
