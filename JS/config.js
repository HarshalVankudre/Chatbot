// AI Model Configuration
const AI_MODELS = [
    { name: 'GPT-5', id: 'gpt-5' },
    { name: 'GPT-5 Mini', id: 'gpt-5-mini' },
    { name: 'GPT-5 Nano', id: 'gpt-5-nano' },
    { name: 'GPT-4o Mini', id: 'gpt-4o-mini' },
    { name: 'GPT-4o', id: 'gpt-4o' },
    { name: 'GPT-3.5 Turbo', id: 'gpt-3.5-turbo' },
];

// UI strings for internationalization (English and German)
const uiStrings = {
    en: {
        title: "AI SQLite Chatbot",
        subtitle: "Ask questions about your local SQLite database.",
        apiLabel: "Step 1: Configure API",
        save: "Save",
        dbLabel: "Step 2: Load your database file (.sqlite, .db)",
        inputPlaceholder: "Type your message...",
        inputPlaceholderDisabled: "Load a database to begin...",
        initialMessage: "Hello! Please save your API key and then load a SQLite database file to get started.",
        keyLoaded: "API key loaded. You can now load a database file.",
        keySaved: "API key saved! Please load a database file.",
        keyMissing: "Please enter a valid API key.",
        dbPrompt: "Please load a database file first.",
        dbLoading: "Initializing SQLite engine...",
        dbReading: "Reading file and loading database...",
        dbSuccess: (name, tables) => `Successfully loaded '${name}'. Found tables: ${tables}. You can now ask questions.`,
        dbError: "Error: The file is not a valid SQLite database. Check the developer console (F12) for more details.",
        sqlGenerating: "AI is generating an SQL query...",
        sqlExecuting: "Executing SQL query...",
        sqlError: (sql) => `The AI-generated SQL query failed to execute. This may be a bug or an invalid query.\n\nGenerated Query:\n${sql}`,
        finalAnswer: "Generating a natural language answer...",
        // New Strings
        clearChat: "Clear Chat",
        viewSchema: "View Schema",
        hideSchema: "Hide Schema",
        copy: "Copy",
        copied: "Copied!",
        sqlCorrection: "Original query failed. Attempting to self-correct...",
        sqlCorrectionFailed: (sql) => `The self-correction also failed. The last attempted query was:\n${sql}`
    },
    de: {
        title: "KI SQLite Chatbot",
        subtitle: "Stellen Sie Fragen zu Ihrer lokalen SQLite-Datenbank.",
        apiLabel: "Schritt 1: API Konfigurieren",
        save: "Speichern",
        dbLabel: "Schritt 2: Laden Sie Ihre Datenbankdatei (.sqlite, .db)",
        inputPlaceholder: "Geben Sie Ihre Nachricht ein...",
        inputPlaceholderDisabled: "Laden Sie eine Datenbank, um zu beginnen...",
        initialMessage: "Hallo! Bitte speichern Sie Ihren API-Schlüssel und laden Sie dann eine SQLite-Datenbankdatei, um zu beginnen.",
        keyLoaded: "API-Schlüssel geladen. Sie können jetzt eine Datenbankdatei laden.",
        keySaved: "API-Schlüssel gespeichert! Bitte laden Sie eine Datenbankdatei.",
        keyMissing: "Bitte geben Sie einen gültigen API-Schlüssel ein.",
        dbPrompt: "Bitte laden Sie zuerst eine Datenbankdatei.",
        dbLoading: "Initialisiere SQLite-Engine...",
        dbReading: "Lese Datei und lade Datenbank...",
        dbSuccess: (name, tables) => `'${name}' erfolgreich geladen. Gefundene Tabellen: ${tables}. Sie können jetzt Fragen stellen.`,
        dbError: "Fehler: Die Datei ist keine gültige SQLite-Datenbank. Prüfen Sie die Entwicklerkonsole (F12) für Details.",
        sqlGenerating: "KI generiert eine SQL-Abfrage...",
        sqlExecuting: "Führe SQL-Abfrage aus...",
        sqlError: (sql) => `Die von der KI generierte SQL-Abfrage konnte nicht ausgeführt werden. Dies kann ein Fehler oder eine ungültige Abfrage sein.\n\nGenerierte Abfrage:\n${sql}`,
        finalAnswer: "Generiere eine natürlichsprachliche Antwort...",
        // New Strings
        clearChat: "Chat leeren",
        viewSchema: "Schema anzeigen",
        hideSchema: "Schema ausblenden",
        copy: "Kopieren",
        copied: "Kopiert!",
        sqlCorrection: "Ursprüngliche Abfrage fehlgeschlagen. Versuche, sich selbst zu korrigieren...",
        sqlCorrectionFailed: (sql) => `Die Selbstkorrektur ist ebenfalls fehlgeschlagen. Die letzte versuchte Abfrage war:\n${sql}`
    }
};