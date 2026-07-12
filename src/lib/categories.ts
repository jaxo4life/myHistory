export interface CategoryDef {
  name: string;
  icon?: string;
  color?: string;
  patterns: string[];
}

export const DEFAULT_CATEGORY_ICON = '📌';
export const DEFAULT_CATEGORY_COLOR = '#6C5CE7';

/**
 * 版本号：每次修改 patterns / 类别时递增，用于触发客户端缓存刷新
 */
export const CATEGORY_RULES_VERSION = 10;

// ---------------------------------------------------------------------------
// 分类规则
//
// 匹配优先级规则（在 classifyDomain 中实现）：
//   1. 本地地址优先（localhost / 私有 IP / .local 等）
//   2. 精确域名匹配，越长越优先（"mail.google.com" > "google.com"）
//   3. 后缀兜底（.ai → AI）
//   4. 启发式关键词匹配
//   5. 兜底为"其他"
//
// 设计原则：
//   - 每个域名只归属一个分类，不允许跨分类重复
//   - vercel.com / netlify.com / cloudflare.com 只在"开发"（开发者日常访问更多）
//   - binance.com / coinbase.com 只在"加密"（更精准）
//   - huggingface.co 只在"AI"
//   - you.com / phind.com 只在"AI"（AI 搜索属性更强）
//   - twitch.tv / kick.com 只在"视频"（非游戏专属）
//   - excalidraw.com 只在"工作"（协作白板）
//   - webflow.com 只在"开发"（建站平台）
//   - confluence.atlassian.com 在"工作"（文档协作）
//   - shopify.com 在"开发"（建站平台）
//   - wolframalpha.com / archive.today / amap.com / map.baidu.com 只在"参考"
// ---------------------------------------------------------------------------

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  // ── 社交 ──────────────────────────────────────────────────────────────────
  {
    name: '社交',
    icon: '💬',
    color: '#EC4899',
    patterns: [
      // 全球主流
      'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com',
      'linkedin.com', 'reddit.com', 'pinterest.com', 'tumblr.com', 'threads.net',
      'snapchat.com', 'linktr.ee',
      // 即时通讯
      'discord.com', 'discordapp.com',
      't.me', 'telegram.org', 'web.telegram.org',
      'whatsapp.com', 'web.whatsapp.com',
      'signal.org', 'line.me',
      // 去中心化 / 新兴
      'mastodon.social', 'mastodon.online', 'fosstodon.org',
      'bsky.app', 'blueskyweb.xyz',
      'farcaster.xyz', 'warpcast.com',
      'lens.xyz', 'mirror.xyz', 'paragraph.xyz',
      'lemmy.world', 'beehaw.org',
      'matrix.org', 'element.io',
      // 国内
      'weibo.com', 'xiaohongshu.com', 'zhihu.com', 'douban.com',
      'qzone.qq.com', 'v2ex.com',
      // 论坛 / 社区
      'producthunt.com', 'hacker.news',
    ],
  },

  // ── 视频 ──────────────────────────────────────────────────────────────────
  {
    name: '视频',
    icon: '🎬',
    color: '#F43F5E',
    patterns: [
      // 全球
      'youtube.com', 'youtu.be',
      'netflix.com', 'hulu.com', 'disneyplus.com', 'hbomax.com', 'max.com',
      'primevideo.com', 'appletv.apple.com',
      'vimeo.com', 'dailymotion.com',
      // 直播（twitch / kick 归视频，非游戏独占）
      'twitch.tv', 'kick.com', 'rumble.com',
      'veoh.com', 'bitchute.com', 'odysee.com',
      'peacocktv.com', 'paramountplus.com', 'crunchyroll.com', 'funimation.com',
      // 国内
      'bilibili.com', 'b23.tv',
      'douyin.com', 'kuaishou.com',
      'iqiyi.com', 'youku.com', 'v.qq.com', 'mgtv.com',
      'huya.com', 'douyu.com', 'cc.163.com',
      'le.com', 'sohu.com/tv', 'pptv.com',
    ],
  },

  // ── 音乐 ──────────────────────────────────────────────────────────────────
  {
    name: '音乐',
    icon: '🎵',
    color: '#84CC16',
    patterns: [
      'spotify.com', 'open.spotify.com',
      'music.apple.com', 'music.amazon.com',
      'soundcloud.com', 'bandcamp.com',
      'tidal.com', 'deezer.com', 'pandora.com', 'last.fm',
      'beatport.com', 'mixcloud.com', 'audiomack.com',
      // 国内
      'music.163.com', 'kugou.com', 'kuwo.cn', 'y.qq.com',
      'migu.cn', 'qishui.douyin.com',
    ],
  },

  // ── 购物 ──────────────────────────────────────────────────────────────────
  {
    name: '购物',
    icon: '🛒',
    color: '#F97316',
    patterns: [
      // 全球平台
      'amazon.com', 'amazon.co.uk', 'amazon.co.jp', 'amazon.de', 'amazon.fr',
      'ebay.com', 'aliexpress.com', 'aliexpress.ru',
      'temu.com', 'shein.com', 'wish.com',
      'etsy.com', 'walmart.com', 'costco.com', 'target.com',
      'bestbuy.com', 'rakuten.com', 'groupon.com',
      'ikea.com', 'wayfair.com', 'homedepot.com',
      // 品牌直营（消费者购买场景）
      'apple.com', 'samsung.com', 'samsung.cn',
      'dell.com', 'hp.com', 'lenovo.com',
      'nike.com', 'adidas.com', 'uniqlo.com', 'zara.com', 'hm.com',
      'dji.com', 'dyson.com', 'sonos.com',
      // 国内平台
      'taobao.com', 'tmall.com', 'jd.com', 'jd.hk',
      'pinduoduo.com', 'suning.com', 'vip.com',
      '1688.com', 'goofish.com', 'xianyu.taobao.com',
      'smzdm.com', 'dianping.com/shop',
      // 跨境 / 其他
      'shopee.com', 'lazada.com', 'flipkart.com',
    ],
  },

  // ── 生活 ──────────────────────────────────────────────────────────────────
  {
    name: '生活',
    icon: '🏠',
    color: '#EF4444',
    patterns: [
      // 招聘
      'zhaopin.com', '51job.com', 'lagou.com', 'zhipin.com', 'liepin.com',
      'maimai.cn', 'boss.zhipin.com',
      'indeed.com', 'glassdoor.com', 'linkedin.com/jobs', 'monster.com',
      'seek.com.au', 'stepstone.de',
      // 房产
      'fang.com', 'lianjia.com', 'anjuke.com', 'ke.com', 'beike.com',
      'zillow.com', 'trulia.com', 'rightmove.co.uk', 'realtor.com',
      // 汽车
      'autohome.com.cn', 'dongchedi.com', 'pcauto.com.cn',
      'cars.com', 'autotrader.com', 'carmax.com',
      // 医疗健康
      'dxy.cn', 'guahao.com', 'chunyuyisheng.com',
      'webmd.com', 'mayoclinic.org', 'healthline.com', 'medscape.com',
      'drugs.com', 'nih.gov',
      // 外卖 / 本地生活
      'meituan.com', 'ele.me', '58.com', 'ganji.com',
      'yelp.com', 'doordash.com', 'ubereats.com', 'grubhub.com',
      // 天气
      'weather.com', 'weather.com.cn', 'weatherunderground.com',
      'windy.com', 'accuweather.com',
    ],
  },

  // ── 新闻 ──────────────────────────────────────────────────────────────────
  {
    name: '新闻',
    icon: '📰',
    color: '#EAB308',
    patterns: [
      // 前缀匹配（需以 "news." 开头）
      'news.',
      // 政府 / 官方
      'gov.cn', 'xinhuanet.com', 'people.com.cn', 'chinadaily.com.cn',
      'whitehouse.gov', 'gov.uk',
      // 英文媒体
      'bbc.com', 'bbc.co.uk', 'bbc.in',
      'cnn.com', 'nytimes.com', 'reuters.com', 'apnews.com',
      'theguardian.com', 'washingtonpost.com',
      'bloomberg.com', 'forbes.com', 'fortune.com',
      'wsj.com', 'economist.com', 'ft.com',
      'nbcnews.com', 'cbsnews.com', 'abcnews.go.com', 'foxnews.com',
      'aljazeera.com', 'dw.com', 'france24.com', 'rfi.fr',
      'politico.com', 'axios.com', 'theatlantic.com', 'vox.com',
      'slate.com', 'salon.com', 'huffpost.com',
      'techcrunch.com', 'theverge.com', 'wired.com', 'engadget.com', 'arstechnica.com',
      'gizmodo.com', 'mashable.com', 'cnet.com', 'zdnet.com',
      // 中文媒体
      'sina.com.cn', '163.com', 'sohu.com', 'ifeng.com', 'toutiao.com',
      'qq.com', 'news.baidu.com', '36kr.com', 'cnbeta.com', 'huanqiu.com',
      'caixin.com', 'yicai.com', 'jiemian.com', 'thepaper.cn',
      // 聚合 / 阅读
      'news.ycombinator.com', 'hackernews.com',
      'feedly.com', 'inoreader.com', 'pocket.com', 'instapaper.com',
      'flipboard.com', 'ground.news',
    ],
  },

  // ── 邮件 ──────────────────────────────────────────────────────────────────
  {
    name: '邮件',
    icon: '✉️',
    color: '#14B8A6',
    patterns: [
      'mail.google.com', 'gmail.com',
      'outlook.live.com', 'outlook.office.com', 'outlook.office365.com',
      'mail.yahoo.com',
      'proton.me', 'protonmail.com',
      'zoho.com', 'zohomail.com',
      'fastmail.com', 'tutanota.com', 'hey.com',
      'mail.qq.com', 'mail.163.com', 'mail.126.com', 'mail.sina.com.cn',
      'exmail.qq.com',
      // 临时邮件
      'guerrillamail.com', 'temp-mail.org', 'mailinator.com',
    ],
  },

  // ── 搜索 ──────────────────────────────────────────────────────────────────
  {
    name: '搜索',
    icon: '🔍',
    color: '#3B82F6',
    patterns: [
      // 前缀匹配
      'google.',
      // 精确匹配
      'google.com', 'google.co.uk', 'google.co.jp', 'google.com.hk',
      'bing.com', 'msn.com',
      'duckduckgo.com', 'yahoo.com',
      'yandex.com', 'yandex.ru',
      'ecosia.org', 'startpage.com', 'searx.me', 'brave.com/search',
      'kagi.com',
      // you.com / phind.com 归 AI（AI 搜索属性更强）
      'baidu.com', 'sogou.com', 'so.com', 'sm.cn',
    ],
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    name: 'AI',
    icon: '🤖',
    color: '#06B6D4',
    patterns: [
      // OpenAI / Anthropic / Google
      'chatgpt.com', 'chat.openai.com', 'openai.com', 'labs.openai.com',
      'claude.ai', 'anthropic.com',
      'gemini.google.com', 'aistudio.google.com', 'makersuite.google.com',
      // Microsoft AI
      'copilot.microsoft.com', 'copilot.github.com', 'bing.com/chat',
      // AI 搜索（归 AI 而非搜索）
      'perplexity.ai', 'you.com', 'phind.com',
      // 对话产品
      'poe.com', 'character.ai', 'pi.ai',
      'grok.com', 'x.ai',
      // 代码 AI
      'cursor.com', 'v0.dev', 'v0.app',
      'github.com/features/copilot', 'codeium.com', 'tabnine.com',
      'replit.com/ai', 'lovable.dev', 'bolt.new', 'windsurf.com',
      // 图像 / 视频生成
      'midjourney.com', 'stability.ai', 'dreamstudio.ai',
      'leonardo.ai', 'ideogram.ai', 'krea.ai', 'freepik.com/ai',
      'adobe.com/firefly', 'canva.com/ai',
      'runway.com', 'runwayml.com', 'pika.art', 'luma.ai', 'kling.kuaishou.com',
      'hailuoai.com', 'vidu.com',
      // 音频生成
      'suno.com', 'udio.com', 'elevenlabs.io',
      // 推理 / 平台
      'mistral.ai', 'cohere.com', 'together.ai', 'groq.com',
      'replicate.com', 'openrouter.ai',
      'huggingface.co', 'ollama.com', 'ollama.ai', 'lmstudio.ai',
      'deepmind.google', 'deepmind.com',
      // 国内
      'deepseek.com', 'chat.deepseek.com',
      'kimi.com', 'kimi.moonshot.cn', 'moonshot.cn',
      'yiyan.baidu.com', 'ernie.baidu.com',
      'chatglm.cn', 'zhipuai.cn', 'bigmodel.cn',
      'xinghuo.xfyun.cn', 'spark.xfyun.cn',
      'tongyi.aliyun.com', 'qianwen.aliyun.com',
      'hunyuan.tencent.com', 'yuanbao.tencent.com',
      'doubao.com', 'volcengine.com/product/doubao',
      'baichuan-ai.com', 'minimax.chat',
      'tiangong.kunlun.com', 'sensechat.cn',
      'wanzhi.com', 'hailuo.ai',
      // 知识检索
      'consensus.app', 'elicit.com',
      // 工作流 / Agent
      'langchain.com', 'flowise.ai', 'dify.ai', 'coze.com', 'coze.cn',
      'n8n.io', 'make.com', 'zapier.com/ai',
    ],
  },

  // ── 工作 ──────────────────────────────────────────────────────────────────
  {
    name: '工作',
    icon: '💼',
    color: '#6366F1',
    patterns: [
      // 协作 / 文档
      'notion.so', 'www.notion.so',
      'docs.google.com', 'drive.google.com', 'sheets.google.com', 'slides.google.com',
      'office.com', 'office365.com',
      'docs.microsoft.com',
      'dropbox.com', 'box.com', 'onedrive.live.com',
      // confluence 归工作（文档协作，非开发工具）
      'confluence.atlassian.com',
      // 即时通讯（工作场景）
      'slack.com', 'app.slack.com',
      'teams.microsoft.com', 'meet.google.com',
      'zoom.us', 'webex.com', 'whereby.com', 'around.co',
      'lark.com', 'feishu.cn', 'dingtalk.com', 'work.weixin.qq.com',
      // 项目管理
      'trello.com', 'atlassian.net', 'jira.atlassian.com',
      'asana.com', 'monday.com', 'clickup.com', 'linear.app',
      'basecamp.com', 'todoist.com', 'wrike.com',
      // 设计 / 原型（工作输出场景）
      'figma.com', 'sketch.com', 'invisionapp.com', 'zeplin.io',
      'framer.com', 'canva.com',
      // 白板 / 协作（excalidraw 归工作，非开发）
      'miro.com', 'mural.co', 'figjam.com', 'excalidraw.com',
      'whimsical.com', 'lucidchart.com', 'diagrams.net', 'draw.io',
      // 数据 / BI
      'airtable.com', 'coda.io', 'retool.com',
      'tableau.com', 'looker.com', 'metabase.com', 'grafana.com',
      // 国内
      'shimo.im', 'docs.qq.com', 'wps.cn', 'wps.com', 'kdocs.cn',
      'tower.im', 'teambition.com', 'worktile.com',
      // 日程
      'calendar.google.com', 'outlook.com/calendar',
      'calendly.com', 'cal.com',
    ],
  },

  // ── 云服务 ────────────────────────────────────────────────────────────────
  {
    name: '云服务',
    icon: '☁️',
    color: '#0EA5E9',
    patterns: [
      // 三大云
      'aws.amazon.com', 'console.aws.amazon.com', 'us-east-1.console.aws.amazon.com',
      'cloud.google.com', 'console.cloud.google.com',
      'portal.azure.com', 'azure.com', 'azure.microsoft.com',
      // 微软账号体系（登录态常见）
      'account.microsoft.com', 'login.microsoft.com', 'login.live.com',
      'account.live.com', 'myaccount.microsoft.com', 'profile.microsoft.com',
      'security.microsoft.com', 'entra.microsoft.com', 'admin.microsoft.com',
      // 独立云服务商
      'digitalocean.com', 'linode.com', 'vultr.com',
      'hetzner.com', 'ovhcloud.com', 'scaleway.com',
      // PaaS / Serverless（与"开发"区分：此处为基础设施控制台）
      'heroku.com', 'render.com', 'railway.app', 'fly.io',
      'deno.com', 'workers.cloudflare.com',
      // CDN / 网络
      'fastly.com', 'akamai.com',
      // 国内云
      'aliyun.com', 'console.aliyun.com',
      'tencentcloud.com', 'cloud.tencent.com',
      'huaweicloud.com', 'console.huaweicloud.com',
      'bce.baidu.com', 'cloud.baidu.com',
      'ucloud.cn', 'qingyun.com', 'ksyun.com', 'kingsoft.com/cloud',
      // 对象存储
      's3.amazonaws.com', 'storage.googleapis.com',
      'oss.aliyuncs.com', 'cos.tencent.com', 'bos.baidu.com',
    ],
  },

  // ── 开发 ──────────────────────────────────────────────────────────────────
  {
    name: '开发',
    icon: '💻',
    color: '#22C55E',
    patterns: [
      // 代码托管
      'github.com', 'github.io', 'raw.githubusercontent.com',
      'gitlab.com', 'bitbucket.org', 'gitee.com', 'coding.net',
      // 问答 / 社区
      'stackoverflow.com', 'serverfault.com', 'superuser.com', 'stackexchange.com',
      'dev.to', 'hashnode.com', 'hackernoon.com',
      // 中文社区
      'juejin.cn', 'segmentfault.com', 'cnblogs.com', 'csdn.net', 'oschina.net',
      'iteye.com', 'ibm.com/developer',
      // 文档 / 参考
      'developer.mozilla.org', 'web.dev', 'developer.chrome.com',
      'developers.google.com', 'developer.apple.com', 'learn.microsoft.com',
      'javascript.info', 'css-tricks.com', 'caniuse.com',
      'react.dev', 'vuejs.org', 'angular.io', 'svelte.dev', 'solidjs.com',
      'nextjs.org', 'nuxt.com', 'astro.build', 'remix.run',
      'nodejs.org', 'deno.land', 'bun.sh',
      'tailwindcss.com', 'ui.shadcn.com',
      'typescript-eslint.io', 'typescriptlang.org',
      'python.org', 'pypi.org', 'docs.python.org',
      'rust-lang.org', 'crates.io', 'go.dev', 'golang.org',
      'kotlinlang.org', 'swift.org', 'java.com', 'oracle.com/java',
      // 包管理
      'npmjs.com', 'yarn.dev', 'pnpm.io', 'bundlephobia.com',
      // 在线编辑器 / IDE
      'codepen.io', 'codesandbox.io', 'stackblitz.com', 'glitch.com',
      // 面试 / 练习
      'leetcode.com', 'hackerrank.com', 'codesignal.com', 'codewars.com',
      'exercism.org', 'projecteuler.net',
      // 工具（开发调试类）
      'regex101.com', 'regexr.com', 'jsfiddle.net',
      'jwt.io', 'base64encode.org', 'crontab.guru',
      'jsonlint.com', 'jsonformatter.org', 'transform.tools',
      'httpbin.org', 'requestbin.com', 'webhook.site',
      'mermaid.live', 'dbdiagram.io',
      // BaaS / Serverless DB
      'supabase.com', 'supabase.co',
      'firebase.google.com', 'firebaseapp.com',
      'planetscale.com', 'neon.tech', 'prisma.io', 'mongodb.com',
      'turso.tech', 'xata.io', 'pocketbase.io',
      // Auth
      'clerk.com', 'auth0.com', 'stytch.com', 'supertokens.com',
      // 监控 / 分析
      'sentry.io', 'datadog.com', 'newrelic.com', 'logrocket.com',
      'posthog.com', 'mixpanel.com', 'segment.com',
      // 搜索 / 消息
      'algolia.com', 'elasticsearch.co',
      'stripe.com/docs', 'twilio.com', 'sendgrid.com',
      // 建站 / 低代码（webflow 归开发）
      'shopify.com', 'shopify.dev',
      'wordpress.com', 'wordpress.org', 'wix.com', 'squarespace.com',
      'webflow.com', 'bubble.io',
      // 部署 / PaaS（开发者视角）
      'vercel.com', 'netlify.com', 'cloudflare.com',
      // CI/CD
      'circleci.com', 'travis-ci.org', 'travis-ci.com',
      // Docker / OS
      'docker.com', 'hub.docker.com',
      'ubuntu.com', 'debian.org', 'archlinux.org', 'fedoraproject.org',
      // 文档生成
      'gitbook.io', 'gitbook.com', 'readthedocs.io', 'mkdocs.org',
      // 速查
      'devdocs.io', 'tldr.sh', 'cheatography.com',
    ],
  },

  // ── 学习 ──────────────────────────────────────────────────────────────────
  {
    name: '学习',
    icon: '📚',
    color: '#A855F7',
    patterns: [
      // MOOC
      'coursera.org', 'udemy.com', 'edx.org', 'udacity.com',
      'skillshare.com', 'pluralsight.com', 'linkedin.com/learning',
      'masterclass.com', 'domestika.org',
      // 语言学习
      'duolingo.com', 'babbel.com', 'busuu.com', 'hellotalk.com',
      'anki.net', 'ankiweb.net', 'memrise.com',
      // 编程学习
      'codecademy.com', 'freecodecamp.org', 'odin-project.com',
      'theodinproject.com', 'brilliant.org',
      // 国内
      'icourse163.org', 'study.163.com', 'xuetangx.com', 'imooc.com',
      'ke.qq.com', 'khanacademy.cn', 'shuxue.net', 'ketangpai.com',
      'classba.cn', 'tmooc.cn', 'ixuezi.cn',
      // 学术
      'khanacademy.org',
      'mit.edu', 'stanford.edu', 'harvard.edu', 'ocw.mit.edu',
      'arxiv.org', 'scholar.google.com', 'researchgate.net', 'academia.edu',
      'ssrn.com', 'semanticscholar.org', 'paperswithcode.com',
      // 科普
      'ted.com', 'ted.ed', 'nationalgeographic.com', 'nature.com',
      'science.org', 'scientificamerican.com', 'newscientist.com',
      // 儿童
      'scratch.mit.edu', 'classdojo.com', 'epic.com',
    ],
  },

  // ── 参考 ──────────────────────────────────────────────────────────────────
  // 定位：静态知识查阅（百科、词典、翻译、评分、地图、综合工具）
  // 与"工具"区分：工具侧重网络检测 / 文件处理 / 安全；参考侧重内容查询
  {
    name: '参考',
    icon: '📖',
    color: '#F59E0B',
    patterns: [
      // 百科
      'wikipedia.org', 'wikimedia.org', 'wikidata.org',
      'britannica.com', 'baike.baidu.com', 'zh.wikipedia.org',
      // 词典 / 翻译
      'dictionary.com', 'merriam-webster.com', 'collinsdictionary.com',
      'oxfordlearnersdictionaries.com', 'macmillandictionary.com',
      'dict.cn', 'iciba.com', 'youdao.com', 'zdic.net',
      'translate.google.com', 'translate.google.cn',
      'deepl.com', 'fanyi.baidu.com', 'fanyi.qq.com',
      'lingva.ml', 'reverso.net',
      // 影视评分
      'imdb.com', 'themoviedb.org', 'rottentomatoes.com',
      'metacritic.com', 'letterboxd.com',
      'douban.com/film', 'mtime.com',
      // 评测 / 导购
      'zol.com.cn', 'pconline.com.cn', 'pcpop.com',
      'rtings.com', 'dpreview.com', 'gsmarena.com',
      'techradar.com', 'tomshardware.com', 'anandtech.com',
      // 地图 / 导航（wolframalpha / archive 统一归参考）
      'maps.google.com', 'google.com/maps',
      'map.baidu.com', 'amap.com', 'gaode.com',
      'openstreetmap.org', 'bing.com/maps',
      // 综合工具 / 存档
      'wolframalpha.com', 'archive.org', 'archive.today',
      'w3schools.com', 'geeksforgeeks.org',
      // 法律 / 标准
      'law.gov.cn', 'pkulaw.com', 'findlaw.com',
    ],
  },

  // ── 金融 ──────────────────────────────────────────────────────────────────
  {
    name: '金融',
    icon: '💰',
    color: '#10B981',
    patterns: [
      // 支付
      'paypal.com', 'venmo.com', 'cashapp.com',
      'wise.com', 'revolut.com', 'n26.com', 'monzo.com',
      'alipay.com', 'pay.weixin.qq.com', 'tenpay.com',
      // 国内银行
      'icbc.com.cn', 'ccb.com', 'abchina.com', 'boc.cn',
      'cmbchina.com', 'bankcomm.com', 'spdb.com.cn', 'cmbc.com.cn',
      'psbc.com', 'cebbank.com', 'hxb.com.cn',
      // 国际银行 / 券商
      'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citigroup.com',
      'schwab.com', 'fidelity.com', 'vanguard.com',
      'robinhood.com', 'webull.com', 'interactivebrokers.com',
      'etrade.com', 'tdameritrade.com',
      // 行情 / 资讯
      'finance.yahoo.com', 'tradingview.com', 'investing.com',
      'marketwatch.com', 'investopedia.com',
      'eastmoney.com', 'xueqiu.com', '10jqka.com.cn', 'cnstock.com',
      'sse.com.cn', 'szse.cn', 'hkex.com.hk',
      // 保险
      'insurtech.com', 'policygenius.com', 'zhongan.com',
      // 汇率 / 工具
      'xe.com', 'currencyconverter.r.io', 'moneycorp.com',
    ],
  },

  // ── 加密 ──────────────────────────────────────────────────────────────────
  {
    name: '加密',
    icon: '🪙',
    color: '#F7931A',
    patterns: [
      // 中心化交易所（CEX）
      'binance.com', 'binance.us',
      'coinbase.com', 'pro.coinbase.com', 'coinbase.one',
      'kraken.com', 'okx.com', 'bybit.com', 'kucoin.com',
      'crypto.com', 'gate.io', 'bitget.com', 'mexc.com',
      'htx.com', 'bitfinex.com', 'gemini.com', 'bitstamp.net',
      'upbit.com', 'bithumb.com', 'korbit.co.kr',
      'phemex.com', 'lbank.com',
      // 去中心化交易所（DEX）/ DeFi
      'uniswap.org', 'pancakeswap.finance', 'curve.fi', 'balancer.fi',
      '1inch.io', 'matcha.xyz', 'dydx.exchange', 'hyperliquid.xyz',
      'jupiter.ag', 'raydium.io', 'orca.so', 'traderjoe.xyz',
      'aerodrome.finance', 'velodrome.finance',
      'aave.com', 'compound.finance', 'makerdao.com',
      'lido.fi', 'rocketpool.net', 'eigenlayer.xyz',
      'frax.finance', 'convexfinance.com', 'yearn.fi',
      'morpho.org', 'pendle.finance', 'ether.fi', 'spark.fi',
      // 钱包
      'metamask.io', 'phantom.app', 'rabby.io', 'rainbow.me',
      'zerion.io', 'zapper.xyz', 'trustwallet.com', 'imtoken.com',
      'tokenpocket.pro', 'ledger.com', 'trezor.io', 'safe.global',
      'keplr.app', 'backpack.app', 'coinbasewallet.com',
      'xdefi.io', 'exodus.com', 'atomicwallet.io',
      // 区块浏览器
      'etherscan.io', 'bscscan.com', 'basescan.org', 'polygonscan.com',
      'arbiscan.io', 'optimistic.etherscan.io', 'lineascan.build',
      'era.zksync.network', 'blastscan.io', 'scrollscan.com',
      'snowtrace.io', 'avascan.info', 'ftmscan.com', 'gnosisscan.io',
      'solscan.io', 'solana.fm', 'explorer.solana.com',
      'tronscan.org', 'tonscan.org', 'tonviewer.com',
      'blockchair.com', 'mempool.space', 'blockstream.info',
      'oklink.com',
      // 行情数据
      'coinmarketcap.com', 'coingecko.com', 'messari.io',
      'glassnode.com', 'nansen.ai', 'dune.com', 'debank.com',
      'defillama.com', 'tokenterminal.com', 'cryptorank.io',
      'santiment.net', 'cryptoquant.com', 'lookintobitcoin.com',
      'ultrasound.money',
      // NFT / 社交 / 身份
      'opensea.io', 'blur.io', 'magiceden.io', 'rarible.com',
      'looksrare.org', 'foundation.app', 'superrare.com',
      'zora.co', 'manifold.xyz', 'tensor.trade',
      'ens.domains', 'unstoppabledomains.com', 'space.id',
      'snapshot.org',
      // 公链生态
      'ethereum.org', 'bitcoin.org',
      'solana.com', 'cosmos.network', 'polkadot.network',
      'arbitrum.io', 'optimism.io', 'base.org',
      'zksync.io', 'starknet.io', 'polygon.technology',
      'scroll.io', 'linea.build', 'avax.network',
      'sui.io', 'aptosfoundation.org', 'near.org', 'algorand.foundation',
      // 基础设施 / 开发
      'alchemy.com', 'infura.io', 'quicknode.com',
      'moralis.io', 'ankr.com', 'chainstack.com',
      'thirdweb.com', 'openzeppelin.com', 'hardhat.org', 'foundry-rs.com',
      'walletconnect.org', 'walletconnect.com',
      'chain.link', 'thegraph.com', 'graphprotocol.io',
      'layerzero.network', 'wormhole.com', 'axelar.network',
      'jito.network', 'pump.fun',
      // 安全
      'revoke.cash', 'scamsniffer.io', 'honeypot.is',
      'tokensniffer.com', 'certik.com', 'peckshield.com', 'chainalysis.com',
    ],
  },

  // ── 旅行 ──────────────────────────────────────────────────────────────────
  {
    name: '旅行',
    icon: '✈️',
    color: '#0EA5E9',
    patterns: [
      // 综合 OTA
      'booking.com', 'expedia.com', 'hotels.com', 'agoda.com',
      'kayak.com', 'trip.com', 'ctrip.com', 'fliggy.com',
      'priceline.com', 'trivago.com', 'trivago.cn',
      // 短租
      'airbnb.com', 'vrbo.com', 'homeaway.com',
      // 国内 OTA
      'qunar.com', 'tongcheng.com', 'mafengwo.cn', 'qyer.com',
      // 火车 / 大巴
      '12306.cn', 'rail.cc', 'bahn.de', 'renfe.com', 'sncf.com',
      'trainline.com', 'amtrak.com', 'flixbus.com',
      // 航空公司
      'cathaypacific.com', 'singaporeair.com', 'lufthansa.com',
      'emirates.com', 'qantas.com', 'klm.com', 'airfrance.com',
      'united.com', 'delta.com', 'aa.com', 'britishairways.com',
      'airchina.com.cn', 'csair.com', 'ceair.com',
      'westjet.com', 'airasia.com', 'thaiair.com',
      // 酒店品牌
      'marriott.com', 'hilton.com', 'hyatt.com', 'ihg.com',
      'accor.com', 'wyndhamhotels.com',
      'yaduo.com', 'jinjiang.com', 'huazhu.com',
      // 签证 / eSIM
      'airalo.com', 'holafly.com', 'nomadsim.com',
      'ivisa.com', 'visacentral.com',
      // 游记 / 导览
      'tripadvisor.com', 'viator.com', 'getyourguide.com',
      'klook.com', 'hostelworld.com', 'rome2rio.com',
      // 地图（旅行场景）
      'google.com/travel', 'maps.me', 'osmand.net',
    ],
  },

  // ── 游戏 ──────────────────────────────────────────────────────────────────
  {
    name: '游戏',
    icon: '🎮',
    color: '#8B5CF6',
    patterns: [
      // 平台 / 商店
      'store.steampowered.com', 'steamcommunity.com', 'steampowered.com',
      'epicgames.com', 'gog.com', 'itch.io',
      'playstation.com', 'xbox.com', 'nintendo.com', 'nintendo.co.jp',
      'battle.net', 'blizzard.com',
      'ea.com', 'origin.com', 'ubisoft.com', 'rockstargames.com',
      'bethesda.net', 'activision.com', '2k.com', 'take2games.com',
      'humblebundle.com', 'fanatical.com', 'greenmangaming.com',
      // 游戏本体
      'roblox.com', 'minecraft.net', 'mojang.com',
      'riotgames.com', 'leagueoflegends.com', 'valorant.com',
      'fortnite.com', 'apex-legends.com',
      // 模组 / 周边
      'gamejolt.com', 'kongregate.com', 'newgrounds.com',
      'nexusmods.com', 'curseforge.com',
      // 游戏资讯
      'igdb.com', 'ign.com', 'gamespot.com', 'polygon.com', 'kotaku.com',
      'pcgamer.com', 'eurogamer.net', 'rockpapershotgun.com',
      // 国内
      'mihoyo.com', 'hoyolab.com', 'mihayo.com',
      'netease.com', 'game.163.com', 'game.qq.com',
      'wegame.com.cn', '4399.com', '17173.com',
      'tap.io', 'taptap.com',
      // 速通 / 攻略
      'speedrun.com', 'gamefaqs.gamespot.com', 'gamesradar.com',
      // 注：twitch.tv / kick.com 归"视频"，不在此重复
    ],
  },

  // ── 工具 ──────────────────────────────────────────────────────────────────
  // 定位：网络检测 / 文件处理 / 安全 / 域名 / 短链等实用工具
  // 与"参考"区分：工具侧重操作性任务；参考侧重内容查阅
  {
    name: '工具',
    icon: '🔧',
    color: '#64748B',
    patterns: [
      // 网络检测
      'browserleaks.com', 'browserling.com',
      'whatismyipaddress.com', 'ipinfo.io', 'ip.sb', 'ipaddress.com',
      'ipleak.net', 'dnsleaktest.com', 'whoer.net',
      'speedtest.net', 'fast.com', 'nperf.com',
      'dns.google', 'dnschecker.org', 'mxtoolbox.com',
      'ping.pe', 'bgp.he.net', 'ipapi.co',
      // 域名 / WHOIS
      'whois.com', 'who.is', 'namecheap.com', 'godaddy.com',
      'domain.com', 'nic.io',
      // VPN / 代理
      'tailscale.com', 'zerotier.com', 'protonvpn.com',
      'expressvpn.com', 'nordvpn.com', 'surfshark.com', 'mullvad.net',
      // 密码管理
      '1password.com', 'lastpass.com', 'bitwarden.com', 'dashlane.com',
      'keepass.info', 'keeper.io',
      // 文件 / 图片处理
      'smallpdf.com', 'ilovepdf.com', 'pdf2doc.com',
      'convertio.co', 'cloudconvert.com',
      'removebg.com', 'remove.bg', 'tinypng.com', 'squoosh.app',
      'img2go.com', 'iloveimg.com',
      // SEO / 分析
      'semrush.com', 'ahrefs.com', 'similarweb.com',
      'chinaz.com', 'aizhan.com', '17ce.com',
      // 可用性检测
      'downdetector.com', 'isitdownrightnow.com', 'downforeveryoneorjustme.com',
      // 时间 / 日历
      'timeanddate.com', 'worldtimeserver.com', 'time.is',
      // 格式转换 / 验证
      'validator.w3.org', 'tool.lu', 'bejson.com',
      'jsoneditoronline.org', 'xmlvalidation.com',
      // 广告拦截 / 隐私
      'adblockplus.org', 'easylist.to', 'ghostery.com',
      'privacybadger.org', 'ublock.org', 'ublockorigin.net',
      'noscript.net', 'adguard.com',
      // 安全检测
      'virustotal.com', 'malwarebytes.com', 'haveibeenpwned.com',
      // 缓存 / 存档（archive.today / archive.org / wolframalpha 归参考）
      'webcache.googleusercontent.com',
      // 短链
      'bit.ly', 'tinyurl.com', 'short.io', 't.co',
      // 其他实用
      'ifixit.com',
    ],
  },

  // ── 成人 ──────────────────────────────────────────────────────────────────
  {
    name: '成人',
    icon: '🔞',
    color: '#FF6B35',
    patterns: [
      // 视频平台
      'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com',
      'redtube.com', 'tube8.com', 'youporn.com', 'spankbang.com',
      'beeg.com', 'drtuber.com', 'txxx.com', 'nuvid.com',
      'hqporner.com', 'porntrex.com', 'eporner.com', 'pornone.com',
      'tnaflix.com', 'empflix.com', 'cliphunter.com',
      // 创作者平台
      'onlyfans.com', 'fansly.com', 'manyvids.com', 'justfor.fans',
      'patreon.com/adult', 'loyalfans.com', 'fancentro.com',
      // 直播
      'chaturbate.com', 'stripchat.com', 'cam4.com',
      'myfreecams.com', 'livejasmin.com', 'bongacams.com',
      'streamate.com', 'camsoda.com',
      // 图片 / 同人
      'rule34.xxx', 'gelbooru.com', 'danbooru.donmai.us',
      'e-hentai.org', 'exhentai.org', 'nhentai.net',
      'hentai-foundry.com', 'yande.re', 'konachan.com', 'sankakucomplex.com',
      // 论坛
      'pornbb.org', 'adultdvdtalk.com',
      // 交友
      'adultfriendfinder.com', 'ashleymadison.com', 'fetlife.com',
      // AI 成人
      'crushon.ai', 'spicychat.ai', 'janitor.ai',
    ],
  },

  // ── 本地 ──────────────────────────────────────────────────────────────────
  {
    name: '本地',
    icon: '📡',
    color: '#71717A',
    patterns: ['localhost', 'local', 'internal', 'lan', 'home', 'arpa'],
  },
];

