import Dexie, { type Table } from 'dexie';
import type { Visit } from '../types/visit';

export class HistoryDB extends Dexie {
  visits!: Table<Visit, number>;

  constructor() {
    super('ChromeHistoryPlus');
    this.version(1).stores({
      visits: '++id, domain, dayKey, visitTime',
    });
    // v2: 增加 *tags 多值索引，支持按标签查询
    this.version(2).stores({
      visits: '++id, domain, dayKey, visitTime, *tags',
    });
  }
}

export const db = new HistoryDB();
