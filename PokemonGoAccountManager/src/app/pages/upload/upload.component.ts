import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CsvService } from '../../services/csv.service';
import { StorageService, ACCOUNTS_CSV_PATH } from '../../services/storage.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  status = signal<'idle' | 'upload' | 'done' | 'error'>('idle');
  message = signal('');

  constructor(
    private csv: CsvService,
    private storage: StorageService
  ) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

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

    // Rebuild CSV with header for download
    const header = 'Email,UserName,Password,Category';
    const rows = accounts.map((a) => `${this.escapeCsv(a.email)},${this.escapeCsv(a.userName)},${this.escapeCsv(a.password)},${this.escapeCsv(a.category)}`);
    const csvOut = [header, ...rows].join('\r\n');
    this.downloadCsv(csvOut, ACCOUNTS_CSV_PATH);
    this.status.set('done');
    this.message.set(`Saved ${accounts.length} account(s). Put ${ACCOUNTS_CSV_PATH} in your public folder.`);
    input.value = '';
  }

  private escapeCsv(val: string): string {
    if (/[",\r\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  }

  private downloadCsv(content: string, name: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
