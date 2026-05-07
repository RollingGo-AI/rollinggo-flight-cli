# RollingGo Flight CLI

RollingGo 航班搜索 CLI 工具，支持机场搜索和航班查询。

## 安装方式

### 方式一：uvx（推荐，无需安装）

```bash
uvx rollinggo-flight --help
```

### 方式二：npx（无需安装）

```bash
npx rollinggo-flight --help
```

### 方式三：curl 一键安装（无需 Python/Node 环境）

**Linux / macOS：**

```bash
curl -fsSL https://raw.githubusercontent.com/RollingGo-AI/rollinggo-flight-cli/main/scripts/install.sh | sh
```

**Windows PowerShell：**

```powershell
irm https://raw.githubusercontent.com/RollingGo-AI/rollinggo-flight-cli/main/scripts/install.ps1 | iex
```

## 使用

需要先获取 RollingGo API Key，通过 `--api-key` 参数传入或设置环境变量 `ROLLINGGO_API_KEY`。

### 搜索机场

```bash
rollinggo-flight search-airports --api-key <key> --keyword "Hangzhou"
```

### 搜索航班

```bash
rollinggo-flight search-flights --api-key <key> \
  --from-city HGH --to-city CTU \
  --from-date 2026-05-01 --trip-type ONE_WAY \
  --adult-number 1 --child-number 0 --cabin-grade ECONOMY
```

### 使用环境变量

```bash
export ROLLINGGO_API_KEY=your_key
rollinggo-flight search-airports --keyword "Beijing"
```

---

## 开发者发布流程

### 项目结构

```
rollinggo-flight-cli/
├── rollinggo-uv-cli/     # Python 版本（发布到 PyPI）
├── rollinggo-npm-cli/    # Node.js 版本（发布到 npm）
└── scripts/
    ├── install.sh        # Linux/macOS 安装脚本
    └── install.ps1       # Windows 安装脚本
```

### 发布新版本

**第一步：修改版本号**

```
rollinggo-npm-cli/package.json      → "version": "x.x.x"
rollinggo-uv-cli/pyproject.toml     → version = "x.x.x"
```

**第二步：提交并推送 tag**

```bash
git add -A
git commit -m "chore: bump to vX.X.X"
git tag vX.X.X
git push origin main --tags
```

**第三步：自动完成（无需手动操作）**

推送 tag 后 GitHub Actions 自动执行：

- ✅ 构建 5 平台独立二进制（Linux x64/arm64、macOS x64/arm64、Windows x64）
- ✅ 创建 GitHub Release 并上传二进制
- ✅ 发布到 npm
- ✅ 发布到 PyPI

### CI 所需 GitHub Secrets

在 `Settings → Secrets and variables → Actions` 中配置：

| Secret 名称 | 说明 |
|------------|------|
| `NPM_TOKEN` | npm Automation 类型 Token |
| `PYPI_TOKEN` | PyPI API Token |

### 本地开发

```bash
# Python 版本
cd rollinggo-uv-cli
uv run rollinggo-flight --help

# Node.js 版本
cd rollinggo-npm-cli
npm install
npm run build
node dist/cli.js --help
```
