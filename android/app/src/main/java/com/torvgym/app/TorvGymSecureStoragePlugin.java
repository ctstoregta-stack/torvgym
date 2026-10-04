package com.torvgym.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "TorvGymSecureStorage")
public final class TorvGymSecureStoragePlugin extends Plugin {
    private static final String KEY_ALIAS = "TorvGymLocalStateKey";
    private SecretKey getOrCreateKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) return ((KeyStore.SecretKeyEntry) store.getEntry(KEY_ALIAS, null)).getSecretKey();
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).setUserAuthenticationRequired(false).build());
        return generator.generateKey();
    }
    @PluginMethod public void encrypt(PluginCall call) {
        try {
            String plaintext=call.getString("plaintext"); if(plaintext==null) throw new IllegalArgumentException("plaintext ausente");
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE,getOrCreateKey());
            JSObject out=new JSObject(); out.put("iv",Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP));
            out.put("ciphertext",Base64.encodeToString(cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP)); out.put("version",1); call.resolve(out);
        } catch(Exception e){call.reject("Não foi possível proteger os dados locais.",e);}
    }
    @PluginMethod public void decrypt(PluginCall call) {
        try {
            String iv=call.getString("iv"), ciphertext=call.getString("ciphertext"); if(iv==null||ciphertext==null) throw new IllegalArgumentException("dados ausentes");
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE,getOrCreateKey(),new GCMParameterSpec(128,Base64.decode(iv,Base64.DEFAULT)));
            JSObject out=new JSObject(); out.put("plaintext",new String(cipher.doFinal(Base64.decode(ciphertext,Base64.DEFAULT)),StandardCharsets.UTF_8)); call.resolve(out);
        } catch(Exception e){call.reject("Não foi possível descriptografar os dados locais.",e);}
    }
}