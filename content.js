; (function() {
  'use strict';

  if (typeof window.PathFixer === 'undefined') {
    console.error('[Path Fixer] PathFixer not loaded');
    return;
  }

  const { fixJsonPaths, scanLocalStorage, applyFixes } = window.PathFixer;

  function showConfirmTip(fixes) {
    if (fixes.length === 0) return;

    const panel = document.createElement('div');
    panel.id = 'opencode-path-fixer-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 420px;
      max-height: 450px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background: #f59e0b;
      color: white;
      font-weight: 600;
      font-size: 13px;
    `;
    header.textContent = `Path Fixer: ${fixes.length} path(s) to fix`;
    panel.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = `
      padding: 12px 16px;
      overflow-y: auto;
      max-height: 280px;
      font-size: 11px;
      line-height: 1.6;
    `;

    fixes.slice(0, 5).forEach(fix => {
      const div = document.createElement('div');
      div.style.cssText = 'margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0';
      div.innerHTML = `
        <div style="color:#888;font-size:10px">${fix.key}</div>
        <div style="color:#dc2626;word-break:break-all;font-family:monospace">${fix.original.substring(0, 50)}...</div>
        <div style="color:#16a34a">→</div>
        <div style="color:#16a34a;word-break:break-all;font-family:monospace">${fix.fixed.substring(0, 50)}...</div>
      `;
      content.appendChild(div);
    });

    if (fixes.length > 5) {
      const more = document.createElement('div');
      more.style.cssText = 'color:#888;font-size:11px;text-align:center;padding:8px';
      more.textContent = `... and ${fixes.length - 5} more`;
      content.appendChild(more);
    }

    const actions = document.createElement('div');
    actions.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
    `;

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.style.cssText = `
      flex: 1;
      padding: 10px 16px;
      background: #22c55e;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    `;
    applyBtn.onclick = () => {
      applyFixes(fixes);
      panel.remove();
      showSuccessTip(fixes.length);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Skip';
    cancelBtn.style.cssText = `
      flex: 1;
      padding: 10px 16px;
      background: #f3f4f6;
      color: #666;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    `;
    cancelBtn.onclick = () => panel.remove();

    actions.appendChild(applyBtn);
    actions.appendChild(cancelBtn);

    panel.appendChild(header);
    panel.appendChild(content);
    panel.appendChild(actions);
    document.body.appendChild(panel);
  }

  function showSuccessTip(count) {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 13px;
      z-index: 999999;
    `;
    badge.textContent = `Fixed ${count} path(s)`;
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 4000);
  }

  function checkStorage() {
    console.log('[Path Fixer] Checking localStorage...');

    const fixes = scanLocalStorage();
    console.log(`[Path Fixer] Found ${fixes.length} key(s) to fix`);

    if (fixes.length > 0) {
      showConfirmTip(fixes);
    }
  }

  function init() {
    console.log('[Path Fixer] Loaded');
    if (!/Win(dows|NT)/i.test(navigator.userAgent) && !/Win(dows|NT)/i.test(navigator.platform)) {
      console.log('[Path Fixer] Not Windows, skipping');
      return;
    }
    setTimeout(checkStorage, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