// ---------------------------------------------------------------------------
// 启发式关键词规则（当精确 pattern 未命中时触发）
//
// 设计原则：
//   - 关键词须在域名中具有较高区分度，避免误伤
//   - 已删除高误伤风险词：scan（squarespace误伤）、post（postman误伤）、
//     stream（upstream误伤）、play（display误伤）、profile（太短宽泛）
//   - 已删除冗余词：.ai（classifyDomain 中已有后缀兜底）
// ---------------------------------------------------------------------------

const HEURISTIC_RULES: { kw: string; cat: string }[] = [
  // 购物
  { kw: 'shop', cat: '购物' }, { kw: 'store', cat: '购物' },
  { kw: 'buy', cat: '购物' }, { kw: 'mall', cat: '购物' },
  { kw: 'cart', cat: '购物' }, { kw: 'market', cat: '购物' },
  { kw: 'ecommerce', cat: '购物' },
  // 金融
  { kw: 'bank', cat: '金融' }, { kw: 'pay', cat: '金融' },
  { kw: 'invest', cat: '金融' }, { kw: 'stock', cat: '金融' },
  { kw: 'loan', cat: '金融' }, { kw: 'fund', cat: '金融' },
  { kw: 'finance', cat: '金融' }, { kw: 'trading', cat: '金融' },
  { kw: 'forex', cat: '金融' }, { kw: 'broker', cat: '金融' },
  { kw: 'insurance', cat: '金融' }, { kw: 'mortgage', cat: '金融' },
  { kw: 'credit', cat: '金融' },
  // 加密（精确度较高的词）
  { kw: 'crypto', cat: '加密' }, { kw: 'nft', cat: '加密' },
  { kw: 'web3', cat: '加密' }, { kw: 'defi', cat: '加密' },
  { kw: 'blockchain', cat: '加密' }, { kw: 'dex', cat: '加密' },
  { kw: 'wallet', cat: '加密' }, { kw: 'token', cat: '加密' },
  { kw: 'bitcoin', cat: '加密' }, { kw: 'ethereum', cat: '加密' },
  { kw: 'swap', cat: '加密' }, { kw: 'yield', cat: '加密' },
  // 新闻（较完整的词，误伤风险低）
  { kw: 'news', cat: '新闻' }, { kw: 'press', cat: '新闻' },
  { kw: 'daily', cat: '新闻' }, { kw: 'times', cat: '新闻' },
  { kw: 'herald', cat: '新闻' }, { kw: 'journal', cat: '新闻' },
  { kw: 'media', cat: '新闻' }, { kw: 'tribune', cat: '新闻' },
  { kw: 'gazette', cat: '新闻' },
  // 游戏
  { kw: 'game', cat: '游戏' }, { kw: 'games', cat: '游戏' },
  { kw: 'gaming', cat: '游戏' }, { kw: 'esport', cat: '游戏' },
  // 工具
  { kw: 'tool', cat: '工具' }, { kw: 'dns', cat: '工具' },
  { kw: 'speedtest', cat: '工具' }, { kw: 'convert', cat: '工具' },
  { kw: 'calc', cat: '工具' }, { kw: 'checker', cat: '工具' },
  { kw: 'generator', cat: '工具' }, { kw: 'compressor', cat: '工具' },
  { kw: 'validator', cat: '工具' }, { kw: 'formatter', cat: '工具' },
  // 参考
  { kw: 'wiki', cat: '参考' }, { kw: 'dict', cat: '参考' },
  { kw: 'translate', cat: '参考' }, { kw: 'fanyi', cat: '参考' },
  { kw: 'encyclopedia', cat: '参考' }, { kw: 'definition', cat: '参考' },
  // 学习
  { kw: 'learn', cat: '学习' }, { kw: 'course', cat: '学习' },
  { kw: 'academy', cat: '学习' }, { kw: 'school', cat: '学习' },
  { kw: 'edu', cat: '学习' }, { kw: 'university', cat: '学习' },
  { kw: 'college', cat: '学习' }, { kw: 'tutorial', cat: '学习' },
  { kw: 'mooc', cat: '学习' },
  // 邮件
  { kw: 'mail', cat: '邮件' }, { kw: 'inbox', cat: '邮件' },
  { kw: 'webmail', cat: '邮件' },
  // 视频
  { kw: 'video', cat: '视频' }, { kw: 'tube', cat: '视频' },
  { kw: 'watch', cat: '视频' }, { kw: 'movie', cat: '视频' },
  { kw: 'film', cat: '视频' }, { kw: 'anime', cat: '视频' },
  // 注：tv 太短（误伤 iptv / webtv 等）；stream 已移除
  // 音乐
  { kw: 'music', cat: '音乐' }, { kw: 'audio', cat: '音乐' },
  { kw: 'podcast', cat: '音乐' }, { kw: 'radio', cat: '音乐' },
  { kw: 'song', cat: '音乐' }, { kw: 'beatport', cat: '音乐' },
  // 注：beat 改为精确词 beatport，避免 heartbeat 等误伤
  // 社交
  { kw: 'forum', cat: '社交' }, { kw: 'community', cat: '社交' },
  { kw: 'social', cat: '社交' }, { kw: 'chat', cat: '社交' },
  { kw: 'message', cat: '社交' }, { kw: 'friend', cat: '社交' },
  // 注：profile 已移除（过短，几乎所有网站都有该词）
  // 搜索
  { kw: 'search', cat: '搜索' }, { kw: 'find', cat: '搜索' },
  { kw: 'google.', cat: '搜索' },
  // AI
  { kw: 'gpt', cat: 'AI' }, { kw: 'llm', cat: 'AI' },
  { kw: 'diffusion', cat: 'AI' },
  // 注：.ai 后缀已在 classifyDomain 中单独兜底，此处不重复
  // 云服务
  { kw: 'cloud', cat: '云服务' }, { kw: 'hosting', cat: '云服务' },
  { kw: 'server', cat: '云服务' }, { kw: 'vps', cat: '云服务' },
  // 开发
  { kw: 'dev', cat: '开发' }, { kw: 'code', cat: '开发' },
  { kw: 'api', cat: '开发' }, { kw: 'sdk', cat: '开发' },
  { kw: 'docs', cat: '开发' }, { kw: 'npm', cat: '开发' },
  { kw: 'github', cat: '开发' }, { kw: 'repo', cat: '开发' },
  { kw: 'debug', cat: '开发' }, { kw: 'deploy', cat: '开发' },
  // 旅行
  { kw: 'travel', cat: '旅行' }, { kw: 'flight', cat: '旅行' },
  { kw: 'hotel', cat: '旅行' }, { kw: 'booking', cat: '旅行' },
  { kw: 'tour', cat: '旅行' }, { kw: 'visa', cat: '旅行' },
  { kw: 'airport', cat: '旅行' },
  // 成人
  { kw: 'porn', cat: '成人' }, { kw: 'xxx', cat: '成人' },
  { kw: 'adult', cat: '成人' }, { kw: 'hentai', cat: '成人' },
  { kw: 'nsfw', cat: '成人' }, { kw: 'sex', cat: '成人' },
  { kw: 'erotic', cat: '成人' },
  // 工作
  { kw: 'task', cat: '工作' }, { kw: 'project', cat: '工作' },
  { kw: 'meeting', cat: '工作' }, { kw: 'schedule', cat: '工作' },
  { kw: 'collaborate', cat: '工作' },
  // 生活
  { kw: 'rent', cat: '生活' }, { kw: 'hire', cat: '生活' },
  { kw: 'job', cat: '生活' }, { kw: 'recruit', cat: '生活' },
  { kw: 'health', cat: '生活' }, { kw: 'doctor', cat: '生活' },
  { kw: 'hospital', cat: '生活' }, { kw: 'clinic', cat: '生活' },
];

