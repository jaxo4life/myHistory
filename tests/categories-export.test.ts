import { describe, it, expect } from 'vitest';
import { parseCategories, categoriesToJSON, stampedFilename } from '../src/lib/exporter';
import type { CategoryDef } from '../src/lib/categories';

describe('parseCategories', () => {
  it('解析合法分类数组', () => {
    const text = JSON.stringify([
      { name: '社交', icon: '💬', color: '#EC4899', patterns: ['weibo.com', 'x.com'] },
    ]);
    const result = parseCategories(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('社交');
    expect(result[0].icon).toBe('💬');
    expect(result[0].color).toBe('#EC4899');
    expect(result[0].patterns).toEqual(['weibo.com', 'x.com']);
  });

  it('无效 JSON 返回空数组', () => {
    expect(parseCategories('not json')).toEqual([]);
  });

  it('非数组返回空数组', () => {
    expect(parseCategories(JSON.stringify({ name: 'x' }))).toEqual([]);
  });

  it('跳过缺少 name 的项', () => {
    const text = JSON.stringify([
      { patterns: ['a.com'] },
      { name: 'A', patterns: ['a.com'] },
    ]);
    const result = parseCategories(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('A');
  });

  it('跳过 name 为空或 patterns 非数组的项', () => {
    const text = JSON.stringify([
      { name: '   ', patterns: [] },
      { name: 'B', patterns: 'not-array' },
      { name: 'C', patterns: [] },
    ]);
    const result = parseCategories(text);
    expect(result.map((c) => c.name)).toEqual(['C']);
  });

  it('过滤 patterns 中的非字符串', () => {
    const text = JSON.stringify([
      { name: 'X', patterns: ['a.com', 123, null, 'b.com'] },
    ]);
    const result = parseCategories(text);
    expect(result[0].patterns).toEqual(['a.com', 'b.com']);
  });

  it('缺省 icon/color 为 undefined', () => {
    const result = parseCategories(JSON.stringify([{ name: 'Y', patterns: [] }]));
    expect(result[0].icon).toBeUndefined();
    expect(result[0].color).toBeUndefined();
  });

  it('name 两端空白被 trim', () => {
    const result = parseCategories(JSON.stringify([{ name: '  Z  ', patterns: [] }]));
    expect(result[0].name).toBe('Z');
  });
});

describe('stampedFilename', () => {
  it('生成带时间戳的文件名', () => {
    expect(stampedFilename('my-categories', 'json')).toMatch(
      /^my-categories-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
    );
  });
});

describe('categoriesToJSON ↔ parseCategories 往返', () => {
  it('导出再导入保持一致', () => {
    const cats: CategoryDef[] = [
      { name: 'A', icon: '🎯', color: '#f00', patterns: ['a.com', 'b.com'] },
      { name: 'B', patterns: ['c.com'] },
    ];
    const back = parseCategories(categoriesToJSON(cats));
    expect(back).toEqual(cats);
  });
});
