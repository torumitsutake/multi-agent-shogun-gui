/*
 * multi-agent-shogun-gui 国際化 (i18n) モジュール
 * Phase 1: 翻訳辞書 + ユーティリティ関数
 */

(function () {
    'use strict';

    var translations = {
        ja: {
            'page.title': '戦況報告 - multi-agent-shogun',
            'page.description': 'multi-agent-shogun 戦況ダッシュボード',

            'header.title': '戦況報告',
            'header.lastUpdated': '最終更新:',
            'header.autoRefresh': '自動更新 (5秒)',

            'command.title': '上様へのご下命',
            'command.placeholder': 'ご命令をお書きください...',
            'command.submit': '出陣！',
            'command.sending': '送信中...',
            'command.emptyWarning': 'ご命令をお書きください',
            'command.success': 'ご下命を将軍にお伝えいたしました',
            'command.failure': '送信失敗:',

            'shogun.title': '将軍 進行状況',
            'shogun.refresh': '更新',
            'shogun.autoRefresh': '自動更新',
            'shogun.loading': '読込中...',
            'shogun.updating': '更新中...',
            'shogun.error': 'エラー:',
            'shogun.noOutput': '（出力なし）',
            'shogun.fetchFailed': '取得失敗:',

            'karo.label': '家老:',
            'karo.busy': '処理中',
            'karo.idle': '待機中',
            'karo.title': '家老 進行状況',
            'karo.close': '▲ 閉じる',
            'karo.loading': '読込中...',
            'karo.badgeTitle': 'クリックで家老ターミナル表示/非表示',
            'karo.error': 'エラー:',
            'karo.noOutput': '（出力なし）',
            'karo.fetchFailed': '取得失敗',

            'section.actionRequired': '要対応',
            'section.inProgress': '進行中',
            'section.completedToday': '本日の戦果',
            'section.skillCandidates': 'スキル化候補',
            'section.generatedSkills': '生成されたスキル',
            'section.waiting': '待機中',
            'section.inquiries': '伺い事項',

            'empty.none': 'なし',
            'empty.cssContent': '無',

            'table.worker': '担当',
            'table.task': '任務',
            'table.project': '戦場',
            'table.status': '状態',
            'table.defaultStatus': '戦闘中',
            'table.clickDetail': 'クリックで詳細表示',
            'table.time': '時刻',
            'table.result': '結果',

            'modal.ashigaruTitle': '足軽{N} 進行状況',
            'modal.loading': '読込中...',
            'modal.updating': '更新中...',
            'modal.refresh': '更新',
            'modal.close': '閉じる',
            'modal.error': 'エラー:',
            'modal.noOutput': '（出力なし）',
            'modal.fetchFailed': '取得失敗:',

            'skill.badge': 'スキル化候補',
            'skill.badgeCount': '{N}件',
            'skill.badgeStatus': '【承認待ち】',
            'skill.modalTitle': 'スキル化候補一覧',
            'skill.empty': 'スキル化候補はありません',
            'skill.noDescription': '説明なし',
            'skill.unknownSource': '不明',
            'skill.pendingBadge': '🔔 承認待ち',
            'skill.source': '発見元:',
            'skill.generality': '汎用性:',
            'skill.approve': '承認',
            'skill.reject': '否認',
            'skill.approved': '承認済み',
            'skill.rejected': '否認済み',
            'skill.sendFailed': '送信失敗:',
            'skill.rejectReason': '否認理由（省略可）',
            'skill.rejectConfirm': '否認を送信',
            'skill.supportedLangs': '対応言語:',
            'skill.createdAt': '生成日:',

            'action.deleteTitle': 'この項目の削除を将軍に指示',
            'action.deleteConfirm': 'この要対応項目の削除を将軍に指示しますか？',
            'action.sending': '送信中...',
            'action.sent': '✓ 送信済み',
            'action.failed': '× 失敗',

            'footer.text': '戦国AIオーケストレーション'
        },
        en: {
            'page.title': 'Battle Report - multi-agent-shogun',
            'page.description': 'multi-agent-shogun Battle Dashboard',

            'header.title': 'Battle Report',
            'header.lastUpdated': 'Last updated:',
            'header.autoRefresh': 'Auto-refresh (5s)',

            'command.title': 'Orders to the Shogun',
            'command.placeholder': 'Enter your orders...',
            'command.submit': 'Deploy!',
            'command.sending': 'Sending...',
            'command.emptyWarning': 'Please enter your orders',
            'command.success': 'Your orders have been delivered to the Shogun',
            'command.failure': 'Send failed:',

            'shogun.title': 'Shogun Status',
            'shogun.refresh': 'Refresh',
            'shogun.autoRefresh': 'Auto-refresh',
            'shogun.loading': 'Loading...',
            'shogun.updating': 'Updating...',
            'shogun.error': 'Error:',
            'shogun.noOutput': '(No output)',
            'shogun.fetchFailed': 'Fetch failed:',

            'karo.label': 'Karo:',
            'karo.busy': 'Busy',
            'karo.idle': 'Idle',
            'karo.title': 'Karo Status',
            'karo.close': '▲ Close',
            'karo.loading': 'Loading...',
            'karo.badgeTitle': 'Click to toggle Karo terminal',
            'karo.error': 'Error:',
            'karo.noOutput': '(No output)',
            'karo.fetchFailed': 'Fetch failed',

            'section.actionRequired': 'Action Required',
            'section.inProgress': 'In Progress',
            'section.completedToday': "Today's Results",
            'section.skillCandidates': 'Skill Candidates',
            'section.generatedSkills': 'Generated Skills',
            'section.waiting': 'Waiting',
            'section.inquiries': 'Inquiries',

            'empty.none': 'None',
            'empty.cssContent': 'None',

            'table.worker': 'Worker',
            'table.task': 'Task',
            'table.project': 'Project',
            'table.status': 'Status',
            'table.defaultStatus': 'In battle',
            'table.clickDetail': 'Click for details',
            'table.time': 'Time',
            'table.result': 'Result',

            'modal.ashigaruTitle': 'Ashigaru {N} Status',
            'modal.loading': 'Loading...',
            'modal.updating': 'Updating...',
            'modal.refresh': 'Refresh',
            'modal.close': 'Close',
            'modal.error': 'Error:',
            'modal.noOutput': '(No output)',
            'modal.fetchFailed': 'Fetch failed:',

            'skill.badge': 'Skill Candidates',
            'skill.badgeCount': '{N}',
            'skill.badgeStatus': '[Pending]',
            'skill.modalTitle': 'Skill Candidates',
            'skill.empty': 'No skill candidates',
            'skill.noDescription': 'No description',
            'skill.unknownSource': 'Unknown',
            'skill.pendingBadge': '🔔 Pending',
            'skill.source': 'Source:',
            'skill.generality': 'Generality:',
            'skill.approve': 'Approve',
            'skill.reject': 'Reject',
            'skill.approved': 'Approved',
            'skill.rejected': 'Rejected',
            'skill.sendFailed': 'Send failed:',
            'skill.rejectReason': 'Reason (optional)',
            'skill.rejectConfirm': 'Send rejection',
            'skill.supportedLangs': 'Languages:',
            'skill.createdAt': 'Created:',

            'action.deleteTitle': 'Request Shogun to delete this item',
            'action.deleteConfirm': 'Request Shogun to delete this action item?',
            'action.sending': 'Sending...',
            'action.sent': '✓ Sent',
            'action.failed': '× Failed',

            'footer.text': 'Sengoku AI Orchestration'
        }
    };

    var currentLanguage = 'ja';

    function t(key) {
        var dict = translations[currentLanguage];
        if (dict && dict[key] !== undefined) {
            return dict[key];
        }
        var fallback = translations['ja'];
        if (fallback && fallback[key] !== undefined) {
            return fallback[key];
        }
        return key;
    }

    function getCurrentLanguage() {
        return currentLanguage;
    }

    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLanguage = lang;
        try {
            localStorage.setItem('shogun-gui-lang', lang);
        } catch (e) { /* localStorage unavailable */ }
        document.documentElement.lang = lang;
        applyTranslations();
        updateLangButtons();
    }

    function applyTranslations() {
        // Update elements with data-i18n attribute (textContent)
        var elements = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < elements.length; i++) {
            elements[i].textContent = t(elements[i].getAttribute('data-i18n'));
        }

        // Update elements with data-i18n-placeholder attribute
        var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        for (var i = 0; i < placeholders.length; i++) {
            placeholders[i].placeholder = t(placeholders[i].getAttribute('data-i18n-placeholder'));
        }

        // Update elements with data-i18n-title attribute
        var titles = document.querySelectorAll('[data-i18n-title]');
        for (var i = 0; i < titles.length; i++) {
            titles[i].title = t(titles[i].getAttribute('data-i18n-title'));
        }

        // Update elements with data-i18n-aria-label attribute
        var ariaLabels = document.querySelectorAll('[data-i18n-aria-label]');
        for (var i = 0; i < ariaLabels.length; i++) {
            ariaLabels[i].setAttribute('aria-label', t(ariaLabels[i].getAttribute('data-i18n-aria-label')));
        }

        // Update <title> tag
        document.title = t('page.title');

        // Update <meta name="description">
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', t('page.description'));
        }
    }

    function updateLangButtons() {
        var buttons = document.querySelectorAll('.lang-btn');
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].getAttribute('data-lang') === currentLanguage) {
                buttons[i].classList.add('active');
            } else {
                buttons[i].classList.remove('active');
            }
        }
    }

    function initI18n() {
        // 1. Read saved language from localStorage
        var saved = null;
        try {
            saved = localStorage.getItem('shogun-gui-lang');
        } catch (e) { /* localStorage unavailable */ }

        // 2. If not saved, detect from browser
        if (!saved) {
            var browserLang = navigator.language || navigator.userLanguage || '';
            saved = browserLang.indexOf('ja') !== -1 ? 'ja' : 'en';
        }

        // 3. Set language
        currentLanguage = translations[saved] ? saved : 'ja';
        document.documentElement.lang = currentLanguage;

        // 4. Apply translations
        applyTranslations();

        // 5. Set up language switcher buttons
        updateLangButtons();
        var buttons = document.querySelectorAll('.lang-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                setLanguage(this.getAttribute('data-lang'));
            });
        }
    }

    // Expose to global scope
    window.t = t;
    window.setLanguage = setLanguage;
    window.getCurrentLanguage = getCurrentLanguage;
    window.initI18n = initI18n;
    window.applyTranslations = applyTranslations;

    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initI18n);
    } else {
        initI18n();
    }
})();
