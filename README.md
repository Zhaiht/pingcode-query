# PingCode Query

基于 PingCode Open API 的自动化工具，用于查询项目工作项并生成可视化报告。

## 功能

- 自动查询指定项目上周已完成的工作项（需求/故事）
- 自动查询未处理的缺陷
- 生成美观的 HTML 报告，支持响应式布局

## 环境要求

- Node.js >= 18.0.0（使用原生 `fetch`）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 PingCode 凭证：

```env
PINGCODE_BASE_URL=https://open.pingcode.com
PINGCODE_CLIENT_ID=your_client_id_here
PINGCODE_CLIENT_SECRET=your_client_secret_here
PINGCODE_INSTANCE=your-company.pingcode.com
PINGCODE_API_TOKEN=
```

> **如何获取凭证？**
> 1. 登录 PingCode，进入 **管理 > 应用集成** 创建应用
> 2. 获取 `Client ID` 和 `Client Secret`
> 3. 运行 `npm run get-token` 获取 `access_token`，填入 `PINGCODE_API_TOKEN`

### 3. 运行

```bash
# 生成工作项报告
npm run query

# 仅获取 access token（用于调试）
npm run get-token
```

运行成功后，会在项目根目录生成 `report.html` 文件。

## 项目结构

```
├── index.js        # 主脚本：查询数据并生成报告
├── get-token.js    # 辅助脚本：获取 access token
├── style.css       # 报告样式
├── .env.example    # 环境变量模板
├── .gitignore
└── package.json
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PINGCODE_BASE_URL` | PingCode Open API 地址 | `https://open.pingcode.com` |
| `PINGCODE_CLIENT_ID` | 应用的 Client ID | 从 PingCode 管理后台获取 |
| `PINGCODE_CLIENT_SECRET` | 应用的 Client Secret | 从 PingCode 管理后台获取 |
| `PINGCODE_INSTANCE` | 你的 PingCode 实例域名 | `your-company.pingcode.com` |
| `PINGCODE_API_TOKEN` | Access Token（可选，脚本会自动获取） | `npm run get-token` 获取 |

## 报告内容

生成的 HTML 报告包含：

- **上周已完成的工作项** - 编号、标题、类型、状态、负责人
- **未处理的缺陷** - 编号、标题、优先级、状态、负责人

每项均带有链接，点击可直接跳转到 PingCode 对应页面。

## License

MIT
