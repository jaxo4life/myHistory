export interface CategoryDef {
  name: string;
  icon?: string;
  color?: string; // hex，用于卡片/图表
  patterns: string[];
}

/** 自定义分类未填 icon/color 时的默认值。 */
export const DEFAULT_CATEGORY_ICON = '📌';
export const DEFAULT_CATEGORY_COLOR = '#6C5CE7';

/**
 * 内置默认分类规则（用户可在「管理」页自定义覆盖）。
 * 覆盖全球 + 中国主流站点，分类体系参考 hao123/2345/360 等导航站。
 *
 * pattern 形式：
 *  - 以 '.' 结尾：前缀匹配（'news.' 匹配 news.xxx）
 *  - 否则：精确域名或子域名后缀匹配（'qq.com' 匹配 qq.com 与 *.qq.com）
 *
 * 归类两步：① 精确 pattern 匹配，最长 pattern 优先（更具体的规则胜出，
 *   让门户子站落到精确类别：mail.qq.com→邮件、v.qq.com→视频）；
 *   ② 未命中则用 HEURISTIC_RULES 关键词兜底（覆盖长尾域名）。
 */
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  {
    name: '社交',
    icon: '💬',
    color: '#EC4899',
    patterns: [
      'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com',
      'linkedin.com', 'reddit.com', 'discord.com', 'discordapp.com', 't.me',
      'telegram.org', 'snapchat.com', 'pinterest.com', 'tumblr.com', 'threads.net',
      'whatsapp.com', 'weibo.com', 'xiaohongshu.com', 'zhihu.com', 'douban.com',
      'qzone.qq.com',
    ],
  },
  {
    name: '视频',
    icon: '🎬',
    color: '#F43F5E',
    patterns: [
      'youtube.com', 'youtu.be', 'netflix.com', 'vimeo.com', 'dailymotion.com',
      'twitch.tv', 'disneyplus.com', 'hulu.com', 'primevideo.com', 'hbomax.com',
      'bilibili.com', 'douyin.com', 'kuaishou.com', 'iqiyi.com', 'youku.com',
      'v.qq.com', 'mgtv.com',
    ],
  },
  {
    name: '音乐',
    icon: '🎵',
    color: '#84CC16',
    patterns: [
      'spotify.com', 'music.apple.com', 'soundcloud.com', 'pandora.com', 'last.fm',
      'tidal.com', 'bandcamp.com', 'deezer.com', 'music.163.com', 'kugou.com',
      'kuwo.cn', 'y.qq.com', 'migu.cn',
    ],
  },
  {
    name: '购物',
    icon: '🛒',
    color: '#F97316',
    patterns: [
      'amazon.com', 'ebay.com', 'aliexpress.com', 'temu.com', 'shein.com',
      'etsy.com', 'walmart.com', 'bestbuy.com', 'target.com', 'rakuten.com',
      'alibaba.com', 'taobao.com', 'tmall.com', 'jd.com', 'pinduoduo.com',
      'suning.com', 'vip.com', '1688.com',
    ],
  },
  {
    name: '生活',
    icon: '🏠',
    color: '#EF4444',
    patterns: [
      // 招聘
      'zhaopin.com', '51job.com', 'lagou.com', 'zhipin.com', 'liepin.com',
      'indeed.com', 'glassdoor.com',
      // 房产
      'fang.com', 'lianjia.com', 'anjuke.com', 'ke.com', 'zillow.com',
      // 汽车
      'autohome.com.cn', 'dongchedi.com', 'pcauto.com.cn', 'cars.com',
      // 健康
      'dxy.cn', 'guahao.com', 'webmd.com', 'mayoclinic.org', 'healthline.com',
      // 本地生活
      'dianping.com', 'meituan.com', 'ele.me', '58.com', 'yelp.com',
    ],
  },
  {
    name: '新闻',
    icon: '📰',
    color: '#EAB308',
    patterns: [
      'news.',
      'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com', 'reuters.com',
      'theguardian.com', 'washingtonpost.com', 'bloomberg.com', 'forbes.com',
      'wsj.com', 'techcrunch.com', 'theverge.com', 'wired.com', 'engadget.com',
      'economist.com', 'nbcnews.com', 'cbsnews.com',
      'sina.com.cn', '163.com', 'sohu.com', 'ifeng.com', 'toutiao.com',
      'qq.com', 'news.baidu.com', '36kr.com', 'cnbeta.com', 'huanqiu.com',
    ],
  },
  {
    name: '邮件',
    icon: '✉️',
    color: '#14B8A6',
    patterns: [
      'mail.google.com', 'gmail.com', 'outlook.live.com', 'outlook.office.com',
      'mail.yahoo.com', 'proton.me', 'protonmail.com', 'zoho.com',
      'mail.qq.com', 'mail.163.com', 'mail.126.com', 'mail.sina.com.cn',
    ],
  },
  {
    name: '搜索',
    icon: '🔍',
    color: '#3B82F6',
    patterns: [
      'google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'yandex.com',
      'ecosia.org', 'startpage.com', 'baidu.com', 'sogou.com', 'so.com',
    ],
  },
  {
    name: 'AI',
    icon: '🤖',
    color: '#06B6D4',
    patterns: [
      'chatgpt.com', 'chat.openai.com', 'openai.com', 'claude.ai', 'anthropic.com',
      'gemini.google.com', 'perplexity.ai', 'midjourney.com', 'huggingface.co',
      'copilot.microsoft.com', 'copilot.github.com', 'character.ai', 'mistral.ai',
      'grok.com', 'x.ai', 'suno.com', 'runwayml.com', 'replicate.com', 'cohere.com',
      'together.ai', 'stability.ai', 'deepmind.google', 'pi.ai', 'poe.com',
      'cursor.com', 'v0.dev', 'v0.app',
      'deepseek.com', 'kimi.com', 'moonshot.cn', 'yiyan.baidu.com', 'chatglm.cn',
      'zhipuai.cn', 'xinghuo.xfyun.cn', 'tongyi.aliyun.com', 'qianwen.aliyun.com',
      'hunyuan.tencent.com', 'doubao.com', 'baichuan-ai.com', 'minimax.chat',
      'tiangong.kunlun.com', 'sensechat.cn',
    ],
  },
  {
    name: '工作',
    icon: '💼',
    color: '#6366F1',
    patterns: [
      'notion.so', 'slack.com', 'trello.com', 'atlassian.net', 'office.com',
      'office365.com', 'live.com', 'zoom.us', 'teams.microsoft.com', 'figma.com',
      'miro.com', 'airtable.com', 'asana.com', 'monday.com', 'clickup.com',
      'linear.app', 'feishu.cn', 'dingtalk.com', 'work.weixin.qq.com', 'shimo.im',
      'docs.qq.com', 'wps.cn',
    ],
  },
  {
    name: '开发',
    icon: '💻',
    color: '#22C55E',
    patterns: [
      'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
      'serverfault.com', 'superuser.com', 'stackexchange.com', 'npmjs.com',
      'developer.mozilla.org', 'dev.to', 'hashnode.com', 'codepen.io', 'replit.com',
      'leetcode.com', 'hackerrank.com', 'codesignal.com', 'regex101.com', 'regexr.com',
      'caniuse.com', 'css-tricks.com', 'javascript.info', 'cloudflare.com',
      'vercel.com', 'netlify.com', 'docker.com', 'developer.chrome.com',
      'developers.google.com', 'nodejs.org', 'react.dev', 'vuejs.org', 'angular.io',
      'svelte.dev', 'news.ycombinator.com', 'supabase.com', 'firebase.google.com',
      'prisma.io', 'planetscale.com', 'neon.tech', 'railway.app', 'render.com',
      'heroku.com', 'fly.io', 'clerk.com', 'auth0.com', 'appwrite.io', 'hasura.io',
      'mongodb.com', 'postgresql.org', 'redis.io', 'postman.com',
      'gitee.com', 'juejin.cn', 'segmentfault.com', 'cnblogs.com', 'csdn.net',
      'oschina.net',
    ],
  },
  {
    name: '学习',
    icon: '📚',
    color: '#A855F7',
    patterns: [
      'coursera.org', 'udemy.com', 'khanacademy.org', 'edx.org', 'udacity.com',
      'duolingo.com', 'brilliant.org', 'skillshare.com', 'pluralsight.com',
      'codecademy.com', 'freecodecamp.org', 'ted.com', 'icourse163.org', 'study.163.com',
    ],
  },
  {
    name: '参考',
    icon: '📖',
    color: '#F59E0B',
    patterns: [
      // 百科
      'wikipedia.org', 'britannica.com', 'baike.baidu.com',
      // 词典
      'dictionary.com', 'merriam-webster.com', 'collinsdictionary.com', 'dict.cn',
      'iciba.com', 'youdao.com', 'zdic.net',
      // 翻译
      'translate.google.com', 'deepl.com', 'fanyi.baidu.com', 'fanyi.qq.com',
      'fanyi.sohu.com',
    ],
  },
  {
    name: '金融',
    icon: '💰',
    color: '#10B981',
    patterns: [
      'paypal.com', 'stripe.com', 'finance.yahoo.com', 'wise.com', 'robinhood.com',
      'tradingview.com', 'coinbase.com', 'binance.com', 'marketwatch.com',
      'investopedia.com', 'alipay.com', 'tenpay.com', 'icbc.com.cn', 'ccb.com',
      'abchina.com', 'boc.cn', 'cmbchina.com', 'bankcomm.com', 'spdb.com.cn',
      'cmbc.com.cn', 'eastmoney.com', 'xueqiu.com', '10jqka.com.cn',
    ],
  },
  {
    name: '旅行',
    icon: '✈️',
    color: '#0EA5E9',
    patterns: [
      'booking.com', 'airbnb.com', 'agoda.com', 'hotels.com', 'expedia.com',
      'kayak.com', 'tripadvisor.com', 'skyscanner.com', 'airalo.com', 'holafly.com',
      'trip.com', 'ctrip.com', 'qunar.com', 'tongcheng.com', '12306.cn',
      'mafengwo.cn', 'qyer.com', 'fliggy.com',
    ],
  },
  {
    name: '游戏',
    icon: '🎮',
    color: '#8B5CF6',
    patterns: [
      'store.steampowered.com', 'steamcommunity.com', 'epicgames.com', 'itch.io',
      'gog.com', 'roblox.com', 'playstation.com', 'xbox.com', 'nintendo.com',
      'battle.net', 'riotgames.com', 'ea.com', 'ubisoft.com', 'blizzard.com',
      'mojang.com', 'nexusmods.com', 'igdb.com', 'mihoyo.com', 'netease.com',
      'game.qq.com', '4399.com', '17173.com',
    ],
  },
  {
    name: '工具',
    icon: '🔧',
    color: '#64748B',
    patterns: [
      // 网络 / IP / DNS / 测速
      'browserleaks.com', 'browserling.com', 'whatismyipaddress.com', 'ipinfo.io',
      'ip.sb', 'speedtest.net', 'fast.com', 'dns.google', 'dnschecker.org',
      'mxtoolbox.com', 'whois.com', 'who.is',
      // 站长 / SEO
      'chinaz.com', 'aizhan.com', 'semrush.com', 'ahrefs.com', 'similarweb.com',
      '17ce.com',
      // 文件 / 转换
      'smallpdf.com', 'ilovepdf.com', 'convertio.co', 'removebg.com', 'tinypng.com',
      // 其他实用
      'timeanddate.com', 'validator.w3.org', 'tool.lu', 'bejson.com',
    ],
  },
];

