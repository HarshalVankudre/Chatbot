// Sets the UI language
function setLanguage(lang, app) {
    app.state.currentLang = lang;
    const strings = uiStrings[lang];
    document.documentElement.lang = lang;

    // Update all UI text elements
    app.elements.uiTitle.textContent = strings.title;
    app.elements.uiSubtitle.textContent = strings.subtitle;
    app.elements.uiApiLabel.textContent = strings.apiLabel;
    app.elements.saveKeyBtn.textContent = strings.save;
    app.elements.uiDbLabel.textContent = strings.dbLabel;
    app.elements.messageInput.placeholder = app.state.db ? strings.inputPlaceholder : strings.inputPlaceholderDisabled;

    // New UI elements
    app.elements.clearChatBtn.textContent = strings.clearChat;
    app.elements.viewSchemaBtn.textContent = app.elements.schemaContainer.classList.contains('hidden') ? strings.viewSchema : strings.hideSchema;

    // Update language button active states
    app.elements.langEnBtn.classList.toggle('active', lang === 'en');
    app.elements.langDeBtn.classList.toggle('active', lang === 'de');

    // Do not clear chat on language change if history is being used
    // app.elements.chatContainer.innerHTML = '';
    // addMessage(app, 'ai', strings.initialMessage);
}

// Enables or disables the chat input and submit button
function setChatState(app, enabled) {
    app.elements.messageInput.disabled = !enabled;
    app.elements.submitButton.disabled = !enabled;
    app.elements.messageInput.placeholder = enabled ? uiStrings[app.state.currentLang].inputPlaceholder : uiStrings[app.state.currentLang].inputPlaceholderDisabled;
}

// Toggles the submit button between send and spinner icons
function setSubmitButtonState(elements, enabled) {
    elements.submitButton.disabled = !enabled;
    if (enabled) {
        elements.sendIcon.classList.remove('hidden');
        elements.spinnerIcon.classList.add('hidden');
    } else {
        elements.sendIcon.classList.add('hidden');
        elements.spinnerIcon.classList.remove('hidden');
    }
}

// Adds a message bubble to the chat container
function addMessage(app, sender, text, type = 'text') {
    const { chatContainer } = app.elements;
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-bubble');

    if (sender === 'user') {
        messageElement.classList.add('user-bubble');
        messageElement.textContent = text;
    } else {
        messageElement.classList.add('ai-bubble');
        if (type === 'code') {
            messageElement.classList.add('code-bubble');

            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = text;
            pre.appendChild(code);

            // --- NEW: Copy Button ---
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = uiStrings[app.state.currentLang].copy;
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(text);
                copyBtn.textContent = uiStrings[app.state.currentLang].copied;
                setTimeout(() => {
                    copyBtn.textContent = uiStrings[app.state.currentLang].copy;
                }, 1500);
            };

            messageElement.appendChild(copyBtn);
            messageElement.appendChild(pre);

        } else {
            const rawHtml = marked.parse(text);
            messageElement.innerHTML = DOMPurify.sanitize(rawHtml);
        }
    }

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageElement;
}

// Shows a "typing..." indicator for the AI
function addTypingIndicator(app) {
    const { chatContainer } = app.elements;
    const indicator = document.createElement('div');
    indicator.classList.add('chat-bubble', 'ai-bubble', 'typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return indicator;
}