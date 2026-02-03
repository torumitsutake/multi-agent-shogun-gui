/**
 * multi-agent-shogun-gui フロントエンドロジック
 */

const API_ENDPOINT = '/api/dashboard';
const REFRESH_INTERVAL = 5000; // 5秒

let refreshTimer = null;
let cachedSkillCandidates = []; // スキル候補データをキャッシュ

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
 * 要対応セクションを更新（スキル候補バッジを含む）
 */
function renderActionRequired(items, skillCandidates) {
    const container = document.querySelector('#action-required .content');

    // スキル候補バッジを生成
    const pendingSkills = (skillCandidates || []).filter(s => s.status === '承認待ち');
    const skillBadgeHtml = pendingSkills.length > 0
        ? `<div class="skill-badge-container">
               <button class="skill-badge-button" id="skill-badge-btn">
                   <span class="skill-badge-icon">🔔</span>
                   <span class="skill-badge-text">スキル化候補 ${pendingSkills.length}件</span>
                   <span class="skill-badge-status">【承認待ち】</span>
               </button>
           </div>`
        : '';

    if ((!items || items.length === 0) && pendingSkills.length === 0) {
        container.innerHTML = '<div class="empty">なし</div>';
        return;
    }

    const actionItemsHtml = (items || []).map(item => `
        <div class="action-item">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.content)}</p>
        </div>
    `).join('');

    container.innerHTML = skillBadgeHtml + actionItemsHtml;

    // スキルバッジにクリックイベントを追加
    const skillBadgeBtn = document.getElementById('skill-badge-btn');
    if (skillBadgeBtn) {
        skillBadgeBtn.addEventListener('click', openSkillModal);
    }
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
 * スキル化候補をキャッシュに保存（パネルセクションは非表示に）
 */
function renderSkillCandidates(items) {
    // データをキャッシュ
    cachedSkillCandidates = items || [];

    // パネルセクションを非表示に
    const panel = document.getElementById('skill-candidates');
    if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * スキル候補モーダルの内容を生成
 */
function renderSkillModalContent(items) {
    if (!items || items.length === 0) {
        return '<div class="empty">スキル化候補はありません</div>';
    }

    const cards = items.map(item => {
        const status = item.status || '承認待ち';
        const isPending = status === '承認待ち';
        const description = item.description || '説明なし';
        const source = item.source || item.discovered_from || '不明';
        const generality = item.generality || '';

        return `
        <div class="skill-candidate-card ${isPending ? 'pending' : ''}">
            <div class="skill-card-header">
                <span class="skill-card-icon">📜</span>
                <h3 class="skill-card-name">${escapeHtml(item.name)}</h3>
                ${isPending ? '<span class="skill-pending-badge">🔔 承認待ち</span>' : ''}
            </div>
            <div class="skill-card-body">
                <p class="skill-card-description">${escapeHtml(description)}</p>
                <div class="skill-card-meta">
                    <span class="skill-card-source">📍 発見元: ${escapeHtml(source)}</span>
                    ${generality ? `<span class="skill-card-generality">📊 汎用性: ${escapeHtml(generality)}</span>` : ''}
                </div>
            </div>
            ${isPending ? `
            <div class="skill-card-actions">
                <span class="skill-action-hint">殿のご裁可をお待ち申し上げます</span>
            </div>
            ` : ''}
        </div>
        `;
    }).join('');

    return `<div class="skill-candidates-grid">${cards}</div>`;
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

    // スキル候補を先にキャッシュ
    renderSkillCandidates(data.skill_candidates);

    // 各セクションを更新（要対応にはスキル候補バッジを含める）
    renderActionRequired(data.action_required, data.skill_candidates);
    renderInProgress(data.in_progress);
    renderCompletedToday(data.completed_today);
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

    // モーダルのaria-hidden属性を初期設定（JS動的制御）
    document.getElementById('ashigaru-modal').setAttribute('aria-hidden', 'true');

    // コマンド入力初期化
    initCommandInput();

    // 将軍出力初期化
    initShogunOutput();

    // スキルモーダル初期化
    initSkillModal();
});

// ===== Command Input Functions =====

/**
 * 将軍への指示を送信
 */
async function sendCommand(command) {
    try {
        const response = await fetch('/api/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: command }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to send command:', error);
        return { success: false, error: error.message };
    }
}

/**
 * フィードバックを表示
 */
function showCommandFeedback(message, isSuccess) {
    const feedback = document.getElementById('command-feedback');
    feedback.textContent = message;
    feedback.className = 'command-feedback show ' + (isSuccess ? 'success' : 'error');

    // 5秒後にフィードバックを非表示
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 5000);
}

