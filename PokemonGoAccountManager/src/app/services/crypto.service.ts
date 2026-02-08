import { Injectable } from '@angular/core';
import type { Account } from '../models/account';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;
const PBKDF2_ITERATIONS = 250000;

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt).buffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(accounts: Account[], password: string): Promise<ArrayBuffer> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await this.deriveKey(password, salt);

    const payload = JSON.stringify(accounts);
    const enc = new TextEncoder();
    const plaintext = enc.encode(payload);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH
      },
      key,
      plaintext
    );

    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    return combined.buffer;
  }

  async decrypt(data: ArrayBuffer, password: string): Promise<Account[]> {
    const arr = new Uint8Array(data);
    const salt = arr.slice(0, SALT_LENGTH);
    const iv = arr.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = arr.slice(SALT_LENGTH + IV_LENGTH);

    const key = await this.deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const json = dec.decode(plaintext);
    return JSON.parse(json) as Account[];
  }
}
