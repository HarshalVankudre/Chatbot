document.addEventListener('DOMContentLoaded', async () => {
    // A single object to hold all DOM element references
    const elements = {
        chatContainer: document.getElementById('chat-container'),
        chatForm: document.getElementById('chat-form'),
        messageInput: document.getElementById('message-input'),
        submitButton: document.getElementById('submit-btn'),
        apiKeyInput: document.getElementById('api-key'),
        saveKeyBtn: document.getElementById('save-key-btn'),
        dbFileInput: document.getElementById('db-file-input'),
        dbStatus: document.getElementById('db-status'),
        langEnBtn: document.getElementById('lang-en'),
        langDeBtn: document.getElementById('lang-de'),
        uiTitle: document.getElementById('ui-title'),
        uiSubtitle: document.getElementById('ui-subtitle'),
        uiApiLabel: document.getElementById('ui-api-label'),
        uiDbLabel: document.getElementById('ui-db-label'),
    };

    // --- INITIALIZATION ---
    const browserLang = navigator.language.split('-')[0];
    setLanguage(browserLang === 'de' ? 'de' : 'en', elements);

    const savedKey = localStorage.getItem('openaiApiKey');
    if (savedKey) {
        openaiApiKey = savedKey;
        elements.apiKeyInput.value = savedKey;
        elements.dbFileInput.disabled = false;
        addMessage(elements.chatContainer, 'ai', uiStrings[currentLang].keyLoaded);
    }
    await loadSqlJs(elements.dbStatus);

    // --- EVENT LISTENERS ---
    elements.saveKeyBtn.addEventListener('click', () => {
        const key = elements.apiKeyInput.value.trim();
        if (key) {
            openaiApiKey = key;
            localStorage.setItem('openaiApiKey', key);
            elements.dbFileInput.disabled = false;
            addMessage(elements.chatContainer, 'ai', uiStrings[currentLang].keySaved);
        } else {
            addMessage(elements.chatContainer, 'ai', uiStrings[currentLang].keyMissing);
        }
    });

    elements.dbFileInput.addEventListener('change', (event) => {
        handleDbFileChange(event, elements);
    });

    elements.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = elements.messageInput.value.trim();
        if (!userMessage) return;
        if (!openaiApiKey) { addMessage(elements.chatContainer, 'ai', uiStrings[currentLang].keyMissing); return; }
        if (!db) { addMessage(elements.chatContainer, 'ai', uiStrings[currentLang].dbPrompt); return; }

        addMessage(elements.chatContainer, 'user', userMessage);
        elements.messageInput.value = '';
        getAIResponse(userMessage, elements);
    });

    elements.langEnBtn.addEventListener('click', () => setLanguage('en', elements));
    elements.langDeBtn.addEventListener('click', () => setLanguage('de', elements));
});