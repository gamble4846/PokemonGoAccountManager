import { Component, input, output } from '@angular/core';
import type { Account } from '../../models/account';

@Component({
  selector: 'app-account-card',
  standalone: true,
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.css'
})
export class AccountCardComponent {
  account = input.required<Account>();
  copiedField = input<string | null>(null);
  readonly copy = output<{ text: string; field: string; account: Account }>();

  copyEmail(): void {
    this.copy.emit({ text: this.account().email, field: 'email', account: this.account() });
  }

  copyUsername(): void {
    this.copy.emit({ text: this.account().userName, field: 'username', account: this.account() });
  }

  copyPassword(): void {
    this.copy.emit({ text: this.account().password, field: 'password', account: this.account() });
  }

  /** Unique key for this card + field (so only this button shows copied). */
  copiedKeyFor(field: string): string {
    const a = this.account();
    return `${a.email}::${a.userName}::${field}`;
  }

  isCopied(field: string): boolean {
    return this.copiedField() === this.copiedKeyFor(field);
  }
}
