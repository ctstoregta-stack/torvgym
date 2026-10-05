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
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class TorvGymUpdater {
    private static final String TAG = "TorvGymUpdater";
    private static final String PREFS = "torvgym_updater";
    private static final String PREF_LAST_DISMISSED = "last_dismissed_tag";
    private static final String PREF_PENDING_DOWNLOAD_ID = "pending_download_id";
    private static final String PREF_PENDING_SHA256 = "pending_sha256";
    private static final String PREF_LAST_CHECK_MS = "last_check_ms";
    private static final long CHECK_INTERVAL_MS = 30L * 60L * 1000L;
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
            clearPendingDownload();
            openDownloadedApk(downloadId);
        }
    };

    private long pendingDownloadId = -1L;
    private String pendingAssetUrl;
    private String pendingTag;
    private String pendingSha256;
    private boolean receiverRegistered;

    TorvGymUpdater(@NonNull BridgeActivity activity) {
        this.activity = activity;
        this.preferences = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        this.pendingDownloadId = preferences.getLong(PREF_PENDING_DOWNLOAD_ID, -1L);
        this.pendingSha256 = preferences.getString(PREF_PENDING_SHA256, null);
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
        preferences.edit().putLong(PREF_LAST_CHECK_MS, System.currentTimeMillis()).apply();

        HttpURLConnection connection = (HttpURLConnection) new URL(
            "https://api.github.com/repos/ctstoregta-stack/torvgym/releases/latest"
        ).openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(10000);
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/vnd.github+json");
        connection.setRequestProperty("X-GitHub-Api-Version", "2022-11-28");
        connection.setRequestProperty("User-Agent", "TorvGym-Updater");
        connection.setUseCaches(false);
        connection.setRequestProperty("Cache-Control", "no-cache");

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

            int versionCode = Integer.parseInt(matcher.group(1));
            if (versionCode <= BuildConfig.VERSION_CODE) return null;

            org.json.JSONArray assets = json.optJSONArray("assets");
            if (assets == null) return null;

            String assetUrl = "";
            String sha256 = "";
            for (int i = 0; i < assets.length(); i++) {
                JSONObject asset = assets.optJSONObject(i);
                if (asset == null || !"app-release.apk".equals(asset.optString("name", ""))) continue;

                assetUrl = asset.optString("browser_download_url", "");
                String digest = asset.optString("digest", "").trim();
                if (digest.startsWith("sha256:")) {
                    sha256 = digest.substring("sha256:".length()).trim();
                }
                break;
            }

            if (!assetUrl.matches("^https://github\\.com/ctstoregta-stack/torvgym/releases/download/v1\\.0\\.\\d+/app-release\\.apk$")) {
                return null;
            }
            if (!sha256.matches("(?i)^[0-9a-f]{64}$")) return null;

            Uri parsedAsset = Uri.parse(assetUrl);
            if (!"https".equalsIgnoreCase(parsedAsset.getScheme())
                || !"github.com".equalsIgnoreCase(parsedAsset.getHost())) {
                return null;
            }

            return new Release(versionCode, tag, assetUrl, sha256.toUpperCase(java.util.Locale.ROOT));
        } finally {
            connection.disconnect();
        }
    }

    private void showUpdateDialog(Release release) {
        new AlertDialog.Builder(activity)
            .setTitle("Nova atualização do TorvGym")
            .setMessage("A versão " + release.tag + " está disponível. Deseja atualizar agora?")
            .setNegativeButton("Agora não", (dialog, which) ->
                preferences.edit().putString(PREF_LAST_DISMISSED, release.tag).apply())
            .setPositiveButton("Atualizar", (dialog, which) -> beginUpdate(release))
            .show();
    }

    private void beginUpdate(Release release) {
        pendingAssetUrl = release.assetUrl;
        pendingTag = release.tag;
        pendingSha256 = release.sha256;

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
        if (pendingAssetUrl == null) {
            long lastCheck = preferences.getLong(PREF_LAST_CHECK_MS, 0L);
            if (System.currentTimeMillis() - lastCheck >= CHECK_INTERVAL_MS) {
                preferences.edit().putLong(PREF_LAST_CHECK_MS, System.currentTimeMillis()).apply();
                checkForUpdate();
            }
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O
            || activity.getPackageManager().canRequestPackageInstalls()) {
            startDownload();
        }
    }

    private void startDownload() {
        if (pendingDownloadId != -1L || pendingAssetUrl == null) return;

        registerDownloadReceiver();
        DownloadManager downloadManager =
            (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) return;

        String fileName = "TorvGym-update-" + pendingTag + ".apk";
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(pendingAssetUrl));
        request.setTitle("Atualizando TorvGym");
        request.setDescription("Baixando " + pendingTag);
        request.setMimeType("application/vnd.android.package-archive");
        request.setNotificationVisibility(
            DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
        );
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

        pendingDownloadId = downloadManager.enqueue(request);
        preferences.edit()
            .putLong(PREF_PENDING_DOWNLOAD_ID, pendingDownloadId)
            .putString(PREF_PENDING_SHA256, pendingSha256)
            .apply();
        pendingAssetUrl = null;
        pendingTag = null;
    }

    private void resumePendingDownload() {
        if (pendingDownloadId == -1L) return;
        DownloadManager downloadManager =
            (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
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
                Uri uri = downloadManager.getUriForDownloadedFile(completedId);
                if (uri == null || pendingSha256 == null || !verifySha256(uri, pendingSha256)) {
                    downloadManager.remove(completedId);
                    clearPendingDownload();
                    activity.runOnUiThread(() ->
                        Toast.makeText(activity, "A atualização foi rejeitada: integridade do APK não pôde ser confirmada.", Toast.LENGTH_LONG).show()
                    );
                    return;
                }
                clearPendingDownload();
                openDownloadedApk(completedId);
            } else if (status == DownloadManager.STATUS_FAILED) {
                Log.w(TAG, "Download da atualização falhou; será permitido tentar novamente.");
                clearPendingDownload();
                activity.runOnUiThread(() ->
                    Toast.makeText(activity, "Não foi possível baixar a atualização. Tente novamente.", Toast.LENGTH_LONG).show()
                );
            }
        } catch (Exception e) {
            Log.w(TAG, "Não foi possível recuperar o download da atualização", e);
        }
    }

    private void clearPendingDownload() {
        pendingDownloadId = -1L;
        preferences.edit().remove(PREF_PENDING_DOWNLOAD_ID).remove(PREF_PENDING_SHA256).apply();
    }


    private boolean verifySha256(Uri uri, String expected) {
        try (InputStream stream = activity.getContentResolver().openInputStream(uri)) {
            if (stream == null) return false;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = stream.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            StringBuilder actual = new StringBuilder(64);
            for (byte value : digest.digest()) {
                actual.append(String.format(java.util.Locale.ROOT, "%02x", value));
            }
            return actual.toString().equalsIgnoreCase(expected);
        } catch (Exception e) {
            Log.w(TAG, "Não foi possível validar o SHA-256 do APK baixado", e);
            return false;
        }
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
        DownloadManager downloadManager =
            (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
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
        final String sha256;

        Release(int versionCode, String tag, String assetUrl, String sha256) {
            this.versionCode = versionCode;
            this.tag = tag;
            this.assetUrl = assetUrl;
            this.sha256 = sha256;
        }
    }
}
