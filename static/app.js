/**
 * multi-agent-shogun-gui フロントエンドロジック
 */

const API_ENDPOINT = '/api/dashboard';
const REFRESH_INTERVAL = 5000; // 5秒

let refreshTimer = null;

/**
 * ダッシュボードデータを取得
 */
async function fetchDashboard() {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        return null;
    }
}

/**
 * 要対応セクションを更新
 */
function renderActionRequired(items) {
    const container = document.querySelector('#action-required .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="action-item">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.content)}</p>
        </div>
    `).join('');
}

/**
 * 進行中セクションを更新
 */
function renderInProgress(items) {
    const container = document.querySelector('#in-progress .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>足軽</th>
                    <th>タスク</th>
                    <th>戦場</th>
                    <th>状態</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${escapeHtml(item['足軽'] || item.worker || '-')}</td>
                        <td>${escapeHtml(item['タスク'] || item.task || '-')}</td>
                        <td>${escapeHtml(item['戦場'] || item.project || '-')}</td>
                        <td><span class="badge badge-busy">${escapeHtml(item['状態'] || item.status || '-')}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = table;
}

/**
 * 本日の戦果セクションを更新
 */
function renderCompletedToday(items) {
    const container = document.querySelector('#completed-today .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>時刻</th>
                    <th>戦場</th>
                    <th>任務</th>
                    <th>結果</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${escapeHtml(item['時刻'] || item.time || '-')}</td>
                        <td>${escapeHtml(item['戦場'] || item.project || '-')}</td>
                        <td>${escapeHtml(item['任務'] || item.task || '-')}</td>
                        <td><span class="badge badge-success">${escapeHtml(item['結果'] || item.result || '-')}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = table;
}

/**
 * スキル化候補セクションを更新
 */
function renderSkillCandidates(items) {
    const container = document.querySelector('#skill-candidates .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="skill-card">
            <h3>${escapeHtml(item.name)}</h3>
            <div class="meta">${escapeHtml(item.status || '承認待ち')}</div>
        </div>
    `).join('');
}

/**
 * 生成されたスキルセクションを更新
 */
function renderGeneratedSkills(items) {
    const container = document.querySelector('#generated-skills .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="skill-card">
            <h3>${escapeHtml(item.name)}</h3>
            <div class="description">${escapeHtml(item.description || '')}</div>
            <div class="meta">
                ${item.languages ? `対応言語: ${escapeHtml(item.languages)}` : ''}
                ${item.created_at ? ` | 生成日: ${escapeHtml(item.created_at)}` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * 待機中セクションを更新
 */
function renderWaiting(items) {
    const container = document.querySelector('#waiting .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    container.innerHTML = `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/**
 * 伺い事項セクションを更新
 */
function renderInquiries(items) {
    const container = document.querySelector('#inquiries .content');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    container.innerHTML = `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * ダッシュボード全体を更新
 */
async function updateDashboard() {
    const data = await fetchDashboard();
    if (!data) return;

    if (data.error) {
        console.error('Dashboard error:', data.error);
        return;
    }

    // 最終更新時刻
    document.getElementById('last-updated').textContent = data.last_updated || '-';

    // 各セクションを更新
    renderActionRequired(data.action_required);
    renderInProgress(data.in_progress);
    renderCompletedToday(data.completed_today);
    renderSkillCandidates(data.skill_candidates);
    renderGeneratedSkills(data.generated_skills);
    renderWaiting(data.waiting);
    renderInquiries(data.inquiries);
}

/**
 * 自動更新の開始/停止
 */
function toggleAutoRefresh(enabled) {
    if (enabled) {
        refreshTimer = setInterval(updateDashboard, REFRESH_INTERVAL);
    } else {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }
}

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初回データ取得
    updateDashboard();

    // 自動更新チェックボックス
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    autoRefreshCheckbox.addEventListener('change', (e) => {
        toggleAutoRefresh(e.target.checked);
    });

    // 自動更新を開始
    if (autoRefreshCheckbox.checked) {
        toggleAutoRefresh(true);
    }
});
