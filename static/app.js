/**
 * multi-agent-shogun-gui フロントエンドロジック
 */

const API_ENDPOINT = '/api/dashboard';
const REFRESH_INTERVAL = 5000; // 5秒

let refreshTimer = null;
let cachedSkillCandidates = []; // スキル候補データをキャッシュ
let karoRefreshTimer = null;
const KARO_REFRESH_INTERVAL = 5000;

// 通知用の前回カウント
let prevActionRequiredCount = null;
let prevCompletedTodayCount = null;
let notificationsEnabled = false;

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
 * 簡易Markdownレンダリング
 */
function renderSimpleMarkdown(text) {
    if (!text) return '';
    // まずXSS対策でエスケープ
    let escaped = escapeHtml(text);
    // **太字** → <strong>
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // テーブル処理
    const lines = escaped.split('\n');
    let result = [];
    let inTable = false;
    let isFirstRow = true;

    for (const line of lines) {
        const trimmed = line.trim();
        // テーブル行の検出
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            // セパレータ行（|---|---|）をスキップ
            if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;

            const cells = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
            if (!inTable) {
                result.push('<table class="md-table">');
                inTable = true;
                isFirstRow = true;
            }
            if (isFirstRow) {
                result.push('<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>');
                isFirstRow = false;
            } else {
                result.push('<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>');
            }
        } else {
            if (inTable) {
                result.push('</tbody></table>');
                inTable = false;
            }
            // 空行はスキップ、それ以外は<br>付きで追加
            if (trimmed) {
                result.push(trimmed + '<br>');
            }
        }
    }
    if (inTable) result.push('</tbody></table>');
    return result.join('\n');
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
                   <span class="skill-badge-text">${t('skill.badge')} ${t('skill.badgeCount').replace('{N}', pendingSkills.length)}</span>
                   <span class="skill-badge-status">${t('skill.badgeStatus')}</span>
               </button>
           </div>`
        : '';

    if ((!items || items.length === 0) && pendingSkills.length === 0) {
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
        return;
    }

    const actionItemsHtml = (items || []).map((item, index) => `
        <div class="action-item">
            <div class="action-item-header">
                <h3>${escapeHtml(item.title)}</h3>
                <button class="btn-action-delete" data-title="${escapeHtml(item.title)}" data-index="${index}"
                        title="${t('action.deleteTitle')}">🗑</button>
            </div>
            <div class="action-content">${renderSimpleMarkdown(item.content)}</div>
        </div>
    `).join('');

    container.innerHTML = skillBadgeHtml + actionItemsHtml;

    // スキルバッジにクリックイベントを追加
    const skillBadgeBtn = document.getElementById('skill-badge-btn');
    if (skillBadgeBtn) {
        skillBadgeBtn.addEventListener('click', openSkillModal);
    }

    // 削除ボタンのイベントリスナー
    container.querySelectorAll('.btn-action-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.getAttribute('data-title');
            handleActionDelete(title, btn);
        });
    });
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
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>${t('table.worker')}</th>
                    <th>${t('table.task')}</th>
                    <th>${t('table.project')}</th>
                    <th>${t('table.status')}</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                    // APIフィールド名: 担当, プロジェクト, 任務
                    const workerName = item['担当'] || item['足軽'] || item.worker || '-';
                    const taskName = item['任務'] || item['タスク'] || item.task || '-';
                    const projectName = item['プロジェクト'] || item['戦場'] || item.project || '-';
                    const statusText = item['状態'] || item.status || t('table.defaultStatus');
                    const ashigaruId = extractAshigaruId(workerName);
                    const dataAttr = ashigaruId ? `data-ashigaru-id="${ashigaruId}"` : '';
                    return `
                    <tr ${dataAttr} title="${ashigaruId ? t('table.clickDetail') : ''}">
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
    const container = document.querySelector('#completed-today-content');

    // 件数バッジを更新
    const countBadge = document.getElementById('completed-today-count');
    if (countBadge) {
        const count = items ? items.length : 0;
        countBadge.textContent = count > 0 ? t('completed.count').replace('{N}', count) : '';
    }

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>${t('table.id')}</th>
                    <th>${t('table.project')}</th>
                    <th>${t('table.task')}</th>
                    <th>${t('table.result')}</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${escapeHtml(item['ID'] || item.id || '-')}</td>
                        <td>${escapeHtml(item['プロジェクト'] || item.project || '-')}</td>
                        <td>${escapeHtml(item['タスク'] || item.task || '-')}</td>
                        <td><span class="badge badge-success">${escapeHtml(item['結果'] || item.result || '-')}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = table;
}

