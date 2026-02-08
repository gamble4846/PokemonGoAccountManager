import { Component, OnInit, signal, computed } from '@angular/core';
import { PasswordService } from '../../services/password.service';
import { CryptoService } from '../../services/crypto.service';
import { StorageService } from '../../services/storage.service';
import { CopyService } from '../../services/copy.service';
import type { Account } from '../../models/account';
import { AccountCardComponent } from '../../components/account-card/account-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AccountCardComponent, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  accounts = signal<Account[]>([]);
  loading = signal(true);
  error = signal('');
  /** Show password entry form when no password is stored. */
  showPasswordForm = signal(false);
  passwordInput = '';
  /** Unique key of the card+field that was just copied. */
  copiedKey = signal<string | null>(null);

  groups = computed(() => {
    const list = this.accounts();
    const map = new Map<string, Account[]>();
    for (const a of list) {
      const cat = a.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(a);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  });

  constructor(
    private password: PasswordService,
    private crypto: CryptoService,
    private storage: StorageService,
    private copy: CopyService
  ) {}

  ngOnInit(): void {
    if (this.password.hasPassword()) {
      this.loadAccounts();
    } else {
      this.showPasswordForm.set(true);
      this.loading.set(false);
    }
  }

  async onSubmitPassword(): Promise<void> {
    const pwd = this.passwordInput.trim();
    if (!pwd) return;
    this.password.setPassword(pwd);
    this.showPasswordForm.set(false);
    this.passwordInput = '';
    await this.loadAccounts();
  }

  private async loadAccounts(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const pwd = this.password.getPassword();
    if (!pwd) {
      this.loading.set(false);
      return;
    }
    let buffer: ArrayBuffer | null = null;
    const stored = this.storage.getEncryptedData();
    if (stored) {
      buffer = this.storage.base64ToBuffer(stored);
    } else {
      buffer = await this.storage.fetchEncryptedFromServer();
    }
    if (!buffer || buffer.byteLength === 0) {
      this.loading.set(false);
      this.accounts.set([]);
      return;
    }
    try {
      const list = await this.crypto.decrypt(buffer, pwd);
      this.accounts.set(list);
    } catch {
      this.error.set('Wrong password or invalid data.');
      this.password.clearPassword();
      this.showPasswordForm.set(true);
      this.accounts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onCopy(event: { text: string; field: string; account: Account }): void {
    this.copy.copyToClipboard(event.text).then((ok) => {
      if (ok) {
        const key = `${event.account.email}::${event.account.userName}::${event.field}`;
        this.copiedKey.set(key);
        setTimeout(() => this.copiedKey.set(null), 1500);
      }
    });
  }

  getCardRows(items: Account[]): Account[][] {
    const rows: Account[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return rows;
  }
}
