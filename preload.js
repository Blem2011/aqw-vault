const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    guardarCuenta: (cuenta) => ipcRenderer.invoke('guardar-cuenta', cuenta),
    obtenerCuentas: () => ipcRenderer.invoke('obtener-cuentas'),
    borrarCuenta: (id) => ipcRenderer.invoke('borrar-cuenta', id),
    seleccionarFoto: () => ipcRenderer.invoke('seleccionar-foto'),
    copiarTexto: (texto) => ipcRenderer.invoke('copiar-al-portapapeles', texto),
    
    // --- NUEVAS LÍNEAS PARA RECORDAR EL IDIOMA ---
    guardarIdioma: (idioma) => ipcRenderer.invoke('guardar-idioma', idioma),
    obtenerIdioma: () => ipcRenderer.invoke('obtener-idioma')
});