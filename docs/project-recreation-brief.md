# Walrus Memory Inspector 项目重建说明

这份文档用于在新目录或新电脑上重新创建项目 Git 仓库，并快速恢复当前 MVP 的技术结构、运行方式和后续开发方向。

## 项目定位

Walrus Memory Inspector 是一个面向 Walrus AI memory track 的浏览器端 MVP。项目重点不是简单文件上传，而是把 AI agent memory 变成可持久化、可检查、可调试、可审计、可导出的 artifact。

核心演示链路：

```text
raw memory -> summary artifact -> agent run trace -> audit log -> improved answer
```

当前 demo 通过一组预置 memories 展示：

- 长期 memory artifact
- Walrus HTTP 上传路径
- 本地 demo fallback
- Walrus 上传诊断，包括 endpoint、timeout、storage mode、fallback 原因
- artifact 写入相关操作的 loading 状态和防重复点击
- agent run trace
- memory citation
- deadline、requirement version、owner/source 冲突检测
- 一键冲突解决
- retrieval score、matched tokens、citation reasons
- audit artifact
- memory health score
- artifact timeline
- artifact graph edge list
- evidence bundle JSON 导出

## 技术栈

- Runtime/package manager: Bun
- Frontend: React 19
- Language: TypeScript 6
- Build tool: Vite 8
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`
- Icons: `lucide-react`
- Persistence: browser `localStorage`
- Artifact storage: Walrus HTTP publisher with local demo fallback

Tailwind v4 通过 Vite plugin 和 `src/styles.css` 加载。

## 当前目录结构

```text
.
├── README.md
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
├── index.html
├── docs/
│   ├── architecture.md
│   ├── demo-walkthrough.md
│   ├── project-recreation-brief.md
│   └── submission-checklist.md
└── src/
    ├── main.tsx
    ├── styles.css
    ├── types.ts
    ├── storage.ts
    ├── demoData.ts
    ├── walrusAdapter.ts
    ├── agent.ts
    ├── conflicts.ts
    ├── inspector.ts
    └── vite-env.d.ts
