# OpenCode Path Fixer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Chrome 扩展，自动修复 OpenCode 在 Windows 上的路径分隔符问题。

## 问题

Windows 本地路径格式为 `C:\Projects\MyApp`，存储到 localStorage 时 JSON 转义后变成 `C:\\Projects\\MyApp`。
但如果路径分隔符处理异常，localStorage 可能存储为 `C:\\\\Projects\\\\MyApp`（过度转义），
导致 OpenCode 解析路径后找不到对应的 session。

## 功能

- 扫描 `opencode.global.*` 开头所有 localStorage key
- 检测并修复所有异常路径格式（`a/b`、`a\b`、`a\\\\b` → `a\\b`）
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

// 路径格式化：统一成双反斜杠格式
// a\b, a/b, a\\\\b → a\\b
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

## 更新记录

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

1. 打开 Chrome `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `opencode-path-fixer/` 目录

### 配置

如需修改目标格式，可编辑 `path-utils.js` 中的 `normalizePath` 函数。
