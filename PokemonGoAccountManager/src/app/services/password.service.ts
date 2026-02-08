import { Injectable } from '@angular/core';

const STORAGE_KEY = 'pogo_account_manager_password';

@Injectable({ providedIn: 'root' })
export class PasswordService {
  getPassword(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  }

  setPassword(password: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, password);
  }

  clearPassword(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  hasPassword(): boolean {
    const p = this.getPassword();
    return p !== null && p.length > 0;
  }
}