/**
 * スキル化候補をキャッシュに保存（パネルセクションは折りたたみ）
 */
function renderSkillCandidates(items) {
    // データをキャッシュ
    cachedSkillCandidates = items || [];

    // パネルセクションを折りたたみで非表示に
    const panel = document.getElementById('skill-candidates');
    if (panel) {
        panel.classList.add('collapsed');
        var header = panel.querySelector('.collapsible-header');
        if (header) header.setAttribute('aria-expanded', 'false');
    }
}

/**
 * スキル候補モーダルの内容を生成
 */
function renderSkillModalContent(items) {
    if (!items || items.length === 0) {
        return '<div class="empty">' + t('skill.empty') + '</div>';
    }

    const cards = items.map(item => {
        const status = item.status || '承認待ち';
        const isPending = status === '承認待ち';
        const description = item.description || t('skill.noDescription');
        const source = item.source || item.discovered_from || t('skill.unknownSource');
        const generality = item.generality || '';

        return `
        <div class="skill-candidate-card ${isPending ? 'pending' : ''}">
            <div class="skill-card-header">
                <span class="skill-card-icon">📜</span>
                <h3 class="skill-card-name">${escapeHtml(item.name)}</h3>
                ${isPending ? '<span class="skill-pending-badge">' + t('skill.pendingBadge') + '</span>' : ''}
            </div>
            <div class="skill-card-body">
                <p class="skill-card-description">${escapeHtml(description)}</p>
                <div class="skill-card-meta">
                    <span class="skill-card-source">📍 ${t('skill.source')} ${escapeHtml(source)}</span>
                    ${generality ? `<span class="skill-card-generality">📊 ${t('skill.generality')} ${escapeHtml(generality)}</span>` : ''}
                </div>
            </div>
            ${isPending ? `
            <div class="skill-card-actions" id="skill-btns-${escapeHtml(item.name)}">
                <button class="btn-approve btn-approve-skill" data-skill-name="${escapeHtml(item.name)}">
                    ✅ ${t('skill.approve')}
                </button>
                <button class="btn-reject btn-reject-skill" data-skill-name="${escapeHtml(item.name)}">
                    ❌ ${t('skill.reject')}
                </button>
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
    const section = document.getElementById('generated-skills');
    const isEmpty = !items || items.length === 0;

    if (isEmpty) {
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
        if (section) {
            section.classList.add('collapsed');
            var h = section.querySelector('.collapsible-header');
            if (h) h.setAttribute('aria-expanded', 'false');
        }
        return;
    }

    // 有内容時は展開
    if (section) {
        section.classList.remove('collapsed');
        var h = section.querySelector('.collapsible-header');
        if (h) h.setAttribute('aria-expanded', 'true');
    }

    container.innerHTML = items.map(item => `
        <div class="skill-card">
            <h3>${escapeHtml(item.name)}</h3>
            <div class="description">${escapeHtml(item.description || '')}</div>
            <div class="meta">
                ${item.languages ? `${t('skill.supportedLangs')} ${escapeHtml(item.languages)}` : ''}
                ${item.created_at ? ` | ${t('skill.createdAt')} ${escapeHtml(item.created_at)}` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * 待機中セクションを更新
 */
function renderWaiting(items) {
    const container = document.querySelector('#waiting .content');
    const section = document.getElementById('waiting');
    const isEmpty = !items || items.length === 0;

    if (isEmpty) {
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
        if (section) {
            section.classList.add('collapsed');
            var h = section.querySelector('.collapsible-header');
            if (h) h.setAttribute('aria-expanded', 'false');
        }
        return;
    }

    if (section) {
        section.classList.remove('collapsed');
        var h = section.querySelector('.collapsible-header');
        if (h) h.setAttribute('aria-expanded', 'true');
    }

    container.innerHTML = `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/**
 * 伺い事項セクションを更新
 */
function renderInquiries(items) {
    const container = document.querySelector('#inquiries .content');
    const section = document.getElementById('inquiries');
    const isEmpty = !items || items.length === 0;

    if (isEmpty) {
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
        if (section) {
            section.classList.add('collapsed');
            var h = section.querySelector('.collapsible-header');
            if (h) h.setAttribute('aria-expanded', 'false');
        }
        return;
    }

    if (section) {
        section.classList.remove('collapsed');
        var h = section.querySelector('.collapsible-header');
        if (h) h.setAttribute('aria-expanded', 'true');
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

    // 足軽ステータスバーを更新
    fetchAshigaruStatus();

    // ブラウザ通知チェック
    checkAndNotify(data);
}

/**
 * 足軽ステータスバーを更新
 */
async function fetchAshigaruStatus() {
    const container = document.getElementById('ashigaru-status-bar');
    if (!container) return;

    try {
        const response = await fetch('/api/pane/ashigaru/status');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const statuses = data.statuses || [];

        // 足軽アイコンを生成
        const iconsHtml = statuses.map(ash => {
            const statusClass = ash.status === 'busy' ? 'ashigaru-busy' :
                               ash.status === 'idle' ? 'ashigaru-idle' : 'ashigaru-unknown';
            const statusText = ash.status === 'busy' ? t('ashigaru.busy') :
                              ash.status === 'idle' ? t('ashigaru.idle') : t('ashigaru.unknown');
            const title = `${t('modal.ashigaruTitle').replace('{N}', ash.num)} - ${statusText}`;

            return `
                <div class="ashigaru-icon ${statusClass}" onclick="openModal('${ash.id}')" title="${escapeHtml(title)}">
                    <span class="ashigaru-num">${ash.num}</span>
                    <span class="ashigaru-status-dot"></span>
                </div>
            `;
        }).join('');

        container.innerHTML = iconsHtml;
    } catch (error) {
        console.error('Failed to fetch ashigaru status:', error);
        container.innerHTML = '<div class="empty">' + t('empty.none') + '</div>';
    }
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
    title.textContent = t('modal.ashigaruTitle').replace('{N}', ashigaruNum);

    // ローディング状態
    output.textContent = t('modal.loading');
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
            output.textContent = `${t('modal.error')} ${data.error}`;
            output.classList.add('error');
        } else if (!data.output || data.output.trim() === '') {
            output.textContent = t('modal.noOutput');
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
        output.textContent = `${t('modal.fetchFailed')} ${error.message}`;
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
            output.textContent = t('modal.updating');
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

    // 家老出力初期化
    initKaroOutput();

    // スキルモーダル初期化
    initSkillModal();

    // 本日の戦果折りたたみ初期化
    initCompletedCollapse();

    // 汎用折りたたみセクション初期化
    initCollapsibleSections();

    // コマンド履歴初期化
    initCommandHistory();

    // ブラウザ通知初期化
    initNotifications();
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

// ===== Approval Functions =====

/**
 * 承認ボタン押下時の処理
 */
async function handleApproval(title, btnContainer) {
    const result = await sendCommand(`${title}を承認する`);
    if (result.success) {
        btnContainer.innerHTML = '<span class="btn-sent btn-sent-approved">✅ ' + t('skill.approved') + '</span>';
    } else {
        btnContainer.innerHTML += `<span class="btn-sent-error">${t('skill.sendFailed')} ${escapeHtml(result.error || t('skill.unknownSource'))}</span>`;
    }
}

/**
 * 否認ボタン押下時の処理
 */
async function handleRejection(title, btnContainer) {
    // 理由入力欄を表示
    const existingInput = btnContainer.querySelector('.reject-reason-container');
    if (existingInput) {
        // 既に表示中なら送信実行
        const reasonInput = existingInput.querySelector('.reject-reason-input');
        const reason = reasonInput.value.trim();
        const message = reason
            ? `${title}を否認する。理由: ${reason}`
            : `${title}を否認する`;
        const result = await sendCommand(message);
        if (result.success) {
            btnContainer.innerHTML = '<span class="btn-sent btn-sent-rejected">❌ ' + t('skill.rejected') + '</span>';
        } else {
            btnContainer.innerHTML += `<span class="btn-sent-error">${t('skill.sendFailed')} ${escapeHtml(result.error || t('skill.unknownSource'))}</span>`;
        }
        return;
    }

    // 理由入力欄を追加
    const reasonContainer = document.createElement('div');
    reasonContainer.className = 'reject-reason-container';
    reasonContainer.innerHTML = `
        <input type="text" class="reject-reason-input" placeholder="${t('skill.rejectReason')}" />
        <button class="btn-reject-confirm">${t('skill.rejectConfirm')}</button>
    `;
    btnContainer.appendChild(reasonContainer);

    // 送信ボタンのイベント
    reasonContainer.querySelector('.btn-reject-confirm').addEventListener('click', () => {
        handleRejection(title, btnContainer);
    });

    // Enter キーで送信
    reasonContainer.querySelector('.reject-reason-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleRejection(title, btnContainer);
        }
    });

    // 入力欄にフォーカス
    reasonContainer.querySelector('.reject-reason-input').focus();
}

/**
 * 要対応項目の削除ボタン押下時の処理
 */
async function handleActionDelete(title, btn) {
    if (!confirm(t('action.deleteConfirm'))) {
        return;
    }
    btn.disabled = true;
    btn.textContent = t('action.sending');
    const result = await sendCommand(`要対応の「${title}」を削除せよ`);
    if (result.success) {
        btn.textContent = t('action.sent');
        btn.classList.add('btn-delete-sent');
    } else {
        btn.textContent = t('action.failed');
        btn.classList.add('btn-delete-error');
        btn.disabled = false;
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
            showCommandFeedback(t('command.emptyWarning'), false);
            return;
        }

        // ボタンを無効化
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="button-icon">⏳</span> ' + t('command.sending');

        const result = await sendCommand(command);

        // ボタンを復元
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="button-icon">⚔</span> ' + t('command.submit');

        if (result.success) {
            showCommandFeedback(t('command.success'), true);
            saveCommandHistory(command);
            renderCommandHistory();
            textarea.value = '';
        } else {
            showCommandFeedback(`${t('command.failure')} ${result.error || t('skill.unknownSource')}`, false);
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
            terminal.textContent = `${t('shogun.error')} ${data.error}`;
            terminal.classList.add('error');
        } else if (!data.output || data.output.trim() === '') {
            terminal.textContent = t('shogun.noOutput');
            terminal.classList.remove('error');
        } else {
            // 行ごとに分割してハイライト処理
            const lines = data.output.split('\n');
            const htmlLines = lines.map(line => {
                // 行が「❯ 」で始まる場合、コマンドラインとしてハイライト
                if (line.startsWith('❯ ')) {
                    return `<span class="command-line">${escapeHtml(line)}</span>`;
                }
                return escapeHtml(line);
            });
            terminal.innerHTML = htmlLines.join('<br>');
            terminal.classList.remove('error');
            // 最下部にスクロール
            terminal.scrollTop = terminal.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to fetch shogun output:', error);
        terminal.classList.remove('loading');
        terminal.classList.add('error');
        terminal.textContent = `${t('shogun.fetchFailed')} ${error.message}`;
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
        terminal.textContent = t('shogun.updating');
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

// ===== Karo Output Functions =====

async function fetchKaroOutput() {
    const terminal = document.getElementById('karo-terminal');
    const badge = document.getElementById('karo-status-badge');
    const statusText = document.getElementById('karo-status-text');

    try {
        const response = await fetch('/api/pane/karo');
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        // バッジのステータス更新
        if (data.status === 'busy') {
            badge.className = 'karo-badge badge-busy';
            statusText.textContent = t('karo.busy');
        } else {
            badge.className = 'karo-badge badge-idle';
            statusText.textContent = t('karo.idle');
        }

        // ターミナル出力更新
        if (terminal) {
            terminal.classList.remove('loading');
            if (data.error) {
                terminal.textContent = `${t('karo.error')} ${data.error}`;
                terminal.classList.add('error');
            } else if (!data.output || data.output.trim() === '') {
                terminal.textContent = t('karo.noOutput');
            } else {
                // 将軍と同じハイライト処理
                const lines = data.output.split('\n');
                const htmlLines = lines.map(line => {
                    if (line.startsWith('❯ ')) {
                        return `<span class="command-line">${escapeHtml(line)}</span>`;
                    }
                    return escapeHtml(line);
                });
                terminal.innerHTML = htmlLines.join('<br>');
                terminal.classList.remove('error');
                terminal.scrollTop = terminal.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Failed to fetch karo output:', error);
        if (badge) {
            badge.className = 'karo-badge badge-idle';
            statusText.textContent = t('karo.fetchFailed');
        }
    }
}

function toggleKaroCollapse() {
    const collapse = document.getElementById('karo-output-collapse');
    const expanded = collapse.getAttribute('aria-expanded') === 'true';
    collapse.setAttribute('aria-expanded', !expanded);
    if (!expanded) {
        // 開く時に最新データを取得
        fetchKaroOutput();
    }
}

function initKaroOutput() {
    const badge = document.getElementById('karo-status-badge');
    const closeBtn = document.getElementById('karo-collapse-close');

    if (!badge) return;

    // バッジクリックでトグル
    badge.addEventListener('click', toggleKaroCollapse);

    // 閉じるボタン
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleKaroCollapse);
    }

    // 初回取得（バッジステータスのみ更新）
    fetchKaroOutput();

    // 定期更新開始
    karoRefreshTimer = setInterval(fetchKaroOutput, KARO_REFRESH_INTERVAL);
}

// ===== Completed Today Collapse Functions =====

/**
 * 本日の戦果セクションの折りたたみトグル
 */
function toggleCompletedCollapse() {
    const section = document.getElementById('completed-today');
    const header = document.getElementById('completed-today-header');
    const isCollapsed = section.classList.contains('collapsed');

    if (isCollapsed) {
        section.classList.remove('collapsed');
        header.setAttribute('aria-expanded', 'true');
    } else {
        section.classList.add('collapsed');
        header.setAttribute('aria-expanded', 'false');
    }

    // localStorage に保存
    try {
        localStorage.setItem('shogun-gui-completed-collapsed', section.classList.contains('collapsed'));
    } catch (e) { /* localStorage unavailable */ }
}

/**
 * 本日の戦果セクションの折りたたみ初期化
 */
function initCompletedCollapse() {
    const header = document.getElementById('completed-today-header');
    const section = document.getElementById('completed-today');
    if (!header || !section) return;

    // localStorage から状態を復元（デフォルトは折りたたみ）
    let collapsed = true;
    try {
        const saved = localStorage.getItem('shogun-gui-completed-collapsed');
        collapsed = saved === null ? true : saved === 'true';
    } catch (e) { /* localStorage unavailable */ }

    if (collapsed) {
        section.classList.add('collapsed');
        header.setAttribute('aria-expanded', 'false');
    } else {
        section.classList.remove('collapsed');
        header.setAttribute('aria-expanded', 'true');
    }

    // クリックイベント
    header.addEventListener('click', toggleCompletedCollapse);
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

    // スキル候補の承認/否認イベント
    content.querySelectorAll('.btn-approve-skill').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-skill-name');
            const btnContainer = document.getElementById(`skill-btns-${name}`);
            handleApproval(`スキル化候補「${name}」`, btnContainer);
        });
    });
    content.querySelectorAll('.btn-reject-skill').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-skill-name');
            const btnContainer = document.getElementById(`skill-btns-${name}`);
            handleRejection(`スキル化候補「${name}」`, btnContainer);
        });
    });

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

