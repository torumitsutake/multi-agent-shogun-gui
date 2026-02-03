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
 * 足軽名からashigaru IDを抽出
 * 例: "足軽1" -> "ashigaru1", "ashigaru3" -> "ashigaru3"
 */
function extractAshigaruId(workerName) {
    if (!workerName) return null;

    // 既にashigaru形式の場合
    const englishMatch = workerName.match(/ashigaru(\d+)/i);
    if (englishMatch) {
        return `ashigaru${englishMatch[1]}`;
    }

    // 日本語「足軽N」形式の場合
    const japaneseMatch = workerName.match(/足軽(\d+)/);
    if (japaneseMatch) {
        return `ashigaru${japaneseMatch[1]}`;
    }

    return null;
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
                    <th>担当</th>
                    <th>任務</th>
                    <th>戦場</th>
                    <th>状態</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                    // APIフィールド名: 担当, プロジェクト, 任務
                    const workerName = item['担当'] || item['足軽'] || item.worker || '-';
                    const taskName = item['任務'] || item['タスク'] || item.task || '-';
                    const projectName = item['プロジェクト'] || item['戦場'] || item.project || '-';
                    const statusText = item['状態'] || item.status || '戦闘中';
                    const ashigaruId = extractAshigaruId(workerName);
                    const dataAttr = ashigaruId ? `data-ashigaru-id="${ashigaruId}"` : '';
                    return `
                    <tr ${dataAttr} title="${ashigaruId ? 'クリックで詳細表示' : ''}">
                        <td>${escapeHtml(workerName)}</td>
                        <td>${escapeHtml(taskName)}</td>
                        <td>${escapeHtml(projectName)}</td>
                        <td><span class="badge badge-busy">${escapeHtml(statusText)}</span></td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = table;

    // クリックイベントを追加
    attachInProgressClickHandlers();
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

// ===== Modal Functions =====

let currentAshigaruId = null;

/**
 * モーダルを開く
 */
function openModal(ashigaruId) {
    currentAshigaruId = ashigaruId;
    const modal = document.getElementById('ashigaru-modal');
    const title = document.getElementById('modal-title');
    const output = document.getElementById('modal-output');

    // タイトルを設定
    const ashigaruNum = ashigaruId.replace('ashigaru', '');
    title.textContent = `足軽${ashigaruNum} 進行状況`;

    // ローディング状態
    output.textContent = '読込中...';
    output.classList.add('loading');
    output.classList.remove('error');

    // モーダルを表示
    modal.setAttribute('aria-hidden', 'false');

    // 足軽出力を取得
    fetchAshigaruOutput(ashigaruId);
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    const modal = document.getElementById('ashigaru-modal');
    modal.setAttribute('aria-hidden', 'true');
    currentAshigaruId = null;
}

/**
 * 足軽ペインの出力を取得
 */
async function fetchAshigaruOutput(ashigaruId) {
    const output = document.getElementById('modal-output');

    try {
        const response = await fetch(`/api/ashigaru/${ashigaruId}/output`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        output.classList.remove('loading');

        if (data.error) {
            output.textContent = `エラー: ${data.error}`;
            output.classList.add('error');
        } else if (!data.output || data.output.trim() === '') {
            output.textContent = '（出力なし）';
        } else {
            output.textContent = data.output;
            output.classList.remove('error');
            // 最下部にスクロール
            output.scrollTop = output.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to fetch ashigaru output:', error);
        output.classList.remove('loading');
        output.classList.add('error');
        output.textContent = `取得失敗: ${error.message}`;
    }
}

/**
 * 進行中テーブルにクリックイベントを追加
 */
function attachInProgressClickHandlers() {
    const rows = document.querySelectorAll('#in-progress tbody tr[data-ashigaru-id]');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const ashigaruId = row.getAttribute('data-ashigaru-id');
            if (ashigaruId) {
                openModal(ashigaruId);
            }
        });
    });
}

/**
 * モーダルイベントの初期化
 */
function initModalEvents() {
    const modal = document.getElementById('ashigaru-modal');

    // 閉じるボタン・オーバーレイのクリック
    modal.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });

    // 更新ボタン
    document.getElementById('modal-refresh').addEventListener('click', () => {
        if (currentAshigaruId) {
            const output = document.getElementById('modal-output');
            output.textContent = '更新中...';
            output.classList.add('loading');
            output.classList.remove('error');
            fetchAshigaruOutput(currentAshigaruId);
        }
    });
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

    // モーダルイベント初期化
    initModalEvents();
});