// ---------------------------------------------------------------------------
// 图标库（供用户自定义分类时选择）
// ---------------------------------------------------------------------------

export const ICON_LIBRARY = [
  '💬', '🎬', '🛒', '📰', '✉️', '🔍', '💼', '💻', '📚', '💰', '🎮',
  '🎵', '🖼️', '📷', '✈️', '🏠', '🍔', '⚽', '🧪', '📊', '🔧', '🎯',
  '💡', '📺', '💊', '🚗', '📱', '🌐', '🗓️', '📎', '⭐', '❤️', '🔥', '📌',
  '🪙', '📡', '🔞', '☁️', '🤖',
  '🗣️', '👥', '💭', '👾', '✍️', '📝', '✒️',
  '🎙️', '🎧', '📻', '🎨', '🖌️', '📐', '✏️', '🎥', '🎞️',
  '⚙️', '🛠️', '🔌', '⚡', '🔩', '🔬', '🔭', '🧮',
  '⚖️', '📜', '🔒', '🔑', '🛡️',
  '☀️', '⛅', '🌈', '⛈️', '🌱', '🐾', '🐶', '🌳', '🐈',
  '🏀', '🚴', '🏊', '🎾', '🏋️', '🏒',
  '🚕', '🚌', '🚲', '🚆', '🛳️', '🧳', '🗺️', '📍', '🏝️', '🏔️',
  '💳', '💹', '🏦', '💎', '🧾',
  '📄', '📁', '🗂️', '📋', '🗞️',
  '✨', '💫', '🎲', '🧩', '♟️', '🎭',
  '🎓', '🏫', '📖',
];