```

## 核心模块

- `src/main.tsx`: React UI、页面布局、交互状态、memory 操作、agent run、冲突解决、导出入口。
- `src/types.ts`: Memory、Artifact、AgentRun、AuditLog、DemoState 等领域类型。
- `src/storage.ts`: 基于 `localStorage` 的浏览器端状态持久化。
- `src/demoData.ts`: 初始 demo memories，包含 `June 20` 和 `June 15` deadline 冲突。
- `src/walrusAdapter.ts`: Walrus HTTP 上传适配器。上传失败或超时后生成 `walrus-demo-*` 本地 artifact。
- `src/agent.ts`: 可解释关键词检索、memory 排序、回答生成、trace artifact 生成。
- `src/conflicts.ts`: 检测 deadline、requirement version、owner/source conflict。
- `src/inspector.ts`: Memory Health、Artifact Timeline、Artifact Graph、Evidence Bundle 工具函数。

## 环境变量

默认 Walrus testnet 配置在 `src/walrusAdapter.ts` 中：

```bash
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_UPLOAD_TIMEOUT_MS=10000
```

如需覆盖，创建 `.env.local`：

```bash
VITE_WALRUS_PUBLISHER_URL=<your-publisher-url>
VITE_WALRUS_AGGREGATOR_URL=<your-aggregator-url>
VITE_WALRUS_UPLOAD_TIMEOUT_MS=10000
```

`.env.local` 会被 `.gitignore` 忽略，不应提交密钥或私有端点。
如需本地覆盖配置，可以先复制 `.env.example` 到 `.env.local`。

## Walrus 上传验证记录

默认 testnet endpoint 已在 2026-06-15 验证：

- Publisher CORS preflight 接受来自 localhost origin 的浏览器 `PUT` 请求。
- `PUT /v1/blobs` 成功返回真实 blob ID。
- Aggregator `GET /v1/blobs/:blobId` 能读取上传的 JSON artifact。
- 实测上传耗时约 7.2 秒，因此默认 upload timeout 调整为 10000ms。

当前判断：默认 testnet 路径暂不需要 backend proxy。只有当 judging endpoint 需要私有凭证、CORS 行为不稳定，或多次超过 browser-direct timeout 时，再增加 backend proxy。

## 本地运行

```bash
bun install
bun run dev
```

打开 Vite 输出的本地 URL。

## 构建验证

```bash
bun run build
bun run test
bun outdated
```

当前验证状态：

- `bun install` 成功。
- `bun run build` 成功。
- `bun run test` 成功。
- `bun outdated` 未列出过期依赖。

## 重新创建 Git 仓库

如果是在一个全新目录中重建项目：

```bash
mkdir walrus-memory-inspector
cd walrus-memory-inspector
git init -b main
```

复制当前项目文件后，确认不要提交这些目录或文件：

```text
node_modules/
dist/
.env
.env.*
```

建议保留当前 `.gitignore`：

```gitignore
.DS_Store
node_modules/
dist/
.env
.env.*
!.env.example
```

安装并验证：

```bash
bun install
bun run build
```

首次提交：

```bash
git add .
git commit -m "Initial Walrus Memory Inspector MVP"
```

添加新远端并推送：

```bash
git remote add origin <new-git-remote-url>
git push -u origin main
```

如果是在当前目录中更换到新 Git 仓库，不要直接删除 `.git`，除非已经确认不再需要现有历史。更安全的流程是：

```bash
git remote remove origin
git remote add origin <new-git-remote-url>
git push -u origin main
```

当前仓库信息：

```text
branch: main
origin: git@github.com:wenfeizou/walrus-memory-inspector.git
```

## Demo Walkthrough

1. 打开应用，点击 `Reset Demo`。
2. 查看 `Walrus Diagnostics`，确认 artifact 使用真实 Walrus 还是 local demo fallback。
3. 查看 `Memory Health`，它会反映当前 unresolved conflict。
4. 查看 `Conflict Radar`，它会检测 deadline、requirement version、owner/source conflict。
5. 点击 `Run Agent With Memory`。
6. 查看 `Trace Viewer` 中的 retrieval score、matched tokens、citation reasons。
7. 点击 `Resolve by latest memory`。
8. 再次运行 agent。
9. 查看 answer 是否引用 June 15。
10. 查看 `Audit Log`。
11. 查看 `Artifact Timeline`。
12. 查看 `Artifact Graph`。
13. 点击 `Export Evidence Bundle` 导出 JSON。

## 已完成能力

- Browser-only MVP
- Seed demo memories
- Local persistence
- Walrus HTTP artifact adapter
- Local demo artifact fallback
- Walrus Diagnostics
- Upload loading states and duplicate-click guards
- Agent Q&A
- Agent trace artifact
- Conflict Radar
- One-click conflict resolution
- Audit Log
- Memory Health
- Artifact Timeline
- Artifact Graph edge list
- Evidence Bundle export
- README、architecture diagram、demo walkthrough、submission checklist 和项目重建说明

## 当前限制和风险

- 真实 Walrus 上传路径还需要在目标网络和 judging 环境验证。
- 浏览器直连 publisher 可能遇到 CORS、延迟或可用性问题。
- Walrus Diagnostics 能记录 fallback 原因，但不会自动解决浏览器上传稳定性问题。
- metadata 只存在 `localStorage`，没有服务端索引。
- retrieval 是可解释关键词打分，不是 embedding search。
- conflict detector 覆盖少量透明规则，不是任意矛盾检测。
- Artifact Graph 目前是 edge list，不是交互式图。
- 自动化测试已覆盖核心 conflict、inspector、upload diagnostics、evidence bundle 和 agent retrieval 逻辑，但还没有浏览器端交互测试。

## 推荐下一步

优先用 `Walrus Diagnostics` 确认真实 Walrus upload：

```text
frontend -> Walrus publisher -> blob ID -> aggregator URL
```

如果浏览器上传不稳定，再增加一个小型 backend proxy：

```text
frontend -> /api/walrus/upload -> Walrus publisher
```

之后再做：

- MemWal delegated key integration
- server-side metadata index
- embedding search
- richer conflict detectors
- interactive artifact graph
- multi-agent scenario
- submission video、deck、architecture diagram
