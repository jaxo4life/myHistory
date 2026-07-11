import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { addVisit, getTodayCount } from '../src/db/queries';
import { todayKey } from '../src/lib/url-utils';
import type { NewVisit } from '../src/types/visit';

const tk = todayKey();

function mk(domain: string, dayKey: string = tk): NewVisit {
  return {
    url: `https://${domain}/`,
    domain,
    title: domain,
    visitTime: Date.now(),
    dayKey,
    transitionType: 'link',
  };
}

describe('getTodayCount', () => {
  beforeEach(async () => {
    await db.visits.clear();
  });

  it('只计今日记录，忽略其他日期', async () => {
    await addVisit(mk('a.com'));
    await addVisit(mk('b.com'));
    await addVisit(mk('c.com', '2020-01-01'));
    expect(await getTodayCount()).toBe(2);
  });

  it('无今日记录返回 0', async () => {
    expect(await getTodayCount()).toBe(0);
  });
});
