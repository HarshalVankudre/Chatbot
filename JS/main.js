document.addEventListener('DOMContentLoaded', async () => {
    const app = {
        state: {
            apiKey: null,
            currentLang: 'en',
            selectedModel: AI_MODELS[0].id,
            db: null,
            dbSchema: '',
            sqlJs: null,
            conversationHistory: [],
            isModelRunning: false,
        },
        elements: {
            chatContainer: document.getElementById('chat-container'),
            chatForm: document.getElementById('chat-form'),
            messageInput: document.getElementById('message-input'),
            submitButton: document.getElementById('submit-btn'),
            sendIcon: document.getElementById('send-icon'),
            spinnerIcon: document.getElementById('spinner-icon'),
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
            // New Elements
            modelSelector: document.getElementById('model-selector'),
            clearChatBtn: document.getElementById('clear-chat-btn'),
            viewSchemaBtn: document.getElementById('view-schema-btn'),
            schemaContainer: document.getElementById('schema-container'),
            schemaPre: document.getElementById('schema-pre'),
        },
    };

    // --- INITIALIZATION ---
    initializeModelSelector(app);
    const browserLang = navigator.language.split('-')[0];
    setLanguage(browserLang === 'de' ? 'de' : 'en', app);

    loadStateFromStorage(app);
    renderHistory(app);

    await loadSqlJs(app);

    // --- EVENT LISTENERS ---
    app.elements.saveKeyBtn.addEventListener('click', () => handleSaveKey(app));
    app.elements.dbFileInput.addEventListener('change', (event) => handleDbFileChange(event, app));
    app.elements.chatForm.addEventListener('submit', (e) => handleChatSubmit(e, app));
    app.elements.langEnBtn.addEventListener('click', () => setLanguage('en', app));
    app.elements.langDeBtn.addEventListener('click', () => setLanguage('de', app));
    app.elements.modelSelector.addEventListener('change', (e) => {
        app.state.selectedModel = e.target.value;
        localStorage.setItem('selectedModel', e.target.value);
    });
    app.elements.clearChatBtn.addEventListener('click', () => handleClearChat(app));
    app.elements.viewSchemaBtn.addEventListener('click', () => handleToggleSchema(app));
});


// --- HANDLER FUNCTIONS ---

function handleSaveKey(app) {
    const key = app.elements.apiKeyInput.value.trim();
    if (key) {
        app.state.apiKey = key;
        localStorage.setItem('openaiApiKey', key);
        app.elements.dbFileInput.disabled = false;
        if (app.state.conversationHistory.length <= 1) { // Avoid spamming on re-save
            addMessage(app, 'ai', uiStrings[app.state.currentLang].keySaved);
        }
    } else {
        addMessage(app, 'ai', uiStrings[app.state.currentLang].keyMissing);
    }
}

function handleChatSubmit(e, app) {
    e.preventDefault();
    if (app.state.isModelRunning) return;

    const userMessage = app.elements.messageInput.value.trim();
    if (!userMessage) return;

    if (!app.state.apiKey) {
        addMessage(app, 'ai', uiStrings[app.state.currentLang].keyMissing);
        return;
    }
    if (!app.state.db) {
        addMessage(app, 'ai', uiStrings[app.state.currentLang].dbPrompt);
        return;
    }

    addMessage(app, 'user', userMessage);
    app.elements.messageInput.value = '';
    getAIResponse(userMessage, app);
}

function handleClearChat(app) {
    app.state.conversationHistory = [];
    localStorage.removeItem('chatHistory');
    app.elements.chatContainer.innerHTML = '';
    addMessage(app, 'ai', uiStrings[app.state.currentLang].initialMessage);
}

function handleToggleSchema(app) {
    const isHidden = app.elements.schemaContainer.classList.toggle('hidden');
    app.elements.viewSchemaBtn.textContent = isHidden
        ? uiStrings[app.state.currentLang].viewSchema
        : uiStrings[app.state.currentLang].hideSchema;
}

// --- NEW HELPER FUNCTIONS ---

function initializeModelSelector(app) {
    AI_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        app.elements.modelSelector.appendChild(option);
    });
}

function loadStateFromStorage(app) {
    const savedKey = localStorage.getItem('openaiApiKey');
    if (savedKey) {
        app.state.apiKey = savedKey;
        app.elements.apiKeyInput.value = savedKey;
        app.elements.dbFileInput.disabled = false;
    }

    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
        app.state.selectedModel = savedModel;
        app.elements.modelSelector.value = savedModel;
    }

    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        app.state.conversationHistory = JSON.parse(savedHistory);
    }
}

function renderHistory(app) {
    app.elements.chatContainer.innerHTML = '';
    if (app.state.conversationHistory.length === 0) {
        addMessage(app, 'ai', uiStrings[app.state.currentLang].initialMessage);
    } else {
        app.state.conversationHistory.forEach(msg => {
            const type = msg.content.startsWith('Generated SQL:') || msg.content.startsWith('Corrected SQL:') ? 'code' : 'text';
            const content = msg.content.replace(/^(Generated SQL:|Corrected SQL:)\s*/, '');
            addMessage(app, msg.role, content, type);
        });
    }
}

function saveHistory(app) {
    localStorage.setItem('chatHistory', JSON.stringify(app.state.conversationHistory));
}