const erpIsLoginPage = window.location.pathname.toLowerCase().includes('login.aspx');
const ERP_RENDER_DELAY_MS = erpIsLoginPage ? 5000 : 2000;
const ERP_RENDER_STYLE_ID = 'erp-render-gate-style';
const ERP_RENDER_OVERLAY_ID = 'erp-render-loading-overlay';
const erpRenderStart = Date.now();
let erpRenderRevealed = false;

function ensureRenderOverlay() {
    if (!document.body) return false;
    if (document.getElementById(ERP_RENDER_OVERLAY_ID)) return true;

    const overlay = document.createElement('div');
    overlay.id = ERP_RENDER_OVERLAY_ID;
    overlay.innerHTML = erpIsLoginPage ? `
        <div class="erp-render-loading-wrap">
            <div class="erp-render-spinner" aria-hidden="true"></div>
            <div class="erp-render-loading-text">Loading ERP Overhaul...</div>
            <a class="erp-render-loading-link" href="https://jayvarma.site" target="_blank" rel="noopener noreferrer">@jayyvarmaa</a>
        </div>
    ` : '';

    document.body.appendChild(overlay);
    return true;
}

function applyRenderGate() {
    if (document.getElementById(ERP_RENDER_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = ERP_RENDER_STYLE_ID;
    style.textContent = `
html.erp-render-gate body {
    overflow: hidden !important;
}

html.erp-render-gate body > *:not(#${ERP_RENDER_OVERLAY_ID}) {
    visibility: hidden !important;
}

#${ERP_RENDER_OVERLAY_ID} {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f6f8;
    color: #1f2937;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

html.erp-render-dark #${ERP_RENDER_OVERLAY_ID} {
    background: #191919;
    color: #e5e7eb;
}

#${ERP_RENDER_OVERLAY_ID} .erp-render-loading-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    padding: 20px;
}

#${ERP_RENDER_OVERLAY_ID} .erp-render-spinner {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 3px solid rgba(120, 130, 150, 0.35);
    border-top-color: #4fa8ff;
    animation: erpRenderSpin 0.9s linear infinite;
}

#${ERP_RENDER_OVERLAY_ID} .erp-render-loading-text {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.2px;
}

#${ERP_RENDER_OVERLAY_ID} .erp-render-loading-link {
    font-size: 13px;
    color: #4fa8ff;
    text-decoration: none;
    font-weight: 700;
}

#${ERP_RENDER_OVERLAY_ID} .erp-render-loading-link:hover {
    text-decoration: underline;
}

@keyframes erpRenderSpin {
    to { transform: rotate(360deg); }
}
`;
    (document.head || document.documentElement).appendChild(style);

    document.documentElement.classList.add('erp-render-gate');
    if (!ensureRenderOverlay()) {
        document.addEventListener('DOMContentLoaded', ensureRenderOverlay, { once: true });
    }
}

function revealRenderGate() {
    if (erpRenderRevealed) return;
    erpRenderRevealed = true;

    document.documentElement.classList.remove('erp-render-gate');
    document.documentElement.classList.remove('erp-render-dark');

    const overlay = document.getElementById(ERP_RENDER_OVERLAY_ID);
    if (overlay) overlay.remove();
}

function revealAfterMinDelay() {
    const elapsed = Date.now() - erpRenderStart;
    const remaining = Math.max(0, ERP_RENDER_DELAY_MS - elapsed);
    setTimeout(revealRenderGate, remaining);
}

function initializeExtension() {
chrome.storage.local.get(['erpAutoLoginEnabled', 'erpDarkModeEnabled', 'erpHideClutterEnabled', 'erpHostelRegistered', 'erpUsername', 'erpPassword'], (result) => {
    const declutterEnabled = result.erpHideClutterEnabled === true;
    const darkModeEnabled = result.erpDarkModeEnabled === true;

    if (darkModeEnabled) {
        document.documentElement.classList.add('erp-render-dark');
    } else {
        document.documentElement.classList.remove('erp-render-dark');
    }

    // 1. Apply Dark mode if enabled
    if (darkModeEnabled) {
        console.log("ERP Overhaul: Applying Dark Mode...");
        document.documentElement.classList.add('erp-dark-mode');
    }

    // 2. Apply Declutter layout if enabled
    if (declutterEnabled) {
        console.log("ERP Overhaul: Hiding clutter and building custom layout...");
        document.documentElement.classList.add('erp-hide-clutter');
        
        const buildCustomLayout = () => {
            const dashboardRoot = document.querySelector('.page-content .container-fluid') || document.querySelector('.page-content') || document.body;
            if (!dashboardRoot) return;

            let shell = dashboardRoot.querySelector('.erp-dashboard-shell');
            if (!shell) {
                shell = document.createElement('section');
                shell.className = 'erp-dashboard-shell';
                dashboardRoot.appendChild(shell);
            }

            const ensureSection = (className) => {
                let section = shell.querySelector(`.${className}`);
                if (!section) {
                    section = document.createElement('div');
                    section.className = className;
                    shell.appendChild(section);
                }
                return section;
            };

            const headerRow = ensureSection('erp-flex-header-row');
            const mainArea = ensureSection('erp-main-content');
            const footerArea = ensureSection('erp-footer-alerts');

            // 1. Top Header Row (Profile + Note)
            const profilePortlet = document.querySelector('.portlet.light.pt-15.pb-0');
            if (profilePortlet) {
                const profileCol = profilePortlet.closest('[class*="col-"]') || profilePortlet.parentElement;
                if (profileCol) {
                    profileCol.classList.add('erp-col-profile');
                    headerRow.appendChild(profileCol);

                    const profileBody = profilePortlet.querySelector('.portlet-body');
                    if (profileBody && !profileBody.dataset.erpProfileStructured) {
                        profileBody.classList.add('erp-profile-full');
                        buildProfileSplitLayout(profileBody);
                        profileBody.dataset.erpProfileStructured = 'true';
                    }
                }
            }

            const feeNoteCol = document.getElementById('ctl00_cphPageContent_divFeeNote') ||
                document.querySelector('.note.note-info')?.closest('[class*="col-"]');
            if (feeNoteCol) {
                feeNoteCol.classList.add('erp-col-note');
                headerRow.appendChild(feeNoteCol);
            }

            // 2. Middle Content Section (Pending Assignments)
            const pendingAssignments = document.getElementById('ctl00_cphPageContent_divPendingAssigmnets');
            if (pendingAssignments) {
                const assignWrap = pendingAssignments.closest('[class*="col-"]') || pendingAssignments.parentElement;
                if (assignWrap) {
                    assignWrap.classList.add('erp-assignments-workspace');
                    mainArea.appendChild(assignWrap);
                }
            }

            // Hide original modules that should not appear in custom layout.
            [
                'ctl00_cphPageContent_divNotification',
                'ctl00_cphPageContent_divPlacement',
                'ctl00_cphPageContent_divUsefulWebsite',
                'ctl00_cphPageContent_divTermRegistrationProcess'
            ].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            // 3. Bottom Footer/Alert Section
            const isNoRecordAlert = (alertEl) => {
                if (!alertEl) return false;
                const text = (alertEl.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                return text.includes('no record found');
            };

            const lmsAlert = document.getElementById('ctl00_cphPageContent_divLMSNotification');
            const errorAlert = document.getElementById('ctl00_cphPageContent_ucMessage_lblError')?.closest('.alert');
            const assignmentErrorAlert = document.getElementById('ctl00_cphPageContent_ucMessageAssignmentsDetails_lblError')?.closest('.alert');

            [lmsAlert, errorAlert, assignmentErrorAlert].forEach((alertEl) => {
                if (alertEl) {
                    if (isNoRecordAlert(alertEl)) return;
                    alertEl.classList.add('erp-notification-footer');
                    footerArea.appendChild(alertEl);
                }
            });
            
            // Hide Mobile App empty container physically from DOM placement issues
            const mobileApp = document.querySelector('.mt-widget-3');
            if (mobileApp && mobileApp.closest('.portlet')) {
                if (mobileApp.closest('[class*="col-"]')) {
                    mobileApp.closest('[class*="col-"]').style.display = 'none';
                }
            }
        };

        // Run immediately and on load
        buildCustomLayout();
        window.addEventListener('load', buildCustomLayout);
    }

    // Default auto-login to true if not yet set
    const autoLoginEnabled = result.erpAutoLoginEnabled !== false;
    
    // 3. If we are on the login page, run auto login only when enabled
    if (autoLoginEnabled && window.location.pathname.toLowerCase().includes('login.aspx')) {
        setTimeout(() => autoLogin(result.erpUsername, result.erpPassword), 500);
    } else if (!autoLoginEnabled) {
        console.log("ERP Overhaul: Auto-login is disabled.");
    }
    
    // 4. Hide-only behaviors are controlled by Declutter toggle
    if (declutterEnabled) {
        // Watch for the annoying "Pending Work / Circular List" modal and block it.
        blockCircularModal();

        // Apply global navbar visibility rules and hostel visibility checks.
        // Hide Hostel by default until registration status is verified.
        applyNavbarVisibility(result.erpHostelRegistered !== true);
        updateHostelRegistrationStatus();
        detectHostelRegistrationFromServer();
        window.addEventListener('load', enforceNavbarVisibilityFromStorage);
    }

    // 5. Unblock context menus and Developer Tools (F12, etc.)
    defeatAntiDevTools();

    // 6. Customize footer branding text/link
    customizeFooterBranding();
    window.addEventListener('load', customizeFooterBranding);

    // 7. LMS Page Revamp (only when dark mode is active)
    if (darkModeEnabled) {
        const lmsPath = window.location.pathname.toLowerCase();
        if (lmsPath.includes('lms_contentstudentdashboard.aspx') ||
            lmsPath.includes('lms_content_viewdetailedforstudent.aspx') ||
            lmsPath.includes('lms_content_subjectwisecontentlist.aspx')) {
            restructureLMSPage();
        }
    }

    // Reveal only after minimum hold to prevent theme/layout flicker.
    revealAfterMinDelay();
});
}

applyRenderGate();

// Failsafe so page never remains hidden due to unexpected script errors.
setTimeout(revealRenderGate, ERP_RENDER_DELAY_MS + 3000);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension, { once: true });
} else {
    initializeExtension();
}

function applyNavbarVisibility(hideHostelTab) {
    const topLevelItems = document.querySelectorAll('.page-header-menu .hor-menu ul.navbar-nav > li, #ctl00_MenuUL > li');
    if (!topLevelItems.length) return;

    const blockedLabels = [
        'aicte100 dashboard',
        'no due process',
        'transport',
        'mentoring',
        'convocation',
        'resource',
        'resources'
    ];

    topLevelItems.forEach((item) => {
        const anchor = item.querySelector(':scope > a') || item.querySelector('a');
        if (!anchor) return;

        const label = (anchor.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!label) return;

        const shouldHideByLabel = blockedLabels.some((blocked) => label.includes(blocked));
        const shouldHideHostel = hideHostelTab && label.includes('hostel');

        if (shouldHideByLabel || shouldHideHostel) {
            item.style.display = 'none';
        }
    });
}

function enforceNavbarVisibilityFromStorage() {
    chrome.storage.local.get(['erpHostelRegistered'], (result) => {
        applyNavbarVisibility(result.erpHostelRegistered !== true);
    });
}

function detectHostelRegistrationFromServer() {
    // Avoid checking on the login page itself.
    if (window.location.pathname.toLowerCase().includes('login.aspx')) return;

    const hostelDetailUrl = `${window.location.origin}/StudentPanel/HOS_Hostel/HOS_HostelStudentDetail.aspx`;

    fetch(hostelDetailUrl, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
    })
        .then((res) => {
            const redirectedToLogin = (res.url || '').toLowerCase().includes('login.aspx');
            if (!res.ok || redirectedToLogin) return null;
            return res.text();
        })
        .then((html) => {
            if (!html) return;

            const normalized = html.replace(/\s+/g, ' ').trim().toLowerCase();
            const notRegistered = normalized.includes('you are not registered in hostel');
            const isRegistered = !notRegistered;

            chrome.storage.local.set({ erpHostelRegistered: isRegistered }, () => {
                applyNavbarVisibility(!isRegistered);
            });
        })
        .catch(() => {
            // Keep current navbar state if detection fails.
        });
}