// ---------------------------------------------------------------------------
// 颜色库（供用户自定义分类时选择）
// ---------------------------------------------------------------------------

export const COLOR_LIBRARY = [
  '#6C5CE7', '#3B82F6', '#14B8A6', '#22C55E', '#F97316', '#EC4899',
  '#F43F5E', '#EAB308', '#6366F1', '#A855F7', '#10B981', '#8B5CF6',
  '#0EA5E9', '#F59E0B', '#EF4444', '#84CC16', '#F7931A', '#71717A',
  '#06B6D4', '#FF6B35', '#64748B', '#0F172A',
];

// ---------------------------------------------------------------------------
// 核心匹配逻辑
// ---------------------------------------------------------------------------

/**
 * 判断域名 domain 是否匹配 pattern。
 *
 * 规则：
 * - pattern 以 "." 结尾：前缀匹配，如 "news." 匹配 "news.bbc.com"
 * - 否则：精确匹配或子域名匹配（domain === pattern 或 domain.endsWith('.' + pattern)）
 */
function matches(domain: string, pattern: string): boolean {
  if (pattern.endsWith('.')) {
    return domain.startsWith(pattern);
  }
  return domain === pattern || domain.endsWith('.' + pattern);
}

/**
 * 判断是否为本地地址（localhost、私有 IP、保留 TLD 等）
 */
function isLocalAddress(domain: string): boolean {
  return (
    domain === 'localhost' ||
    /\.(local|internal|lan|home|localhost|arpa)$/.test(domain) ||
    /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(domain)
  );
}

/**
 * 对给定域名进行分类。
 *
 * 优先级（从高到低）：
 *  1. 本地地址 → "本地"
 *  2. 精确 pattern 匹配，越长越优先（最长匹配胜出）
 *  3. 后缀 ".ai" 兜底 → "AI"
 *  4. 启发式关键词 → 对应分类
 *  5. 兜底 → "其他"
 */
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

  // 后缀兜底
  if (d.endsWith('.ai')) return 'AI';

  // 启发式关键词
  const known = new Set(rules.map((r) => r.name));
  for (const { kw, cat } of HEURISTIC_RULES) {
    if (d.includes(kw) && known.has(cat)) return cat;
  }

  return '其他';
}
