document.addEventListener('DOMContentLoaded', () => {
    const toggleInput = document.getElementById('toggleLogin');
    const toggleDarkMode = document.getElementById('toggleDarkMode');
    const toggleDeclutter = document.getElementById('toggleDeclutter');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const saveCredentialsBtn = document.getElementById('saveCredentials');
    const saveStatus = document.getElementById('saveStatus');

    // Load initial state
    chrome.storage.local.get([
        'erpAutoLoginEnabled',
        'erpDarkModeEnabled',
        'erpHideClutterEnabled',
        'erpUsername',
        'erpPassword'
    ], (result) => {
        toggleInput.checked = result.erpAutoLoginEnabled !== false; // default true
        toggleDarkMode.checked = result.erpDarkModeEnabled === true; // default false
        toggleDeclutter.checked = result.erpHideClutterEnabled === true; // default false
        usernameInput.value = result.erpUsername || '';
        passwordInput.value = result.erpPassword || '';
    });

    const showStatus = (message, isError = false) => {
        saveStatus.textContent = message;
        saveStatus.style.color = isError ? '#d32f2f' : '#2e7d32';
        setTimeout(() => {
            saveStatus.textContent = '';
        }, 1800);
    };

    const saveCredentials = () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showStatus('Enter both username and password.', true);
            return;
        }

        chrome.storage.local.set({
            erpUsername: username,
            erpPassword: password
        }, () => {
            showStatus('Credentials saved.');
        });
    };

    saveCredentialsBtn.addEventListener('click', saveCredentials);

    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCredentials();
        }
    });

    // Save auto-login state
    toggleInput.addEventListener('change', (e) => {
        chrome.storage.local.set({ erpAutoLoginEnabled: e.target.checked }, () => {
            console.log('Auto-login state saved:', e.target.checked);
        });
    });

    // Save dark-mode state
    toggleDarkMode.addEventListener('change', (e) => {
        chrome.storage.local.set({ erpDarkModeEnabled: e.target.checked }, () => {
            console.log('Dark mode state saved:', e.target.checked);
        });
    });

    // Save declutter state
    toggleDeclutter.addEventListener('change', (e) => {
        chrome.storage.local.set({ erpHideClutterEnabled: e.target.checked }, () => {
            console.log('Hide clutter state saved:', e.target.checked);
        });
    });
});