function updateHostelRegistrationStatus() {
    const pageText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const isNotRegistered = pageText.includes('you are not registered in hostel');
    const onHostelDetailPage = window.location.pathname.toLowerCase().includes('hos_hostelstudentdetail.aspx');

    if (isNotRegistered) {
        chrome.storage.local.set({ erpHostelRegistered: false }, () => {
            applyNavbarVisibility(true);
        });
        return;
    }

    if (onHostelDetailPage) {
        chrome.storage.local.set({ erpHostelRegistered: true }, () => {
            applyNavbarVisibility(false);
        });
    }
}

function customizeFooterBranding() {
    const footerContainer = document.querySelector('.page-footer .container-fluid');
    if (!footerContainer) return;

    footerContainer.innerHTML = '2026 <a href="https://jayvarma.site" target="_blank" rel="noopener noreferrer">@jayyvarmaa</a>';
}

function buildProfileSplitLayout(profileBody) {
    if (!profileBody || profileBody.dataset.erpProfileSplit === 'true') return;

    const avatar = profileBody.querySelector('#ctl00_cphPageContent_ucStudentInfoCompact_imgStudentPhoto') || profileBody.querySelector('img.imgStudentPhoto');
    const nameNode = profileBody.querySelector('[id*="lblStudentLCName"]');
    const statusNode = profileBody.querySelector('[id*="lblStudentStatusID"]');
    const infoBox = profileBody.querySelector('.profileInfoBox') || profileBody.querySelector('.table-responsive.profileInfoBox');

    if (!avatar || !infoBox) return;

    // Remove only the title row from the right pane (name/status is shown in left pane).
    const titleRow = infoBox.querySelector('tr.text-center td [id*="lblStudentLCName"]')?.closest('tr');
    if (titleRow) titleRow.remove();

    const split = document.createElement('div');
    split.className = 'erp-profile-split';

    const leftPane = document.createElement('div');
    leftPane.className = 'erp-profile-left-pane';

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'erp-profile-avatar';
    avatarWrap.appendChild(avatar);
    leftPane.appendChild(avatarWrap);

    if (nameNode) {
        const nameText = document.createElement('div');
        nameText.className = 'erp-profile-left-name';
        nameText.textContent = (nameNode.textContent || '').replace(/\s+/g, ' ').trim();
        leftPane.appendChild(nameText);
    }

    if (statusNode) {
        const statusWrap = document.createElement('div');
        statusWrap.className = 'erp-profile-left-status';
        statusWrap.appendChild(statusNode.cloneNode(true));
        leftPane.appendChild(statusWrap);
    }

    const rightPane = document.createElement('div');
    rightPane.className = 'erp-profile-right-pane';
    rightPane.appendChild(infoBox);

    split.appendChild(leftPane);
    split.appendChild(rightPane);

    profileBody.innerHTML = '';
    profileBody.appendChild(split);
    profileBody.dataset.erpProfileSplit = 'true';
}

