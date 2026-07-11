export interface CategoryDef {
  name: string;
  icon?: string;
  color?: string;
  patterns: string[];
}

export const DEFAULT_CATEGORY_ICON = '📌';
export const DEFAULT_CATEGORY_COLOR = '#6C5CE7';

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
      'qzone.qq.com', 'v2ex.com', 'smzdm.com', 'linktr.ee',
      'mastodon.social', 'bsky.app', 'blueskyweb.xyz', 'lemmy.world', 'matrix.org', 'element.io', 'signal.org', 'line.me',
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
      'v.qq.com', 'mgtv.com', 'huya.com', 'douyu.com',
      'kick.com', 'rumble.com', 'veoh.com', 'bitchute.com',
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
      'youtube-music.com', 'beatport.com', 'mixcloud.com',
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
      'suning.com', 'vip.com', '1688.com', 'goofish.com', 'jd.hk', 'dji.com',
      'apple.com', 'samsung.cn', 'dell.com', 'hp.com', 'lenovo.com',
      'shopify.com', 'alibaba-inc.com', 'costco.com', 'ikea.com', 'nike.com', 'adidas.com',
    ],
  },
  {
    name: '生活',
    icon: '🏠',
    color: '#EF4444',
    patterns: [
      'zhaopin.com', '51job.com', 'lagou.com', 'zhipin.com', 'liepin.com',
      'indeed.com', 'glassdoor.com',
      'fang.com', 'lianjia.com', 'anjuke.com', 'ke.com', 'zillow.com',
      'autohome.com.cn', 'dongchedi.com', 'pcauto.com.cn', 'cars.com',
      'dxy.cn', 'guahao.com', 'webmd.com', 'mayoclinic.org', 'healthline.com',
      'dianping.com', 'meituan.com', 'ele.me', '58.com', 'yelp.com',
    ],
  },
  {
    name: '新闻',
    icon: '📰',
    color: '#EAB308',
    patterns: [
      'news.', 'gov.cn', 'gov.', 'gov.uk', 'whitehouse.gov',
      'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com', 'reuters.com',
      'theguardian.com', 'washingtonpost.com', 'bloomberg.com', 'forbes.com',
      'wsj.com', 'techcrunch.com', 'theverge.com', 'wired.com', 'engadget.com',
      'economist.com', 'nbcnews.com', 'cbsnews.com',
      'sina.com.cn', '163.com', 'sohu.com', 'ifeng.com', 'toutiao.com',
      'qq.com', 'news.baidu.com', '36kr.com', 'cnbeta.com', 'huanqiu.com',
      'apnews.com', 'aljazeera.com', 'politico.com', 'axios.com', 'hackernews.com',
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
      'google.', 'google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'yandex.com',
      'ecosia.org', 'startpage.com', 'baidu.com', 'sogou.com', 'so.com',
    ],
  },
  {
    name: 'AI',
    icon: '🤖',
    color: '#06B6D4',
    patterns: [
      'chatgpt.com', 'chat.openai.com', 'openai.com', 'claude.ai', 'claude.com', 'anthropic.com',
      'gemini.google.com', 'perplexity.ai', 'midjourney.com', 'huggingface.co',
      'copilot.microsoft.com', 'copilot.github.com', 'character.ai', 'mistral.ai',
      'grok.com', 'x.ai', 'suno.com', 'runwayml.com', 'replicate.com', 'cohere.com',
      'together.ai', 'stability.ai', 'deepmind.google', 'pi.ai', 'poe.com',
      'cursor.com', 'v0.dev', 'v0.app',
      'deepseek.com', 'kimi.com', 'moonshot.cn', 'yiyan.baidu.com', 'chatglm.cn',
      'zhipuai.cn', 'bigmodel.cn', 'xinghuo.xfyun.cn', 'tongyi.aliyun.com',
      'qianwen.aliyun.com', 'hunyuan.tencent.com', 'doubao.com', 'baichuan-ai.com',
      'minimax.chat', 'tiangong.kunlun.com', 'sensechat.cn',
      'openrouter.ai', 'ollama.com', 'ollama.ai', 'groq.com', 'leonardo.ai', 'ideogram.ai', 'krea.ai',
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
      'linear.app', 'feishu.cn', 'dingtalk.com', 'work.weixin.qq.com', 'shimo.im', 'tencent.com',
      'docs.qq.com', 'wps.cn',
    ],
  },
  {
    name: '开发',
    icon: '💻',
    color: '#22C55E',
    patterns: [
      'github.com', 'github.io', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
      'serverfault.com', 'superuser.com', 'stackexchange.com', 'npmjs.com',
      'developer.mozilla.org', 'dev.to', 'hashnode.com', 'codepen.io', 'replit.com',
      'leetcode.com', 'hackerrank.com', 'codesignal.com', 'regex101.com', 'regexr.com',
      'caniuse.com', 'css-tricks.com', 'javascript.info', 'cloudflare.com',
      'vercel.com', 'vercel.app', 'netlify.com', 'netlify.app', 'pages.dev',
      'heroku.com', 'herokuapp.com', 'onrender.com', 'render.com', 'fly.io',
      'docker.com', 'developer.chrome.com', 'developers.google.com', 'nodejs.org',
      'react.dev', 'vuejs.org', 'angular.io', 'svelte.dev', 'news.ycombinator.com',
      'supabase.com', 'supabase.co', 'firebase.google.com', 'prisma.io', 'planetscale.com', 'neon.tech',
      'railway.app', 'clerk.com', 'auth0.com', 'appwrite.io', 'hasura.io',
      'mongodb.com', 'postgresql.org', 'redis.io', 'postman.com', 'gitbook.io',
      'aliyun.com', 'aws.amazon.com', 'tencentcloud.com', 'huaweicloud.com', 'ubuntu.com', 'debian.org', 'lineageos.org',
      'gitee.com', 'juejin.cn', 'segmentfault.com', 'cnblogs.com', 'csdn.net', 'oschina.net',
      'pypi.org', 'crates.io', 'go.dev', 'golang.org', 'rust-lang.org', 'kotlinlang.org', 'python.org', 'stackoverflow.blog', 'huggingface.co',
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
      'mit.edu', 'stanford.edu', 'harvard.edu', 'ocw.mit.edu', 'arxiv.org', 'researchgate.net',
    ],
  },
  {
    name: '参考',
    icon: '📖',
    color: '#F59E0B',
    patterns: [
      'wikipedia.org', 'britannica.com', 'baike.baidu.com',
      'dictionary.com', 'merriam-webster.com', 'collinsdictionary.com', 'dict.cn',
      'iciba.com', 'youdao.com', 'zdic.net',
      'translate.google.com', 'deepl.com', 'fanyi.baidu.com', 'fanyi.qq.com',
      'fanyi.sohu.com',
      'imdb.com', 'themoviedb.org', 'rottentomatoes.com', 'metacritic.com',
      'zol.com.cn', 'pconline.com.cn',
      'archive.org', 'w3schools.com', 'geeksforgeeks.org', 'wolframalpha.com',
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
      'revolut.com', 'schwab.com', 'fidelity.com', 'vanguard.com', 'interactivebrokers.com',
    ],
  },
  {
    name: '加密',
    icon: '🪙',
    color: '#F7931A',
    patterns: [
      // Exchanges
      'binance.com', 'binance.us', 'coinbase.com', 'kraken.com', 'okx.com',
      'bybit.com', 'kucoin.com', 'crypto.com', 'gate.io', 'bitget.com',
      'mexc.com', 'htx.com', 'bitfinex.com', 'gemini.com', 'bitstamp.net',

      // DEX / DeFi
      'uniswap.org', 'pancakeswap.finance', 'curve.fi', 'balancer.fi',
      '1inch.io', 'matcha.xyz', 'dydx.exchange', 'hyperliquid.xyz',
      'jupiter.ag', 'raydium.io', 'orca.so', 'traderjoe.xyz',
      'aerodrome.finance', 'velodrome.finance', 'aave.com',
      'compound.finance', 'makerdao.com', 'lido.fi', 'rocketpool.net',
      'frax.finance', 'convexfinance.com', 'yearn.fi', 'morpho.org',
      'pendle.finance', 'ether.fi',

      // Wallets
      'metamask.io', 'phantom.app', 'rabby.io', 'rainbow.me',
      'zerion.io', 'zapper.xyz', 'trustwallet.com', 'imtoken.com',
      'tokenpocket.pro', 'ledger.com', 'trezor.io', 'safe.global',
      'keplr.app', 'backpack.app',

      // Explorers
      'etherscan.io', 'bscscan.com', 'basescan.org', 'polygonscan.com',
      'arbiscan.io', 'optimistic.etherscan.io', 'snowtrace.io',
      'ftmscan.com', 'gnosisscan.io', 'solscan.io', 'solana.fm',
      'blockchair.com', 'mempool.space', 'blockstream.info',

      // Market Data
      'coinmarketcap.com', 'coingecko.com', 'messari.io',
      'glassnode.com', 'nansen.ai', 'dune.com', 'debank.com',
      'defillama.com', 'tokenterminal.com', 'cryptorank.io',
      'oklink.com',

      // NFT / Social / Identity
      'opensea.io', 'blur.io', 'magiceden.io', 'rarible.com',
      'looksrare.org', 'foundation.app', 'superrare.com',
      'zora.co', 'manifold.xyz', 'tensor.trade',
      'ens.domains', 'unstoppabledomains.com', 'space.id',
      'lens.xyz', 'farcaster.xyz', 'warpcast.com',
      'mirror.xyz', 'snapshot.org', 'paragraph.xyz',

      // Blockchain Ecosystem
      'ethereum.org', 'eth.org', 'bitcoin.org',
      'solana.com', 'cosmos.network', 'arbitrum.io',
      'optimism.io', 'base.org', 'zksync.io',
      'starknet.io', 'polygon.technology', 'scroll.io',
      'linea.build',

      // Developer / Infrastructure
      'alchemy.com', 'infura.io', 'quicknode.com',
      'moralis.io', 'ankr.com', 'chainstack.com',
      'thirdweb.com', 'openzeppelin.com', 'hardhat.org',

      // Security
      'revoke.cash', 'scamsniffer.io', 'honeypot.is',
      'tokensniffer.com', 'certik.com', 'peckshield.com',
    ]
  },
  {
    name: '旅行',
    icon: '✈️',
    color: '#0EA5E9',
    patterns: [
      'booking.com', 'airbnb.com', 'agoda.com', 'hotels.com', 'expedia.com',
      'kayak.com', 'tripadvisor.com', 'skyscanner.com', 'airalo.com', 'holafly.com',
      'trip.com', 'ctrip.com', 'qunar.com', 'tongcheng.com', '12306.cn',
      'mafengwo.cn', 'qyer.com', 'fliggy.com', 'hworld.com',
      'cathaypacific.com', 'singaporeair.com', 'lufthansa.com', 'emirates.com',
      'qantas.com', 'united.com', 'delta.com', 'aa.com',
      'marriott.com', 'hilton.com', 'hyatt.com', 'ihg.com', 'accor.com',
      'yaduo.com', 'jinjiang.com',
      'pump.fun', 'jito.network', 'walletconnect.com', 'coinbasewallet.com', 'tronscan.org', 'tonscan.org', 'tonviewer.com', 'lineascan.build', 'era.zksync.network', 'blastscan.io', 'avascan.info', 'avax.network', 'layerzero.network', 'wormhole.com', 'chain.link', 'thegraph.com', 'graphprotocol.io', 'walletconnect.org', 'opensea.pro',
      'google.com/travel', 'rome2rio.com', 'viator.com', 'hostelworld.com', 'bookingbuddy.com',
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
      'playtika.com', 'steam.com', 'humblebundle.com', 'gamejolt.com', 'kongregate.com',
    ],
  },
  {
    name: '工具',
    icon: '🔧',
    color: '#64748B',
    patterns: [
      'browserleaks.com', 'browserling.com', 'whatismyipaddress.com', 'ipinfo.io',
      'ip.sb', 'speedtest.net', 'fast.com', 'dns.google', 'dnschecker.org',
      'mxtoolbox.com', 'whois.com', 'who.is', 'tailscale.com',
      'chinaz.com', 'aizhan.com', 'semrush.com', 'ahrefs.com', 'similarweb.com',
      '17ce.com', '1password.com', 'lastpass.com', 'bitwarden.com',
      'smallpdf.com', 'ilovepdf.com', 'convertio.co', 'removebg.com', 'tinypng.com',
      'timeanddate.com', 'weather.com.cn', 'validator.w3.org', 'tool.lu', 'bejson.com',
      'amap.com', 'map.baidu.com', 'ifixit.com',
      'adblockplus.org', 'easylist.to', 'ghostery.com', 'privacybadger.org',
      'ublock.org', 'ublockorigin.net', 'noscript.net', 'adguard.com',
      'protonvpn.com', 'expressvpn.com', 'nordvpn.com', 'virustotal.com', 'archive.today', 'webcache.googleusercontent.com',
    ],
  },
  {
    name: '本地',
    icon: '📡',
    color: '#71717A',
    patterns: ['localhost', 'local', 'internal', 'lan', 'home', 'arpa'],
  },
];

