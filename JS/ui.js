// Sets the UI language
function setLanguage(lang, elements) {
    currentLang = lang;
    const strings = uiStrings[lang];
    document.documentElement.lang = lang;
    elements.uiTitle.textContent = strings.title;
    elements.uiSubtitle.textContent = strings.subtitle;
    elements.uiApiLabel.textContent = strings.apiLabel;
    elements.saveKeyBtn.textContent = strings.save;
    elements.uiDbLabel.textContent = strings.dbLabel;
    elements.messageInput.placeholder = db ? strings.inputPlaceholder : strings.inputPlaceholderDisabled;
    elements.langEnBtn.classList.toggle('active', lang === 'en');
    elements.langDeBtn.classList.toggle('active', lang === 'de');
    elements.chatContainer.innerHTML = '';
    addMessage(elements.chatContainer, 'ai', strings.initialMessage);
}

// Enables or disables the chat input and submit button
function setChatState(enabled, elements) {
    elements.messageInput.disabled = !enabled;
    elements.submitButton.disabled = !enabled;
    elements.messageInput.placeholder = enabled ? uiStrings[currentLang].inputPlaceholder : uiStrings[currentLang].inputPlaceholderDisabled;
}

// --- UPDATED FUNCTION ---
// Function to add a message bubble to the chat container
function addMessage(chatContainer, sender, text, type = 'text') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-bubble');

    if (sender === 'user') {
        messageElement.classList.add('user-bubble');
        messageElement.textContent = text; // User input is always plain text
    } else { // AI message
        messageElement.classList.add('ai-bubble');
        if (type === 'code') {
            messageElement.classList.add('code-bubble');
            messageElement.textContent = text; // Code is plain text
        } else {
            // Parse AI text as markdown to render tables, lists, etc.
            messageElement.innerHTML = marked.parse(text);
        }
    }

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageElement;
}

// Function to show a "typing..." indicator
function addTypingIndicator(chatContainer) {
    const indicator = document.createElement('div');
    indicator.classList.add('chat-bubble', 'ai-bubble', 'typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return indicator;
}