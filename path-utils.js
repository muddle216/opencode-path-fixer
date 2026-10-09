/**
 * Path Fixer - 独立纯函数实现
 * 无外部依赖，可直接运行
 */

// ============ 核心函数 ============

function isWindowsPath(str) {
  return /^[A-Za-z]:/.test(str) && (str.includes('\\') || str.includes('/'));
}

function shouldSkip(content) {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes('keybind') ||
         lower.includes('prompt') ||
         lower.includes('content');
}

// 盘符统一为大写：Windows 认为盘符大小写等价，但 opencode 前端匹配路径是大小写敏感的，
// 小写盘符（d:\proj\sg）匹配不到服务端返回的大写盘符目录（D:\proj\sg），会导致 session 不显示。
// 只改盘符，不影响盘符之后的目录大小写。
function normalizeDriveLetter(path) {
  if (!path || typeof path !== 'string') return path;
  if (/^[a-z]:/.test(path)) {
    return path[0].toUpperCase() + path.slice(1);
  }
  return path;
}

// 路径格式化：统一成大写盘符 + 双反斜杠格式
// a\b -> a\\b, a/b -> a\\b, a\\\\b -> a\\b, d:\p -> D:\p
function normalizePath(path) {
  if (!path || typeof path !== 'string') return path;
  if (!isWindowsPath(path)) return path;
  if (shouldSkip(path)) return path;

  // 第一步：盘符统一大写
  path = normalizeDriveLetter(path);

  // 第二步：正斜杠转成反斜杠
  if (path.includes('/')) {
    path = path.replace(/\//g, '\\\\');
  }

  // 第三步：超过2个反斜杠字符则缩减
  const bsCount = (path.match(/\\/g) || []).length;
  if (bsCount > 2) {
    return path.replace(/\\\\+/g, '\\\\');
  }

  return path;
}

// 修复 JSON 中的所有路径
function fixJsonPaths(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return jsonStr;

  let result = jsonStr;
  const matches = [];
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match;

  while ((match = regex.exec(jsonStr)) !== null) {
    matches.push({
      content: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const { content, start, end } = matches[i];
    if (shouldSkip(content)) continue;
    if (isWindowsPath(content)) {
      const normalized = normalizePath(content);
      if (normalized !== content) {
        result = result.substring(0, start) + '"' + normalized + '"' + result.substring(end);
      }
    }
  }

  return result;
}

// ============ localStorage 操作 ============

function scanLocalStorage() {
  const results = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('opencode.global.')) continue;

    const rawData = localStorage.getItem(key);
    if (!rawData) continue;

    const fixed = fixJsonPaths(rawData);
    if (fixed !== rawData) {
      results.push({ key, original: rawData, fixed });
    }
  }

  return results;
}

function applyFixes(fixes) {
  fixes.forEach(fix => {
    localStorage.setItem(fix.key, fix.fixed);
  });
}

// ============ 导出 ============

// Browser 导出
if (typeof window !== 'undefined') {
  window.PathFixer = {
    isWindowsPath,
    shouldSkip,
    normalizeDriveLetter,
    normalizePath,
    fixJsonPaths,
    scanLocalStorage,
    applyFixes
  };
}

// Node.js 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isWindowsPath,
    shouldSkip,
    normalizeDriveLetter,
    normalizePath,
    fixJsonPaths,
    scanLocalStorage,
    applyFixes
  };
}
