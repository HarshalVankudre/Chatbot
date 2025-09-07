// Asynchronously loads the sql.js library
async function loadSqlJs(dbStatus) {
    if (sqlJs) return;
    dbStatus.textContent = uiStrings[currentLang].dbLoading;
    dbStatus.style.color = 'orange';
    sqlJs = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
}

// Handles the database file loading logic
function handleDbFileChange(event, elements) {
    const file = event.target.files[0];
    if (!file) return;

    elements.dbStatus.textContent = uiStrings[currentLang].dbReading;
    elements.dbStatus.style.color = 'orange';
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const Uints = new Uint8Array(e.target.result);
            db = new sqlJs.Database(Uints);
            const schemaRes = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
            if (schemaRes.length === 0 || !schemaRes[0] || schemaRes[0].values.length === 0) { throw new Error("No tables found in the database."); }
            dbSchema = schemaRes[0].values.map(row => row[0]).join('\n\n');
            const tableNames = schemaRes[0].values.map(row => {
                const createStatement = row[0];
                const match = createStatement.match(/CREATE TABLE\s+"?(\w+)"?/i);
                return match ? match[1] : 'unknown_table';
            }).join(', ');
            elements.dbStatus.textContent = uiStrings[currentLang].dbSuccess(file.name, tableNames);
            elements.dbStatus.style.color = 'green';
            setChatState(true, elements);
        } catch (error) {
            console.error("DATABASE LOAD FAILED:", error);
            db = null;
            elements.dbStatus.textContent = uiStrings[currentLang].dbError;
            elements.dbStatus.style.color = 'red';
            setChatState(false, elements);
        }
    };
    reader.readAsArrayBuffer(file);
}