function restructureLMSPage() {
    const isDashboard = window.location.pathname.toLowerCase().includes('lms_contentstudentdashboard.aspx');

    // Poll for the container itself — it may not exist yet on initial load
    let containerAttempts = 0;
    const containerPoll = setInterval(() => {
        containerAttempts++;
        const container = document.querySelector('.page-content .container-fluid');
        if (!container && containerAttempts < 25) return; // keep waiting (5s max)
        clearInterval(containerPoll);
        if (!container) { console.log('[ERP Overhaul] LMS: container-fluid not found after 5s'); return; }

        // Single guard: only run once
        if (container.classList.contains('erp-lms-done')) { console.log('[ERP Overhaul] LMS: already processed'); return; }
        container.classList.add('erp-lms-done');
        container.classList.add('erp-lms-shell');
        console.log('[ERP Overhaul] LMS: erp-lms-shell applied to container');

        // Hide breadcrumb immediately
        container.querySelectorAll('.page-breadcrumb').forEach(el => el.style.display = 'none');

        if (!isDashboard) {
            // Subject detail page — just the shell class is enough (CSS handles styling)
            console.log('[ERP Overhaul] LMS: Subject detail page — CSS-only mode');
            return;
        }

        // Now poll for AJAX content (dashboard only)
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds max
        const poll = setInterval(() => {
            attempts++;
            const subjectsWrapper = document.getElementById('ctl00_cphPageContent_divSubjectWiseContentCount');
            const pendingWrapper = document.getElementById('ctl00_cphPageContent_Div_PendingSubmissionList');
            const hasDataRows = pendingWrapper && pendingWrapper.querySelectorAll('table tbody tr td').length > 0;
            const hasSubjectCards = subjectsWrapper && subjectsWrapper.querySelectorAll('a[id*="hlContentList"]').length > 0;

            if (attempts >= maxAttempts || (hasDataRows && hasSubjectCards)) {
                clearInterval(poll);
                applyLMSTransform(container, subjectsWrapper, pendingWrapper);
            }
        }, 200);
    }, 200);
}

