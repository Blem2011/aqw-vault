// 1. Añadimos 'nativeTheme' a las importaciones de Electron
const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');

let db;

async function initDatabase() {
    const { JSONFilePreset } = await import('lowdb/node');
    
    // Ruta directa donde está la carpeta del programa
    const carpetaEjecutable = path.dirname(process.execPath);
    const rutaPortableReal = path.join(carpetaEjecutable, 'db.json');
    
    const defaultData = { cuentas: [], config: { idioma: 'es' } };
    db = await JSONFilePreset(rutaPortableReal, defaultData);
}



function createWindow() {
    const win = new BrowserWindow({
        // Definimos la resolución exacta de apertura
        width: 1100,
        height: 800,
        
        // --- EL TRUCO PARA ELIMINAR BUGS DE ESCALADO ---
        resizable: false,    // Bloquea que el usuario pueda estirar la ventana desde las esquinas
        maximizable: false,  // Deshabilita el botón de pantalla completa de Windows
        
        autoHideMenuBar: true,
        backgroundColor: '#121212', 
        darkTheme: true, 
        icon: path.join(__dirname, 'icon.png'), 
        
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
}


app.whenReady().then(async () => {
    // 2. FORZAMOS A WINDOWS A PINTAR LA BARRA TRADICIONAL EN MODO OSCURO
    nativeTheme.themeSource = 'dark';

    await initDatabase();
    createWindow();

    // --- ESCUCHADORES IPC (HTML -> Node.js) ---
    
    ipcMain.handle('obtener-cuentas', async () => {
        return db.data.cuentas;
    });

    ipcMain.handle('guardar-cuenta', async (event, cuentaData) => {
        const index = db.data.cuentas.findIndex(c => c.id === cuentaData.id);
        
        if (index !== -1) {
            db.data.cuentas[index] = cuentaData;
        } else {
            db.data.cuentas.push(cuentaData);
        }
        
        await db.write();
        return db.data.cuentas;
    });

    ipcMain.handle('borrar-cuenta', async (event, idCuenta) => {
        db.data.cuentas = db.data.cuentas.filter(c => c.id !== idCuenta);
        await db.write();
        return db.data.cuentas;
    });

    ipcMain.handle('seleccionar-foto', async () => {
        const { dialog } = require('electron');
        
        const resultado = await dialog.showOpenDialog({
            title: 'Seleccionar foto del personaje',
            properties: ['openFile'],
            filters: [
                { name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }
            ]
        });

        if (!resultado.canceled && resultado.filePaths.length > 0) {
            return resultado.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('copiar-al-portapapeles', async (event, texto) => {
        const { clipboard } = require('electron');
        clipboard.writeText(texto);
        return true;
    });
        // Guardar el idioma seleccionado en db.json
    ipcMain.handle('guardar-idioma', async (event, nuevoIdioma) => {
        if (!db.data.config) db.data.config = {};
        db.data.config.idioma = nuevoIdioma;
        await db.write();
        return db.data.config.idioma;
    });

    // Obtener el idioma guardado al iniciar la app
    ipcMain.handle('obtener-idioma', async () => {
        if (db.data.config && db.data.config.idioma) {
            return db.data.config.idioma;
        }
        return 'es'; // Por si acaso devuelve español por defecto
    });

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
