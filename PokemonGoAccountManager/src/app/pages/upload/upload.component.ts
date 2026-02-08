import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CsvService } from '../../services/csv.service';
import { CryptoService } from '../../services/crypto.service';
import { StorageService, ENCRYPTED_FILE_NAME } from '../../services/storage.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  password = '';
  status = signal<'idle' | 'upload' | 'encrypting' | 'done' | 'error'>('idle');
  message = signal('');

  constructor(
    private csv: CsvService,
    private crypto: CryptoService,
    private storage: StorageService
  ) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const pwd = this.password.trim();
    if (!pwd) {
      this.status.set('error');
      this.message.set('Enter a password to encrypt the data.');
      input.value = '';
      return;
    }

    this.status.set('upload');
    this.message.set('Reading CSV...');
    let text: string;
    try {
      text = await file.text();
    } catch {
      this.status.set('error');
      this.message.set('Could not read file.');
      input.value = '';
      return;
    }

    const accounts = this.csv.parse(text);
    if (accounts.length === 0) {
      this.status.set('error');
      this.message.set('No valid accounts found. Need columns: Email, UserName, Password, Category (or Catagory).');
      input.value = '';
      return;
    }

    this.status.set('encrypting');
    this.message.set('Encrypting...');
    try {
      const buffer = await this.crypto.encrypt(accounts, pwd);
      this.storage.setEncryptedData(this.storage.bufferToBase64(buffer));
      this.downloadBuffer(buffer, ENCRYPTED_FILE_NAME);
      this.status.set('done');
      this.message.set(`Encrypted ${accounts.length} account(s). Data saved locally. Use the same password on the home page to unlock.`);
    } catch {
      this.status.set('error');
      this.message.set('Encryption failed.');
    }
    input.value = '';
  }

  private downloadBuffer(buffer: ArrayBuffer, name: string): void {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
