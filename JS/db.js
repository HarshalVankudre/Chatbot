// Asynchronously loads the sql.js library
async function loadSqlJs(app) {
    if (app.state.sqlJs) return;
    app.elements.dbStatus.textContent = uiStrings[app.state.currentLang].dbLoading;
    app.elements.dbStatus.style.color = 'orange';
    app.state.sqlJs = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
}

// Extracts schema and table names from the database
function extractDbSchema(database) {
    const schemaRes = database.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");

    if (schemaRes.length === 0 || !schemaRes[0] || schemaRes[0].values.length === 0) {
        throw new Error("No tables found in the database.");
    }

    const schema = schemaRes[0].values.map(row => row[0]).join('\n\n');

    const tableNames = schemaRes[0].values.map(row => {
        const createStatement = row[0];
        const match = createStatement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:`|'|"|\[)?(\w+)(?:`|'|"|\])?\s*\(/i);
        return match ? match[1] : 'unknown_table';
    }).join(', ');

    return { schema, tableNames };
}

// Handles the database file loading logic
function handleDbFileChange(event, app) {
    const file = event.target.files[0];
    if (!file) return;

    app.elements.dbStatus.textContent = uiStrings[app.state.currentLang].dbReading;
    app.elements.dbStatus.style.color = 'orange';
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const Uints = new Uint8Array(e.target.result);
            app.state.db = new app.state.sqlJs.Database(Uints);

            const { schema, tableNames } = extractDbSchema(app.state.db);
            app.state.dbSchema = schema;

            app.elements.dbStatus.textContent = uiStrings[app.state.currentLang].dbSuccess(file.name, tableNames);
            app.elements.dbStatus.style.color = 'green';
            setChatState(app, true);

            // NEW: Populate and show schema viewer
            app.elements.schemaPre.textContent = schema;
            app.elements.viewSchemaBtn.classList.remove('hidden');

        } catch (error) {
            console.error("DATABASE LOAD FAILED:", error);
            app.state.db = null;
            app.state.dbSchema = '';
            app.elements.dbStatus.textContent = uiStrings[app.state.currentLang].dbError;
            app.elements.dbStatus.style.color = 'red';
            setChatState(app, false);
            app.elements.viewSchemaBtn.classList.add('hidden');
        }
    };
    reader.onerror = () => {
        console.error("File reading failed.");
        app.elements.dbStatus.textContent = "Error reading the file.";
        app.elements.dbStatus.style.color = 'red';
    };
    reader.readAsArrayBuffer(file);
}