/**
 * コマンド入力を初期化
 */
function initCommandInput() {
    const textarea = document.getElementById('command-text');
    const submitBtn = document.getElementById('command-submit');

    if (!textarea || !submitBtn) return;

    // 送信ボタンクリック
    submitBtn.addEventListener('click', async () => {
        const command = textarea.value.trim();
        if (!command) {
            showCommandFeedback('ご命令をお書きください', false);
            return;
        }

        // ボタンを無効化
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="button-icon">⏳</span> 送信中...';

        const result = await sendCommand(command);

        // ボタンを復元
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="button-icon">⚔</span> 出陣！';

        if (result.success) {
            showCommandFeedback('ご下命を将軍にお伝えいたしました', true);
            textarea.value = '';
        } else {
            showCommandFeedback(`送信失敗: ${result.error || '不明なエラー'}`, false);
        }
    });

    // Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) で送信
    textarea.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            submitBtn.click();
        }
    });
}

// ===== Shogun Output Functions =====

let shogunRefreshTimer = null;
const SHOGUN_REFRESH_INTERVAL = 5000;

/**
 * 将軍ペインの出力を取得
 */
async function fetchShogunOutput() {
    const terminal = document.getElementById('shogun-terminal');

    try {
        const response = await fetch('/api/pane/shogun');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        terminal.classList.remove('loading');

        if (data.error) {
            terminal.textContent = `エラー: ${data.error}`;
            terminal.classList.add('error');
        } else if (!data.output || data.output.trim() === '') {
            terminal.textContent = '（出力なし）';
            terminal.classList.remove('error');
        } else {
            terminal.textContent = data.output;
            terminal.classList.remove('error');
            // 最下部にスクロール
            terminal.scrollTop = terminal.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to fetch shogun output:', error);
        terminal.classList.remove('loading');
        terminal.classList.add('error');
        terminal.textContent = `取得失敗: ${error.message}`;
    }
}

/**
 * 将軍出力の自動更新を制御
 */
function toggleShogunAutoRefresh(enabled) {
    if (enabled) {
        // 即座に1回取得
        fetchShogunOutput();
        // 定期更新開始
        shogunRefreshTimer = setInterval(fetchShogunOutput, SHOGUN_REFRESH_INTERVAL);
    } else {
        if (shogunRefreshTimer) {
            clearInterval(shogunRefreshTimer);
            shogunRefreshTimer = null;
        }
    }
}

/**
 * 将軍出力セクションを初期化
 */
function initShogunOutput() {
    const refreshBtn = document.getElementById('shogun-refresh');
    const autoRefreshCheckbox = document.getElementById('shogun-auto-refresh');
    const terminal = document.getElementById('shogun-terminal');

    if (!refreshBtn || !autoRefreshCheckbox || !terminal) return;

    // 初回読み込み
    terminal.classList.add('loading');
    fetchShogunOutput();

    // 手動更新ボタン
    refreshBtn.addEventListener('click', () => {
        terminal.classList.add('loading');
        terminal.textContent = '更新中...';
        fetchShogunOutput();
    });

    // 自動更新チェックボックス
    autoRefreshCheckbox.addEventListener('change', (e) => {
        toggleShogunAutoRefresh(e.target.checked);
    });

    // 自動更新を開始
    if (autoRefreshCheckbox.checked) {
        toggleShogunAutoRefresh(true);
    }
}

// ===== Skill Modal Functions =====

/**
 * スキルモーダルを開く
 */
function openSkillModal() {
    const modal = document.getElementById('skill-modal');
    const content = document.getElementById('skill-modal-content');

    // モーダル内容を更新
    content.innerHTML = renderSkillModalContent(cachedSkillCandidates);

    // モーダルを表示
    modal.setAttribute('aria-hidden', 'false');
}

/**
 * スキルモーダルを閉じる
 */
function closeSkillModal() {
    const modal = document.getElementById('skill-modal');
    modal.setAttribute('aria-hidden', 'true');
}

/**
 * スキルモーダルイベントの初期化
 */
function initSkillModal() {
    const modal = document.getElementById('skill-modal');
    if (!modal) return;

    // 閉じるボタン・オーバーレイのクリック
    modal.querySelectorAll('[data-close-skill-modal]').forEach(el => {
        el.addEventListener('click', closeSkillModal);
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeSkillModal();
        }
    });

    // aria-hidden を初期設定
    modal.setAttribute('aria-hidden', 'true');
}
