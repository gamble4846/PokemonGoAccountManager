import { Injectable } from '@angular/core';
import type { Account } from '../models/account';

@Injectable({ providedIn: 'root' })
export class CsvService {
  parse(csvText: string): Account[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = this.parseRow(lines[0]);
    const emailIdx = this.findColumnIndex(header, 'email');
    const userNameIdx = this.findColumnIndex(header, 'username', 'username');
    const passwordIdx = this.findColumnIndex(header, 'password');
    const categoryIdx = this.findColumnIndex(header, 'category', 'catagory');

    if (emailIdx < 0 || userNameIdx < 0 || passwordIdx < 0 || categoryIdx < 0) {
      return [];
    }

    const accounts: Account[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = this.parseRow(lines[i]);
      if (cells.length < Math.max(emailIdx, userNameIdx, passwordIdx, categoryIdx) + 1) continue;
      accounts.push({
        email: (cells[emailIdx] ?? '').trim(),
        userName: (cells[userNameIdx] ?? '').trim(),
        password: (cells[passwordIdx] ?? '').trim(),
        category: (cells[categoryIdx] ?? '').trim() || 'Uncategorized'
      });
    }
    return accounts;
  }

  private parseRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (inQuotes) {
        current += ch;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  private findColumnIndex(header: string[], ...names: string[]): number {
    const lower = header.map((h) => h.trim().toLowerCase());
    for (const name of names) {
      const idx = lower.indexOf(name.toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1;
  }
}
