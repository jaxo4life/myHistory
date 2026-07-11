export interface Visit {
  id?: number;
  url: string;
  domain: string;
  title: string;
  visitTime: number;
  dayKey: string;
  transitionType: string;
  referrerUrl?: string;
  faviconUrl?: string;
  tags?: string[];
}

export type NewVisit = Omit<Visit, 'id'>;