/**
 * 分类规则版本号。DEFAULT_CATEGORIES 变更时 bump，触发已安装用户迁移。
 */
export const CATEGORY_RULES_VERSION = 5;

/**
 * 兜底启发式：精确 pattern 未命中时，按域名包含的关键词归类。
 * 只放高置信度关键词，避免大面积误判；命中后仍可被用户手动覆盖。
 */
const HEURISTIC_RULES: { kw: string; cat: string }[] = [
  { kw: 'shop', cat: '购物' }, { kw: 'store', cat: '购物' }, { kw: 'buy', cat: '购物' },
  { kw: 'mall', cat: '购物' }, { kw: 'cart', cat: '购物' },
  { kw: 'bank', cat: '金融' }, { kw: 'pay', cat: '金融' }, { kw: 'invest', cat: '金融' },
  { kw: 'stock', cat: '金融' }, { kw: 'loan', cat: '金融' }, { kw: 'fund', cat: '金融' },
  { kw: 'news', cat: '新闻' },
  { kw: 'game', cat: '游戏' },
  { kw: 'tool', cat: '工具' }, { kw: 'dns', cat: '工具' }, { kw: 'speedtest', cat: '工具' },
  { kw: 'convert', cat: '工具' }, { kw: 'calc', cat: '工具' },
  { kw: 'wiki', cat: '参考' }, { kw: 'dict', cat: '参考' }, { kw: 'translate', cat: '参考' },
  { kw: 'fanyi', cat: '参考' },
  { kw: 'learn', cat: '学习' }, { kw: 'course', cat: '学习' },
  { kw: 'mail', cat: '邮件' },
  { kw: 'video', cat: '视频' }, { kw: 'tube', cat: '视频' },
  { kw: 'music', cat: '音乐' },
  { kw: 'forum', cat: '社交' }, { kw: 'community', cat: '社交' },
  { kw: 'search', cat: '搜索' },
];

