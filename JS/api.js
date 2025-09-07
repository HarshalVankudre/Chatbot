// The core function to handle the AI interaction
async function getAIResponse(userQuery, elements) {
    // Add user message to history
    conversationHistory.push({ role: "user", content: userQuery });

    const typingIndicator = addTypingIndicator(elements.chatContainer);
    elements.submitButton.disabled = true;

    try {
        // --- PROMPT FOR SQL GENERATION ---
        const textToSqlPrompt = `
        You are an expert SQLite programmer. Based on the conversation history and the database schema below, write a single, valid SQLite query to answer the user's LATEST question.

        **Rules:**
        1.  **Use conversation history for context.** The user may ask follow-up questions or use pronouns (like "he", "their", "it") that refer to previous results.
        2.  **Be flexible with names and text.** User input may have typos or incorrect capitalization. Generate queries that are case-insensitive (e.g., using LOWER() or COLLATE NOCASE) and can handle minor spelling errors (e.g., using the LIKE operator) when searching for text.
        3.  **Only return the SQL query**, with no explanation or other text.

        **Database Schema:**
        ${dbSchema}

        **User's LATEST Question:** "${userQuery}"`;

        // Create messages array with history
        const sqlMessages = [
            { role: "system", content: "You are an expert SQLite programmer." },
            ...conversationHistory.slice(-6, -1), // Include recent history for context
            { role: "user", content: textToSqlPrompt }
        ];

        // STEP 1: Generate SQL from natural language
        typingIndicator.textContent = uiStrings[currentLang].sqlGenerating;
        const sqlResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Authorization': `Bearer ${openaiApiKey}` },
            body: JSON.stringify({ model: "gpt-5-nano-2025-08-07", messages: sqlMessages })
        });
        if (!sqlResponse.ok) throw new Error(`OpenAI API Error: ${(await sqlResponse.json()).error.message}`);
        const sqlResult = await sqlResponse.json();
        let generatedSql = sqlResult.choices[0].message.content.trim();
        if (generatedSql.startsWith("```sql")) { generatedSql = generatedSql.substring(6, generatedSql.length - 3).trim(); }
        else if (generatedSql.startsWith("```")) { generatedSql = generatedSql.substring(3, generatedSql.length - 3).trim(); }

        addMessage(elements.chatContainer, 'ai', `SQL Query:\n${generatedSql}`, 'code');
        conversationHistory.push({ role: "assistant", content: `Generated SQL: ${generatedSql}` });

        // STEP 2: Execute the generated SQL query
        typingIndicator.textContent = uiStrings[currentLang].sqlExecuting;
        let queryResultData;
        try {
            const results = db.exec(generatedSql);
            queryResultData = results.length > 0 ? results.map(r => ({ columns: r.columns, values: r.values })) : "Query executed successfully, but returned no data.";
        } catch (e) {
            console.error("SQL EXECUTION FAILED:", e);
            throw new Error(uiStrings[currentLang].sqlError(generatedSql));
        }

        // --- UPDATED PROMPT WITH TABLE FORMATTING ---
        const sqlToTextPrompt = `You are a helpful AI assistant. Your primary task is to detect the language of the user's original question and respond *exclusively* in that same language.

        **Formatting Rules:**
        1.  **Language and Currency:** If the question is in English, respond in English and format currency with a dollar sign (e.g., $25.00). If in German, respond in German and format currency with a Euro sign and comma (e.g., 25,00 €).
        2.  **Tables:** If the query result is a list of items (e.g., multiple employees, products, or records), you MUST format the data as a markdown table. Do not use a table for single-value answers (e.g., "The total is 5" or "The highest salary belongs to KING").
        
        Based on the conversation history, the user's LATEST question, and the following data from a database query, provide a clear and friendly answer.
        
        **User's LATEST Question:** "${userQuery}"
        **Data from the query:** ${JSON.stringify(queryResultData)}`;

        // Create messages array with history for the final answer
        const finalAnswerMessages = [
            { role: "system", content: "You are a helpful data analyst assistant." },
            ...conversationHistory.slice(-6), // Include recent history for context
            { role: "user", content: sqlToTextPrompt }
        ];

        // STEP 3: Generate a natural language response from the SQL results
        typingIndicator.textContent = uiStrings[currentLang].finalAnswer;
        const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Authorization': `Bearer ${openaiApiKey}` },
            body: JSON.stringify({ model: "gpt-5-nano-2025-08-07", messages: finalAnswerMessages })
        });
        if (!finalResponse.ok) throw new Error(`OpenAI API Error: ${(await finalResponse.json()).error.message}`);
        const finalResult = await finalResponse.json();
        const aiText = finalResult.choices[0].message.content;

        typingIndicator.remove();
        addMessage(elements.chatContainer, 'ai', aiText);
        conversationHistory.push({ role: "assistant", content: aiText });

    } catch (error) {
        console.error("Error in AI Response chain:", error);
        typingIndicator.remove();
        const errorMessage = `Error: ${error.message}`;
        addMessage(elements.chatContainer, 'ai', errorMessage);
        conversationHistory.push({ role: "assistant", content: errorMessage });
    } finally {
        // Keep history from getting too long
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }
        if (db) elements.submitButton.disabled = false;
        elements.messageInput.focus();
    }
}