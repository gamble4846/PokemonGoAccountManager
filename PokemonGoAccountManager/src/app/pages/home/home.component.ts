import { Component, OnInit, signal, computed } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';
import { CopyService } from '../../services/copy.service';
import type { Account } from '../../models/account';
import { AccountCardComponent } from '../../components/account-card/account-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AccountCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  accounts = signal<Account[]>([]);
  loading = signal(true);
  error = signal('');
  /** Unique key of the card+field that was just copied (e.g. "email::user@x.com::email"). */
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
    private storage: StorageService,
    private csv: CsvService,
    private copy: CopyService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  private async loadAccounts(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const csvText = await this.storage.fetchAccountsCsv();
    if (!csvText || !csvText.trim()) {
      this.loading.set(false);
      this.accounts.set([]);
      return;
    }
    const list = this.csv.parse(csvText);
    this.accounts.set(list);
    this.loading.set(false);
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
