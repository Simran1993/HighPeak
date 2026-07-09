package com.travelit.backend.file;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * AES-256-GCM encryption for files at rest. The key is derived from
 * {@code app.files.encryption-key} (falls back to the JWT secret) via SHA-256,
 * so no extra configuration is needed in dev. Set FILE_ENCRYPTION_KEY in prod.
 */
@Service
public class FileCryptoService {

    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    @Value("${app.files.encryption-key:${app.jwt.secret}}")
    private String configuredKey;

    private SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    @PostConstruct
    void init() throws Exception {
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] derived = sha256.digest(("highpeak-files:" + configuredKey).getBytes(StandardCharsets.UTF_8));
        key = new SecretKeySpec(derived, "AES");
    }

    public byte[] newIv() {
        byte[] iv = new byte[IV_LENGTH];
        random.nextBytes(iv);
        return iv;
    }

    public byte[] encrypt(byte[] plaintext, byte[] iv) {
        return run(Cipher.ENCRYPT_MODE, plaintext, iv);
    }

    public byte[] decrypt(byte[] ciphertext, byte[] iv) {
        return run(Cipher.DECRYPT_MODE, ciphertext, iv);
    }

    private byte[] run(int mode, byte[] input, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(mode, key, new GCMParameterSpec(TAG_BITS, iv));
            return cipher.doFinal(input);
        } catch (Exception e) {
            throw new IllegalStateException("File encryption failure", e);
        }
    }
}
