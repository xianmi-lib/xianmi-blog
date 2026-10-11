# AGENTS.md — xianmi-blog

显密文库官方博客工程（2026-10-12 立项，preview 域原型）。共享约定见 `~/projects/xianmi/AGENTS.md`（meta 仓总纲，尤其 GitHub 双 org 可见性规则：本仓属公开 org `xianmi-lib`）。

## 定位与 URL 契约（已定，勿改）

- 独立 Astro + Starlight 站，独立 Worker 挂载：简体 `xianmi.co/blog/*`、繁体 `xianmi.co/zh-tw/blog/*`（先例 = `xianmi.co/starlight*` 挂主题 demo）。
- 发布链路（未实施，publish 域）：推 GitHub → CF Workers Builds 自动部署，不进主站攒批。
- **简繁方案 b**：单仓双 build。`XIANMI_BLOG_TW=1` 切繁体（内容/字体/语言），`XIANMI_BLOG_BASE=/zh-tw` 只在繁体**构建**时设（dev 恒 base='/'）。

## 技术栈与关键裁决

- Astro 7 + Starlight 0.42 + **starlight-blog 0.30** + **starlight-theme-large-print 0.5.1（npm 版，dogfood）**。
- **不装 starlight-ai-actions**（用户裁决：博客是现代白话原创，无 AI 讨论需求，保持轻）。
- 无 routeData 那套 pXX 逻辑；`src/routeData.ts` 只做简繁 hreflang head 注入。

## starlight-blog 路由机制（改配置前必读）

- 博文 = `docs/blog/*.md`（docs 集合 + blogSchema 扩展）；路由前缀 = 插件 `prefix: 'blog'`。
- **最终 URL = base + prefix 叠加**：简体 build `base='/'` → `/blog/*`；繁体 build `base='/zh-tw'` → `/zh-tw/blog/*`。插件不支持空 prefix（条目过滤依赖 `${prefix}/` 目录前缀）。
- **资产收拢 `build.assets='blog/_astro'`**：简体 base='/' 时若用默认 `_astro`，资产引用会落在 `/_astro/*` 与主站根路径资产冲突（blog worker 只挂 /blog/*）。繁体 base='/zh-tw' 时自动引用 `/zh-tw/blog/_astro`。
- **sitemap 收拢**：@astrojs/sitemap 产物落 dist 根（文件位置不按 base），`tools/postbuild.mjs` 收进 `blog/` 前缀目录并改写 sitemap-index 的 `<loc>`（不改会指向主站 sitemap，串台）。繁体 postbuild 另做 dist 包裹（`dist → dist/zh-tw/`，与正式 tw 先例一致）。

## 常用命令

- `npm run dev:cn` / `dev:tw`：dev 端口 **4333（简）/ 4334（繁）**（4331/4332 是预览对，勿占）。
- `npm run build:cn` / `build:tw`：gen-content → astro build → postbuild 全链。
- `npm run gen` / `node tools/gen-content.mjs --tw`：只重新生成内容。

## 内容生产（desc worker 是生产 owner）

- **流程（2026-10-12 定案）**：用户与 LLM 讨论素材 → desc 成文简体（Prompt A）→ AI 翻译繁体（Prompt B，术语护栏）→ 用户过目 → desc push 触发 CF Builds。
- **红线：繁体 = AI 翻译 + 人工校订，禁用 OpenCC 机械转换**。OpenCC 是 6 万篇初始语料的规模权宜；blog 每篇几千字付得起 AI 翻译，且翻译贴合台湾大众文字习惯（用词/语气/句式在地化）。双 prompt 草稿在 `tools/translate-prompt.md`，每篇复用、护栏随语料演进维护。
- **目录**：`posts/zh-cn/`（简体成文）、`posts/zh-tw/`（繁体译稿）——两份都是入仓内容文件，build 期不做任何转换；文件名 = slug，双语必须同名（hreflang 前缀互换配对的根基）。
- **双语配对校验**：`tools/gen-content.mjs` 在简体 build 时强校验——任何简体文缺同名繁体稿 = exit 1（build 红）；繁体孤本只警告。防漂移从「工具保证」改为「纪律 + 校验」。
- frontmatter 必含 title/description（对齐 G16 精神）；date/authors 双语严格相同，tags 译为正体对应词。新文章须双语同 commit。

## 已知坑（实测）

- **dev 不可简繁双开**：两个 dev 共享 `src/content/docs/blog/` 生成目录，后生成者覆盖前者（内容对、配置错或反之）。验收/开发按语言**串行**：停一个 → 换 gen → 起另一个。
- **dev 下多段 base 404**：dev 若设 `base='/zh-tw'`，`/zh-tw/blog/*` 全 404（纯 Astro repro 无此问题，Starlight 叠加后触发；生产构建正常）。故 dev 恒 base='/'（繁体 dev 在 4334 以 `/blog/*` 预览，与正式站 XIANMI_TW_BASE「dev 不设 base」先例同构）。
- **dev 内容目录重建须干净重启**：gen 整目录抹除重写会让运行中 dev 的 content store 变空（getCollection 返回 []），须重启 dev（与预览工程软链内容纪律同族）。
- **标签/作者索引页无简繁 hreflang**：tag slug = 标签原文（站点故事≠站點故事），前缀互换会 404——routeData.ts 与 sitemap 对 /tags//authors/ 跳过配对（文章页 slug=文件名，严格配对不受影响）。这是 AI 翻译路线下 tag URL 的天然不对称，已裁决接受。
- `devToolbar.enabled=false`（截图/验收干净，Astro dev toolbar 仅 dev 可见但会进 fullPage 截图）。
- starlight-blog 的 `navigation` 默认 `header-end` 会覆盖 ThemeSelect——本站 Header 自渲染主题控件，必须显式 `navigation: 'none'`。

## 待办（归属）

- CF 路由挂载 + Workers Builds 配置（publish 域，原型验收过后再派）。
- GitHub 建仓/推送（`xianmi-lib/xianmi-blog`，公开仓）等 main 通知。
- og:image 暂借主站 `/og.png`；博客专有 og 图可后补。cooler-credit 赞助卡可后补。
- blog worker 的 404 落地页（`dist/404.html` 在 dist 根，不在 /blog/* 路由内，须 Worker not_found 方案）。
