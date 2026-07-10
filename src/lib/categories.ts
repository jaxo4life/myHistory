export interface CategoryDef {
  name: string;
  patterns: string[];
}

/**
 * 内置默认分类规则（用户可在「分析」页自定义覆盖）。
 * 匹配顺序即优先级；邮件类放在搜索前，确保 mail.google.com 归入"邮件"。
 * pattern 以 '.' 结尾表示前缀匹配（如 'news.'），否则按域名精确/子域名后缀匹配。
 */
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: '社交', patterns: ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'weibo.com', 't.me', 'linkedin.com', 'reddit.com', 'discord.com'] },
  { name: '视频', patterns: ['youtube.com', 'youtu.be', 'bilibili.com', 'netflix.com', 'vimeo.com', 'tiktok.com', 'douyin.com'] },
  { name: '购物', patterns: ['amazon.com', 'ebay.com', 'taobao.com', 'tmall.com', 'jd.com', 'aliexpress.com'] },
  { name: '新闻', patterns: ['news.', 'bbc.com', 'cnn.com', 'nytimes.com', 'reuters.com', 'theguardian.com', 'sina.com.cn', 'qq.com'] },
  { name: '邮件', patterns: ['mail.google.com', 'gmail.com', 'outlook.live.com', 'mail.yahoo.com'] },
  { name: '搜索', patterns: ['google.com', 'bing.com', 'baidu.com', 'duckduckgo.com', 'yahoo.com'] },
  { name: '工作', patterns: ['notion.so', 'slack.com', 'trello.com', 'atlassian.net', 'office.com', 'zoom.us', 'feishu.cn', 'dingtalk.com'] },
  { name: '开发', patterns: ['github.com', 'gitlab.com', 'stackoverflow.com', 'npmjs.com', 'developer.mozilla.org', 'dev.to'] },
  { name: '学习', patterns: ['coursera.org', 'udemy.com', 'khanacademy.org', 'edx.org', 'wikipedia.org'] },
  { name: '金融', patterns: ['paypal.com', 'stripe.com', 'bloomberg.com'] },
  { name: '游戏', patterns: ['store.steampowered.com', 'epicgames.com', 'itch.io', 'gog.com'] },
];

function matches(domain: string, pattern: string): boolean {
  if (pattern.endsWith('.')) return domain.startsWith(pattern);
  return domain === pattern || domain.endsWith('.' + pattern);
}

/** 把域名按给定规则归入某类别，未匹配返回 '其他'。 */
export function classifyDomain(domain: string, rules: CategoryDef[]): string {
  const d = domain.toLowerCase();
  for (const cat of rules) {
    if (cat.patterns.some((p) => matches(d, p))) return cat.name;
  }
  return '其他';
}