export const CATEGORY_RULES_VERSION = 8;

const HEURISTIC_RULES: { kw: string; cat: string }[] = [
  { kw: 'shop', cat: '购物' }, { kw: 'store', cat: '购物' }, { kw: 'buy', cat: '购物' },
  { kw: 'mall', cat: '购物' }, { kw: 'cart', cat: '购物' },
  { kw: 'bank', cat: '金融' }, { kw: 'pay', cat: '金融' }, { kw: 'invest', cat: '金融' },
  { kw: 'stock', cat: '金融' }, { kw: 'loan', cat: '金融' }, { kw: 'fund', cat: '金融' },
  { kw: 'crypto', cat: '加密' }, { kw: 'nft', cat: '加密' }, { kw: 'web3', cat: '加密' },
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
  { kw: 'search', cat: '搜索' }, { kw: 'google.', cat: '搜索' },
];

export const ICON_LIBRARY = [
  '💬', '🎬', '🛒', '📰', '✉️', '🔍', '💼', '💻', '📚', '💰', '🎮',
  '🎵', '🖼️', '📷', '✈️', '🏠', '🍔', '⚽', '🧪', '📊', '🔧', '🎯',
  '💡', '📺', '💊', '🚗', '📱', '🌐', '🗓️', '📎', '⭐', '❤️', '🔥', '📌',
  '🪙', '📡',
  '🗣️', '👥', '💭', '👾', '✍️', '📝', '✒️',
  '🎙️', '🎧', '📻', '🎨', '🖌️', '📐', '✏️', '🎥', '🎞️',
  '⚙️', '🛠️', '🔌', '⚡', '🔩', '🔬', '🔭', '🧮',
  '⚖️', '📜', '🔒', '🔑', '🛡️',
  '☀️', '⛅', '🌈', '⛈️', '🌱', '🐾', '🐶', '🌳', '🐈',
  '🏀', '🚴', '🏊', '🎾', '🏋️', '🏒',
  '🚕', '🚌', '🚲', '🚆', '🛳️', '🧳', '🗺️', '📍', '🏝️', '🏔️',
  '💳', '💹', '🏦', '💎', '🧾',
  '📄', '📁', '🗂️', '📋', '🗞️',
  '✨', '💫', '🎲', '🧩', '♟️', '🎪', '🎭',
];

export const COLOR_LIBRARY = [
  '#6C5CE7', '#3B82F6', '#14B8A6', '#22C55E', '#F97316', '#EC4899',
  '#F43F5E', '#EAB308', '#6366F1', '#A855F7', '#10B981', '#8B5CF6',
  '#0EA5E9', '#F59E0B', '#EF4444', '#84CC16', '#F7931A', '#71717A',
];

function matches(domain: string, pattern: string): boolean {
  if (pattern.endsWith('.')) return domain.startsWith(pattern);
  return domain === pattern || domain.endsWith('.' + pattern);
}

function isLocalAddress(domain: string): boolean {
  return (
    domain === 'localhost' ||
    /\.(local|internal|lan|home|localhost|arpa)$/.test(domain) ||
    /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(domain)
  );
}

export function classifyDomain(domain: string, rules: CategoryDef[]): string {
  const d = domain.toLowerCase();
  if (isLocalAddress(d)) return '本地';
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
  if (d.endsWith('.ai')) return 'AI';
  const known = new Set(rules.map((r) => r.name));
  for (const { kw, cat } of HEURISTIC_RULES) {
    if (d.includes(kw) && known.has(cat)) return cat;
  }
  return '其他';
}
