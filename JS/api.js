// Helper function to call the OpenAI API
async function callOpenAI(messages, model, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, stream: false })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

// The core function to handle the AI interaction
async function getAIResponse(userQuery, app) {
    const { state, elements } = app;
    state.isModelRunning = true;
    setSubmitButtonState(elements, false); // Disable button and show spinner

    state.conversationHistory.push({ role: "user", content: userQuery });
    saveHistory(app);
    const typingIndicator = addTypingIndicator(app);

    try {
        // --- PROMPT FOR SQL GENERATION ---
        const textToSqlPrompt = `
        You are an expert SQLite programmer. Based on the conversation history and the database schema below, write a single, valid SQLite query to answer the user's LATEST question.

        **Rules:**
        1.  **Use conversation history for context.** The user may ask follow-up questions or use pronouns (like "he", "their", "it") that refer to previous results.
        2.  **Be flexible with names and text.** Generate case-insensitive queries (e.g., using LOWER() or COLLATE NOCASE) and use LIKE for partial text matches.
        3.  **Only return the SQL query**, with no explanation or other text.

        **Database Schema:**
        ${state.dbSchema}

        **User's LATEST Question:** "${userQuery}"`;

        const sqlMessages = [
            { role: "system", content: "You are an expert SQLite programmer." },
            ...state.conversationHistory.slice(-6, -1), // Include recent history for context
            { role: "user", content: textToSqlPrompt }
        ];

        // STEP 1: Generate SQL from natural language
        typingIndicator.textContent = uiStrings[state.currentLang].sqlGenerating;
        const sqlResponse = await callOpenAI(sqlMessages, state.selectedModel, state.apiKey);
        let generatedSql = sqlResponse.replace(/^```sql\n?|```$/g, '').trim();

        addMessage(app, 'ai', `${generatedSql}`, 'code');
        state.conversationHistory.push({ role: "assistant", content: `Generated SQL: ${generatedSql}` });
        saveHistory(app);

        // STEP 2: Execute the generated SQL query
        typingIndicator.textContent = uiStrings[state.currentLang].sqlExecuting;
        let queryResultData;
        try {
            const results = state.db.exec(generatedSql);
            queryResultData = results.length > 0 ? results.map(r => ({ columns: r.columns, values: r.values })) : "Query executed successfully, but returned no data.";
        } catch (e) {
            console.error("SQL EXECUTION FAILED:", e);
            // --- NEW: SELF-CORRECTION LOGIC ---
            addMessage(app, 'ai', uiStrings[state.currentLang].sqlCorrection, 'text');

            const fixSqlPrompt = `The following SQLite query failed:\n\`\`\`sql\n${generatedSql}\n\`\`\`\nThe error message was: "${e.message}"\nPlease correct the query based on this error and the database schema. Only return the corrected SQL query.`;
            const fixMessages = [{ role: "system", content: "You are an expert SQLite programmer that corrects faulty queries." }, { role: "user", content: fixSqlPrompt }];

            const correctedSqlResponse = await callOpenAI(fixMessages, state.selectedModel, state.apiKey);
            generatedSql = correctedSqlResponse.replace(/^```sql\n?|```$/g, '').trim(); // Re-assign to generatedSql

            addMessage(app, 'ai', `${generatedSql}`, 'code');
            state.conversationHistory.push({ role: "assistant", content: `Corrected SQL: ${generatedSql}` });
            saveHistory(app);

            try {
                const results = state.db.exec(generatedSql);
                queryResultData = results.length > 0 ? results.map(r => ({ columns: r.columns, values: r.values })) : "Query executed successfully, but returned no data.";
            } catch (finalError) {
                 console.error("CORRECTED SQL EXECUTION FAILED:", finalError);
                 throw new Error(uiStrings[state.currentLang].sqlCorrectionFailed(generatedSql));
            }
        }

        // STEP 3: Generate a natural language response from the SQL results
        const sqlToTextPrompt = `You are a helpful AI assistant. Your primary task is to detect the language of the user's original question and respond *exclusively* in that same language.

        **Formatting Rules:**
        1.  **Language and Currency:** If the question is in English, respond in English and format currency with a dollar sign (e.g., $25.00). If in German, respond in German and format currency with a Euro sign and comma (e.g., 25,00 €).
        2.  **Tables:** If the query result is a list of items (e.g., multiple employees, products, or records), you MUST format the data as a markdown table. Do not use a table for single-value answers (e.g., "The total is 5" or "The highest salary belongs to KING").
        
        Based on the conversation history, the user's LATEST question, and the following data from a database query, provide a clear and friendly answer.
        
        **User's LATEST Question:** "${userQuery}"
        **Data from the query:** ${JSON.stringify(queryResultData)}`;

        const finalAnswerMessages = [
            { role: "system", content: "You are a helpful data analyst assistant." },
            ...state.conversationHistory.slice(-6),
            { role: "user", content: sqlToTextPrompt }
        ];

        typingIndicator.textContent = uiStrings[state.currentLang].finalAnswer;
        const aiText = await callOpenAI(finalAnswerMessages, state.selectedModel, state.apiKey);

        typingIndicator.remove();
        addMessage(app, 'ai', aiText);
        state.conversationHistory.push({ role: "assistant", content: aiText });
        saveHistory(app);

    } catch (error) {
        console.error("Error in AI Response chain:", error);
        typingIndicator.remove();
        const errorMessage = `Error: ${error.message}`;
        addMessage(app, 'ai', errorMessage);
        state.conversationHistory.push({ role: "assistant", content: errorMessage });
        saveHistory(app);
    } finally {
        if (state.conversationHistory.length > 20) {
            state.conversationHistory = state.conversationHistory.slice(-20); // Increased history limit
        }
        state.isModelRunning = false;
        if (state.db) {
            setSubmitButtonState(elements, true); // Re-enable button
            elements.messageInput.focus();
        }
    }
}