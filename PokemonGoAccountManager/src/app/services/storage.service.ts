import { Injectable } from '@angular/core';

const ENCRYPTED_DATA_KEY = 'pogo_encrypted_accounts';

/** Encrypted file name for download / public folder. */
export const ENCRYPTED_FILE_NAME = 'accounts.enc';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getEncryptedData(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(ENCRYPTED_DATA_KEY);
  }

  setEncryptedData(base64: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ENCRYPTED_DATA_KEY, base64);
  }

  hasEncryptedData(): boolean {
    const d = this.getEncryptedData();
    return d !== null && d.length > 0;
  }

  /** Fetch encrypted file from server (public folder) if you deploy accounts.enc there. */
  async fetchEncryptedFromServer(): Promise<ArrayBuffer | null> {
    try {
      const res = await fetch(`/${ENCRYPTED_FILE_NAME}`);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
