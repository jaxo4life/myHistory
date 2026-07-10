import Dexie, { type Table } from 'dexie';
import type { Visit } from '../types/visit';

export class HistoryDB extends Dexie {
  visits!: Table<Visit, number>;

  constructor() {
    super('ChromeHistoryPlus');
    this.version(1).stores({
      // ++id 自增主键；其余为索引（domain/dayKey/visitTime 用于查询）
      visits: '++id, domain, dayKey, visitTime',
    });
  }
}

export const db = new HistoryDB();
