export interface Visit {
  id?: number;
  url: string;
  domain: string;
  title: string;
  visitTime: number; // 毫秒时间戳
  dayKey: string; // 'YYYY-MM-DD'，本地时区
  transitionType: string; // link/typed/redirect/reload...
  referrerUrl?: string;
  faviconUrl?: string;
}

/** 写入时不含自增 id */
export type NewVisit = Omit<Visit, 'id'>;
