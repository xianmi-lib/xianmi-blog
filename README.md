# 显密文库博客 / 顯密文庫博客

显密文库官方博客，简体 <https://www.xianmi.co/blog/>、繁体 <https://www.xianmi.co/zh-tw/blog/>。

Astro 7 + Starlight + [starlight-blog](https://starlight-blog-docs.vercel.app/) + 自研适老化主题 [starlight-theme-large-print](https://www.xianmi.co/starlight/)（dogfood）。

## 开发

```bash
npm install
npm run dev:cn   # http://localhost:4333/blog/
npm run dev:tw   # http://localhost:4334/blog/（繁体）
npm run build:cn # dist/ → /blog/*
npm run build:tw # dist/zh-tw/ → /zh-tw/blog/*
```

简体稿在 `posts/zh-cn/`、繁体稿在 `posts/zh-tw/`（AI 翻译 + 人工校订，禁用 OpenCC 机械转换），双语同名 slug。生产流程与双 prompt 见 [tools/translate-prompt.md](./tools/translate-prompt.md)。工程约定与踩坑见 [AGENTS.md](./AGENTS.md)。

## 许可

博文内容 © xianmi.co；工程代码 MIT。
