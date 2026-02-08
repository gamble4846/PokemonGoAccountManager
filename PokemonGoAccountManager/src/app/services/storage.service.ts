import { Injectable } from '@angular/core';

/** CSV file in public folder - always load from here. */
export const ACCOUNTS_CSV_PATH = 'Accounts.csv';

@Injectable({ providedIn: 'root' })
export class StorageService {
  /** Fetch Accounts.csv from the public folder (server). */
  async fetchAccountsCsv(): Promise<string | null> {
    try {
      const res = await fetch(`/${ACCOUNTS_CSV_PATH}`);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }
}