/** 预设图标库（自定义分类选择用）。 */
export const ICON_LIBRARY = [
  '💬', '🎬', '🛒', '📰', '✉️', '🔍', '💼', '💻', '📚', '💰', '🎮',
  '🎵', '🖼️', '📷', '✈️', '🏠', '🍔', '⚽', '🧪', '📊', '🔧', '🎯',
  '💡', '📺', '💊', '🚗', '📱', '🌐', '🗓️', '📎', '⭐', '❤️', '🔥', '📌',
];

/** 预设颜色库（自定义分类选择用）。 */
export const COLOR_LIBRARY = [
  '#6C5CE7', '#3B82F6', '#14B8A6', '#22C55E', '#F97316', '#EC4899',
  '#F43F5E', '#EAB308', '#6366F1', '#A855F7', '#10B981', '#8B5CF6',
  '#0EA5E9', '#F59E0B', '#EF4444', '#84CC16',
];

function matches(domain: string, pattern: string): boolean {
  if (pattern.endsWith('.')) return domain.startsWith(pattern);
  return domain === pattern || domain.endsWith('.' + pattern);
}

/**
 * 把域名归类：① 精确 pattern（最长优先）② 关键词兜底 ③ 其他。
 */
export function classifyDomain(domain: string, rules: CategoryDef[]): string {
  const d = domain.toLowerCase();
  // ① 精确匹配，最长 pattern 胜出
  let best = '其他';
  let bestLen = 0;
  for (const cat of rules) {
    for (const p of cat.patterns) {
      if (matches(d, p) && p.length > bestLen) {
        bestLen = p.length;
        best = cat.name;
      }
    }
  }
  if (bestLen > 0) return best;
  // ② 关键词兜底
  const known = new Set(rules.map((r) => r.name));
  for (const { kw, cat } of HEURISTIC_RULES) {
    if (d.includes(kw) && known.has(cat)) return cat;
  }
  return '其他';
}