// ===== Collapsible Sections =====

/**
 * 汎用折りたたみセクションの初期化
 */
function initCollapsibleSections() {
    document.querySelectorAll('.collapsible-header').forEach(function(header) {
        header.addEventListener('click', function() {
            var section = header.closest('.collapsible-section');
            if (!section) return;
            var isCollapsed = section.classList.contains('collapsed');
            if (isCollapsed) {
                section.classList.remove('collapsed');
                header.setAttribute('aria-expanded', 'true');
            } else {
                section.classList.add('collapsed');
                header.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// ===== Command History Functions =====

/**
 * コマンド履歴をlocalStorageに保存
 */
function saveCommandHistory(text) {
    try {
        var history = JSON.parse(localStorage.getItem('shogun-gui-command-history') || '[]');
        history.unshift({ text: text, timestamp: Date.now() });
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        localStorage.setItem('shogun-gui-command-history', JSON.stringify(history));
    } catch (e) { /* localStorage unavailable */ }
}

/**
 * 相対時間を計算
 */
function getRelativeTime(timestamp) {
    var diff = Date.now() - timestamp;
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (minutes < 1) return t('command.justNow');
    if (hours < 1) return t('command.minutesAgo').replace('{N}', minutes);
    if (days < 1) return t('command.hoursAgo').replace('{N}', hours);
    return t('command.daysAgo').replace('{N}', days);
}

/**
 * コマンド履歴をレンダリング
 */
function renderCommandHistory() {
    var list = document.getElementById('command-history-list');
    if (!list) return;

    var history = [];
    try {
        history = JSON.parse(localStorage.getItem('shogun-gui-command-history') || '[]');
    } catch (e) { /* localStorage unavailable */ }

    if (history.length === 0) {
        list.innerHTML = '<div class="command-history-empty">' + t('command.historyEmpty') + '</div>';
        return;
    }

    list.innerHTML = history.map(function(item) {
        return '<div class="command-history-item" data-text="' + escapeHtml(item.text) + '">' +
            '<span class="command-history-text">' + escapeHtml(item.text) + '</span>' +
            '<span class="command-history-time">' + getRelativeTime(item.timestamp) + '</span>' +
            '</div>';
    }).join('');

    // クリックで入力欄に再入力
    list.querySelectorAll('.command-history-item').forEach(function(el) {
        el.addEventListener('click', function() {
            var textarea = document.getElementById('command-text');
            if (textarea) {
                textarea.value = el.getAttribute('data-text');
                textarea.focus();
            }
        });
    });
}

/**
 * コマンド履歴を初期化
 */
function initCommandHistory() {
    var wrapper = document.getElementById('command-history-wrapper');
    var header = document.getElementById('command-history-header');
    if (!wrapper || !header) return;

    // 初回レンダリング
    renderCommandHistory();

    // トグル
    header.addEventListener('click', function() {
        wrapper.classList.toggle('collapsed');
    });
}

// ===== Browser Notification Functions =====

/**
 * ブラウザ通知を初期化
 */
function initNotifications() {
    var btn = document.getElementById('notification-toggle');
    if (!btn) return;

    // localStorageから設定復元
    try {
        notificationsEnabled = localStorage.getItem('shogun-gui-notifications-enabled') === 'true';
    } catch (e) { /* localStorage unavailable */ }

    updateNotificationButton();

    btn.addEventListener('click', toggleNotifications);
}

/**
 * 通知ボタンの見た目を更新
 */
function updateNotificationButton() {
    var btn = document.getElementById('notification-toggle');
    if (!btn) return;
    if (notificationsEnabled) {
        btn.textContent = '🔔';
        btn.classList.add('active');
        btn.classList.remove('inactive');
    } else {
        btn.textContent = '🔕';
        btn.classList.remove('active');
        btn.classList.add('inactive');
    }
}

/**
 * 通知ON/OFFトグル
 */
async function toggleNotifications() {
    if (!notificationsEnabled) {
        // OFF→ON: パーミッション要求
        if (!('Notification' in window)) return;
        var permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
        }
    } else {
        notificationsEnabled = false;
    }

    try {
        localStorage.setItem('shogun-gui-notifications-enabled', notificationsEnabled);
    } catch (e) { /* localStorage unavailable */ }

    updateNotificationButton();
}

/**
 * データ変化をチェックして通知
 */
function checkAndNotify(data) {
    if (!data) return;

    var actionCount = (data.action_required || []).length;
    var completedCount = (data.completed_today || []).length;

    // 初回は初期化のみ（通知しない）
    if (prevActionRequiredCount === null) {
        prevActionRequiredCount = actionCount;
        prevCompletedTodayCount = completedCount;
        return;
    }

    if (notificationsEnabled) {
        if (actionCount > prevActionRequiredCount) {
            sendBrowserNotification(t('notification.title'), t('notification.actionRequired'));
        }
        if (completedCount > prevCompletedTodayCount) {
            sendBrowserNotification(t('notification.title'), t('notification.taskCompleted'));
        }
    }

    prevActionRequiredCount = actionCount;
    prevCompletedTodayCount = completedCount;
}

/**
 * ブラウザ通知を送信
 */
function sendBrowserNotification(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!document.hidden) return; // タブがアクティブなら通知しない

    var notification = new Notification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚔</text></svg>'
    });

    notification.onclick = function() {
        window.focus();
        notification.close();
    };
}
