# OpenCode Path Fixer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Chrome/Edge 扩展，修复 OpenCode 连接 Windows 服务器时的路径分隔符问题。适用于桌面和移动浏览器。

## 问题

OpenCode 服务端运行在 Windows 服务器上时，用户在浏览器（桌面或手机）中操作 OpenCode，路径信息会存储在浏览器的 localStorage 中。

Windows 本地路径格式为 `C:\Projects\MyApp`，存储到 localStorage 时 JSON 转义后变成 `C:\\Projects\\MyApp`。如果路径分隔符处理异常，可能存储为 `C:\\\\Projects\\\\MyApp`（过度转义），导致 OpenCode 解析路径后找不到对应的 session。

另一个常见问题是**盘符大小写不一致**：OpenCode 前端做路径匹配时区分大小写，服务端返回的目录通常是 `D:\Projects\MyApp`（大写盘符），而 localStorage 里可能存成 `d:\Projects\MyApp`（小写盘符）。两者在 Windows 上等价，但 OpenCode 会认为不匹配，导致该目录下的 session 不显示（接口能返回 session，界面却为空）。

## 场景

```
┌─────────────┐      HTTP       ┌─────────────────┐
│  手机/电脑   │  ──────────►   │  OpenCode Server │
│  浏览器      │  ◄──────────   │  (Windows)       │
│             │                 │                  │
│ localStorage│◄─ 存储Windows路径 ──│                  │
└─────────────┘                 └─────────────────┘
                                         │
                                         ▼
                              path-utils.js 修复路径格式
```

无论你用什么设备、什么浏览器访问 Windows 服务器上的 OpenCode，都可能遇到路径格式问题，都可以使用此扩展修复。

## 功能

- 扫描 `opencode.global.*` 开头所有 localStorage key
- 检测并修复所有异常路径格式（`a/b`、`a\b`、`a\\\\b` → `a\\b`）
- 盘符统一为大写（`d:\Projects\MyApp` → `D:\Projects\MyApp`），修复盘符大小写不一致导致 session 不显示的问题
- 显示修复清单，用户确认后生效
- 纯函数实现，便于单元测试

## 文件结构

```
opencode-path-fixer/
├── manifest.json    # Chrome 扩展配置
├── path-utils.js    # 核心纯函数（插件和测试共用）
├── content.js      # 插件逻辑（扫描、确认、修复 UI）
├── popup.html      # 扩展弹出页面（仅展示状态）
└── README.md       # 本文档
```

## 核心 API（path-utils.js）

```javascript
// 判断是否 Windows 路径
isWindowsPath(str) → boolean

// 判断内容是否跳过（非路径内容）
shouldSkip(content) → boolean

// 盘符统一大写（只改盘符，不动盘符之后的目录大小写）
// d:\Projects\MyApp → D:\Projects\MyApp
normalizeDriveLetter(path) → string

// 路径格式化：统一成大写盘符 + 双反斜杠格式
// a\b, a/b, a\\\\b → a\\b；d:\Projects → D:\Projects
normalizePath(path) → string

// 修复 JSON 中的所有路径
fixJsonPaths(jsonStr) → string

// 扫描 localStorage，返回待修复项
scanLocalStorage() → Array<{key, original, fixed}>

// 应用修复到 localStorage
applyFixes(fixes) → void
```

## 路径格式规则

| 输入格式 | 输出格式 | 说明 |
|---------|---------|------|
| `C:/Projects/MyApp` | `C:\\Projects\\MyApp` | 正斜杠转反斜杠 |
| `C:\Projects\MyApp` | `C:\\Projects\\MyApp` | 单反斜杠转双 |
| `C:\\Projects\\MyApp` | `C:\\Projects\\MyApp` | 双反斜杠（正确格式，不变）|
| `C:\\\\Projects\\\\MyApp` | `C:\\Projects\\MyApp` | 四反斜杠缩减为双 |
| `d:\Projects\MyApp` | `D:\Projects\MyApp` | 盘符统一为大写 |

## 更新记录

### v1.1.0
- 新增盘符大小写归一化：`d:\Projects\MyApp` → `D:\Projects\MyApp`
- 修复 localStorage 中小写盘符匹配不到服务端大写盘符目录、导致 session 不显示的问题
- 仅归一化盘符大小写，不改动盘符之后的目录大小写

### v1.0.1
- Apply 后自动刷新页面使修改生效
- 切换项目时（URL 变化）自动触发路径检查

### v1.0.0
- 初始版本

## 开发

### 单元测试

```bash
node path-utils.js
```

### 加载扩展

#### Chrome / Edge 桌面版

1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `opencode-path-fixer/` 目录

#### Edge Android (实验性)

1. 下载 Edge Canary 版本
2. 打开 `edge://flags`，搜索 "Android Extension" 或 "Extensions" 相关选项并启用
3. 重启浏览器
4. 通过 Edge Add-ons 商店安装，或在 `edge://extensions` 中通过 ID 安装

> 注：具体 flag 名称随版本变化，可能是 "Android Extension Search"、"Android Extensions v2" 等，以实际页面搜索结果为准。

### 配置

如需修改目标格式，可编辑 `path-utils.js` 中的 `normalizePath` 函数。
