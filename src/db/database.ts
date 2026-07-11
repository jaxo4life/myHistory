import Dexie, { type Table } from 'dexie';
import type { Visit } from '../types/visit';

export class HistoryDB extends Dexie {
  visits!: Table<Visit, number>;

  constructor() {
    super('ChromeHistoryPlus');
    this.version(1).stores({
      visits: '++id, domain, dayKey, visitTime',
    });
    this.version(2).stores({
      visits: '++id, domain, dayKey, visitTime, *tags',
    });
  }
}

export const db = new HistoryDB();
