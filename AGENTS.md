# AGENTS.md — xianmi-blog

显密文库官方博客工程（2026-10-12 立项，preview 域原型）。共享约定见 `~/projects/xianmi/AGENTS.md`（meta 仓总纲，尤其 GitHub 双 org 可见性规则：本仓属公开 org `xianmi-lib`）。

## 定位与 URL 契约（已定，勿改）

- 独立 Astro + Starlight 站，独立 Worker 挂载：简体 `xianmi.co/blog/*`、繁体 `xianmi.co/zh-tw/blog/*`（先例 = `xianmi.co/starlight*` 挂主题 demo）。
- 发布链路（**已上线 2026-10-12**）：首次 `npx wrangler deploy` 手动部署（publish 执行），四条路由已挂（见下「部署」节）；CF Workers Builds 待用户 dashboard 向导铸 token 后收尾。
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
- `npm run build`：合并构建（`tools/build-all.mjs`）——build:cn → 暂存 → build:tw → 合并出单一 `dist/`（简体 `dist/blog/*` + 繁体 `dist/zh-tw/blog/*` + 根 `404.html`）。这是 CF Builds 的 build command。

## 部署（publish 域）

- **产物形态**：单 Worker `xianmi-blog`，静态 assets = 合并 `dist/`（248 文件量级）；`wrangler.jsonc` 在本仓，`not_found_handling: "404-page"`（根 `404.html` 来自简体 build；繁体 404 无独立槽位，已裁决接受）。
- **路由（2026-10-12 已挂）**：`www.xianmi.co/blog*`、`xianmi.co/blog*`、`www.xianmi.co/zh-tw/blog*`、`xianmi.co/zh-tw/blog*`（星号形态兼捕裸路径；「更具体者优先」压过主站 /* 与 /zh-tw/*，主站零改动；裸域 naked→www 301 在路由前生效）。
- **首发**：2026-10-12 publish 手动 `npx wrangler deploy`（Version ID 515a4538），线上验证全绿（证据 `~/xianmi-evidence/blog-deploy-20261012/`）。
- **CF Workers Builds（收尾中）**：repo connection 已建（`xianmi-lib/xianmi-blog`，CLI upsert）；build token CLI 铸不了（与主题仓 10-05 同坑），待用户 dashboard Builds 向导铸 `xianmi-blog build token` 并建配置，之后 CLI 校 path_includes + 查 external_script_id 唯一 + 建 manual-retrigger deploy hook。Builds 接管后**唯一部署通道 = push main**，本地 deploy 退役禁双轨（同主题仓纪律）。

## 内容生产（copy worker 是生产 owner）

- **流程（2026-10-12 定案）**：用户与 LLM 讨论素材 → copy 成文简体（Prompt A）→ AI 翻译繁体（Prompt B，术语护栏）→ 用户过目 → copy push 触发 CF Builds。
- **红线：繁体 = AI 翻译 + 人工校订，禁用 OpenCC 机械转换**。OpenCC 是 6 万篇初始语料的规模权宜；blog 每篇几千字付得起 AI 翻译，且翻译贴合台湾大众文字习惯（用词/语气/句式在地化）。双 prompt 草稿在 `tools/translate-prompt.md`，每篇复用、护栏随语料演进维护。
- **目录**：`posts/zh-cn/`（简体成文）、`posts/zh-tw/`（繁体译稿）——两份都是入仓内容文件，build 期不做任何转换；文件名 = slug，双语必须同名（hreflang 前缀互换配对的根基）。
- **双语配对校验**：`tools/gen-content.mjs` 在简体 build 时强校验——任何简体文缺同名繁体稿 = exit 1（build 红）；繁体孤本只警告。防漂移从「工具保证」改为「纪律 + 校验」。
- frontmatter 必含 title/description（对齐 G16 精神）；date/authors 双语严格相同，tags 译为正体对应词。新文章须双语同 commit。

## 已知坑（实测）

- **dev 不可简繁双开（硬锁）**：Astro 7 项目级 dev 锁（`.astro/dev.json`）使同工程只能跑一个 dev；外加两 dev 共享 `src/content/docs/blog/` 生成目录的覆盖问题。换语言按序：停当前 dev → `rm .astro/dev.json` → 起另一个（dev:cn/dev:tw 脚本自带 gen）。
- **dev 下多段 base 404**：dev 若设 `base='/zh-tw'`，`/zh-tw/blog/*` 全 404（纯 Astro repro 无此问题，Starlight 叠加后触发；生产构建正常）。故 dev 恒 base='/'（繁体 dev 在 4334 以 `/blog/*` 预览，与正式站 XIANMI_TW_BASE「dev 不设 base」先例同构）。
- **dev 内容目录重建须干净重启**：gen 整目录抹除重写会让运行中 dev 的 content store 变空（getCollection 返回 []），须重启 dev（与预览工程软链内容纪律同族）。
- **标签/作者索引页无简繁 hreflang**：tag slug = 标签原文（站点故事≠站點故事），前缀互换会 404——routeData.ts 与 sitemap 对 /tags//authors/ 跳过配对（文章页 slug=文件名，严格配对不受影响）。这是 AI 翻译路线下 tag URL 的天然不对称，已裁决接受。
- `devToolbar.enabled=false`（截图/验收干净，Astro dev toolbar 仅 dev 可见但会进 fullPage 截图）。
- starlight-blog 的 `navigation` 默认 `header-end` 会覆盖 ThemeSelect——本站 Header 自渲染主题控件，必须显式 `navigation: 'none'`。

## 待办（归属）

- ~~CF 路由挂载~~（2026-10-12 完成）；CF Workers Builds 收尾（publish 域）——等用户 dashboard 向导铸 build token。
- GitHub 仓已建已推（`xianmi-lib/xianmi-blog`，公开仓）。
- og:image 暂借主站 `/og.png`；博客专有 og 图可后补。cooler-credit 赞助卡可后补。
- ~~blog worker 的 404 落地页~~（2026-10-12 解决：`not_found_handling: "404-page"`，未命中 /blog/* 路径回根 404.html 简体页）。
