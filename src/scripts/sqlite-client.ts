import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from "expo-sqlite";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function copiarGtfsSiHaceFalta() {
    const carpetaSqlite = FileSystem.documentDirectory + 'SQLite/';
    const destino = carpetaSqlite + 'gtfs.db';
    const origen = 'file:///sdcard/Android/data/com.sigma.urbia/files/gtfs.db';

    const infoDestino = await FileSystem.getInfoAsync(destino);
    if (infoDestino.exists && infoDestino.size > 0) return; // ya está, y de verdad tiene contenido

    const infoOrigen = await FileSystem.getInfoAsync(origen);
    if (!infoOrigen.exists) {
        console.log('Todavía no llegó el gtfs.db al almacenamiento público — nada para copiar');
        return;
    }

    await FileSystem.makeDirectoryAsync(carpetaSqlite, { intermediates: true });
    if (infoDestino.exists) await FileSystem.deleteAsync(destino); // sacar el roto antes de copiar de nuevo
    await FileSystem.copyAsync({ from: origen, to: destino });
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!dbPromise) {
        dbPromise = (async () => {
            // Copiar ANTES de abrir: si abrimos primero, SQLite crea un gtfs.db vacío y la conexión queda apuntando a ese archivo
            await copiarGtfsSiHaceFalta();
            const clave = process.env.EXPO_PUBLIC_PRAGMA; // ojo, seguís usando EXPO_PUBLIC_PRAGMA en el código que pegaste
            const db = await SQLite.openDatabaseAsync('gtfs.db');
            await db.execAsync(`PRAGMA key = '${clave}'`);
            return db;
        })();
    }
    return dbPromise;
}