function applyLMSTransform(container, subjectsWrapper, pendingWrapper) {
    console.log('[ERP Overhaul] LMS Transform:', { pendingWrapper: !!pendingWrapper, subjectsWrapper: !!subjectsWrapper });
    // ── PENDING SUBMISSIONS TABLE ──
    if (pendingWrapper && subjectsWrapper) {
        // Swap order: pending above subjects (use actual parent, not container)
        subjectsWrapper.parentNode.insertBefore(pendingWrapper, subjectsWrapper);
    }

    if (pendingWrapper) {
        // Custom section header
        const oldTitle = pendingWrapper.querySelector('.portlet-title');
        if (oldTitle) oldTitle.style.display = 'none';

        const tableTitleHTML = `
        <div class="erp-lms-table-header">
            <i class="fa fa-file-text-o erp-lms-icon"></i>
            <h2 class="erp-lms-subtitle">Pending Submission</h2>
        </div>
        `;
        pendingWrapper.insertAdjacentHTML('afterbegin', tableTitleHTML);

        // Find and fix the table
        const table = pendingWrapper.querySelector('table');
        if (table) {
            table.className = 'erp-lms-table';
            const tableRes = pendingWrapper.querySelector('.table-responsive');
            if (tableRes) {
                tableRes.style.cssText = 'height:auto !important; overflow:visible !important;';
                tableRes.classList.add('erp-lms-table-container');
            }

            // ── Parse ALL data rows across ALL tbodys ──
            // The ERP renders: <tbody></tbody><thead>...</thead><tbody>data rows</tbody>
            const allRows = Array.from(table.querySelectorAll('tbody tr'));
            const subjectGroups = {};
            let globalSr = 0;

            allRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    globalSr++;
                    const subjectName = cells[1].textContent.trim();
                    const assignment = cells[2].innerHTML.trim();
                    const deadline = cells[3].innerHTML.trim();
                    const updatedOn = cells[4].innerHTML.trim();
                    const actionRaw = cells[5].innerHTML.trim();

                    if (!subjectGroups[subjectName]) {
                        subjectGroups[subjectName] = [];
                    }
                    subjectGroups[subjectName].push({
                        sr: globalSr,
                        assignment,
                        deadline,
                        updatedOn,
                        action: actionRaw
                    });
                }
            });

            // Only rebuild if we found data
            if (Object.keys(subjectGroups).length > 0) {
                // Remove all existing tbodys
                table.querySelectorAll('tbody').forEach(tb => tb.remove());

                // Rebuild grouped body
                const newTbody = document.createElement('tbody');
                let html = '';

                Object.keys(subjectGroups).forEach(subject => {
                    html += `
                    <tr class="erp-lms-group-row">
                        <td colspan="5">
                            <div class="erp-lms-group-inner">
                                <span class="erp-lms-blue-stripe"></span>
                                <span class="erp-lms-group-title">${subject}</span>
                            </div>
                        </td>
                    </tr>`;

                    subjectGroups[subject].forEach(item => {
                        // Replace green submit button class; also handle locked (red) buttons
                        let actionHtml = item.action
                            .replace(/btn\s+green\s+btn-circle\s+btn-xs/g, 'btn-submit')
                            .replace('Click here to Submit', 'Click here to Submit');
                        // Style locked buttons
                        actionHtml = actionHtml.replace(/btn\s+red\s+btn-xs\s+btn-circle/g, 'btn-locked');

                        // Style "Late Submission" as a red badge
                        let deadlineHtml = item.deadline;
                        if (deadlineHtml.toLowerCase().includes('late')) {
                            deadlineHtml = deadlineHtml.replace(
                                /\(\s*Late\s*Submission\s*\)/gi,
                                '<span class="erp-late-tag">Late Submission</span>'
                            );
                        }

                        html += `
                        <tr class="erp-lms-item-row">
                            <td class="erp-lms-col-sr">${item.sr}</td>
                            <td class="erp-lms-col-assign">${item.assignment}</td>
                            <td class="erp-lms-col-deadline">${deadlineHtml}</td>
                            <td class="erp-lms-col-updated">${item.updatedOn}</td>
                            <td class="erp-lms-col-action text-center">${actionHtml}</td>
                        </tr>`;
                    });
                });

                newTbody.innerHTML = html;
                table.appendChild(newTbody);
            }

            // Rewrite thead
            const theadTr = table.querySelector('thead tr') || table.querySelector('tr.TRDark');
            if (theadTr) {
                theadTr.innerHTML = `
                    <th class="erp-lms-col-sr">Sr.</th>
                    <th class="erp-lms-col-assign">Assignment Details</th>
                    <th class="erp-lms-col-deadline">Deadline</th>
                    <th class="erp-lms-col-updated">Last Update</th>
                    <th class="text-center erp-lms-col-action">Action</th>
                `;
                theadTr.className = 'erp-table-header';
            }
        }
    }

    // ── SUBJECT CARDS GRID ──
    if (subjectsWrapper) {
        const portletBody = subjectsWrapper.querySelector('.portlet-body');
        const cards = subjectsWrapper.querySelectorAll('a[id*="hlContentList"]');

        if (cards.length > 0 && portletBody) {
            // Collect data before clearing
            const cardData = [];
            cards.forEach(card => {
                const href = card.getAttribute('href');
                const nameNode = card.querySelector('.mt-card-name');
                const bgNode = card.querySelector('.img-style');
                const countNode = card.querySelector('.mt-info span');
                
                let semester = '';
                const semNode = bgNode?.querySelector('.label');
                if (semNode) semester = semNode.textContent.trim();
                
                const subjectName = nameNode ? nameNode.textContent.trim() : 'Unknown Subject';
                const rawCount = countNode ? countNode.textContent : '';
                // Extract just the number from "Contents : 26"
                const countMatch = rawCount.match(/(\d+)/);
                const contents = countMatch ? countMatch[1] : '0';

                cardData.push({ href, semester, subjectName, contents });
            });

            // Build new grid
            const grid = document.createElement('div');
            grid.className = 'erp-lms-subject-grid';

            cardData.forEach(d => {
                const a = document.createElement('a');
                a.href = d.href;
                a.className = 'subject-card';
                a.innerHTML = `
                    <div>
                        <span class="semester-tag">${d.semester}</span>
                        <p class="subject-name">${d.subjectName.toUpperCase()}</p>
                    </div>
                    <div class="subject-card-footer">
                        <i class="fa fa-arrow-right subject-icon"></i>
                    </div>
                `;
                grid.appendChild(a);
            });

            portletBody.innerHTML = '';
            portletBody.appendChild(grid);
        }

        // Hide the portlet title if it exists
        const subjectPortletTitle = subjectsWrapper.querySelector('.portlet-title');
        if (subjectPortletTitle) subjectPortletTitle.style.display = 'none';
    }

    // Hide any stray empty rows / breadcrumbs / semester dropdowns
    container.querySelectorAll('.page-breadcrumb, .breadcrumb').forEach(el => el.style.display = 'none');
    // Hide the old "Semester" dropdown at top-right
    const semesterDdl = document.getElementById('ctl00_cphPageContent_ddlSemester');
    if (semesterDdl) {
        const semContainer = semesterDdl.closest('.row') || semesterDdl.closest('div');
        if (semContainer && !semContainer.id) semContainer.style.display = 'none';
    }
}

function autoLogin(savedUsername, savedPassword) {
    const username = (savedUsername || '').trim();
    const password = savedPassword || '';

    if (!username || !password) {
        console.warn('ERP Overhaul: Auto-login skipped because credentials are not saved in popup settings.');
        return;
    }

    // 1. Check if the "Student" radio button exists.
    const studentRadio = document.getElementById('rblRole_1');
    if (studentRadio) {
        if (!studentRadio.checked) {
            console.log("ERP Overhaul: Selecting Student role...");
            studentRadio.click();
            // Expected behavior: the page reloads via __doPostBack, so we stop here.
            return;
        }
        
        console.log("ERP Overhaul: Student role is confirmed. Proceeding with credentials.");
        
        // 2. Select the username and password fields.
        const passwordInput = document.querySelector('input[type="password"]');
        let usernameInput = null;
        
        // Usually the username is the first text input on the form.
        const textInputs = document.querySelectorAll('input[type="text"]');
        if (textInputs.length > 0) {
            usernameInput = textInputs[0];
        }

        if (usernameInput && passwordInput) {
            usernameInput.value = username;
            passwordInput.value = password;

            console.log("ERP Overhaul: Injected credentials.");

            // Trigger change events in case the page uses front-end validation listeners
            usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

            // 3. Click the login button
            const loginButton = document.getElementById('btnLogin');
            if (loginButton) {
                console.log("ERP Overhaul: Clicking Login button...");
                // A very short timeout guarantees our inputs are registered before clicking
                setTimeout(() => {
                    loginButton.click();
                }, 200);
            } else {
                console.error("ERP Overhaul: Login button with id 'btnLogin' not found.");
            }
        } else {
            console.error("ERP Overhaul: Username or Password fields not found on the page.");
        }
    } else {
        console.error("ERP Overhaul: Student radio button with id 'rblRole_1' not found.");
    }
}

function blockCircularModal() {
    console.log("ERP Overhaul: Setting up Circular Modal blocker...");
    
    const dismissModal = () => {
        const modal = document.getElementById('divShowCircularList');
        const continueBtn = document.getElementById('ctl00_cphPageContent_continueButton');
        
        // Try clicking the official continue button if it exists
        if (continueBtn && modal && (modal.style.display !== 'none' || modal.classList.contains('in'))) {
            console.log("ERP Overhaul: Automatically dismissing Circular List Modal via button...");
            continueBtn.click();
            return;
        }
        
        // Fallback: manually hide it and remove backdrop if it's open but button doesn't work
        if (modal && (modal.style.display !== 'none' || modal.classList.contains('in'))) {
            console.log("ERP Overhaul: Force-hiding Circular List Modal...");
            modal.style.display = 'none';
            modal.classList.remove('in', 'show');
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
        }
    };

    // Run it once immediately in case it's already in the DOM and visible
    dismissModal();

    // Use a MutationObserver to catch it if it gets generated or shown dynamically
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                const modal = document.getElementById('divShowCircularList');
                if (modal) dismissModal();
            } else if (mutation.type === 'attributes' && mutation.target.id === 'divShowCircularList') {
                // If it becomes visible by style changes
                if (mutation.target.style.display !== 'none' || mutation.target.classList.contains('in')) {
                    dismissModal();
                }
            }
        }
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['style', 'class'] 
    });
}

function defeatAntiDevTools() {
    console.log("ERP Overhaul: Defeating anti-developer tools scripts...");
    
    // Intercept contextmenu (right click) in the CAPTURE phase and stop it from reaching the ERP's preventDefault
    window.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
    }, true);

    // Intercept keyboard shortcuts in the CAPTURE phase and stop them from reaching the ERP
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
            
            // Stop the event from reaching the ERP listener, so it never gets prevented!
            e.stopPropagation();
        }
    }, true);
}
