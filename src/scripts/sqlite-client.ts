import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from "expo-sqlite";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function copiarGtfsSiHaceFalta() {
    const destino = FileSystem.documentDirectory + 'SQLite/gtfs.db';
    if ((await FileSystem.getInfoAsync(destino)).exists) return; // esto SÍ se salta bien

    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite/', { intermediates: true });
    await FileSystem.copyAsync({ from: 'file:///sdcard/Android/data/com.sigma.urbia/files/gtfs.db', to: destino });

}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (dbInstance) return dbInstance;
    const clave = process.env.EXPO_PUBLIC_PRAGMA;
    const db = await SQLite.openDatabaseAsync('gtfs.db');
    await db.execAsync(`PRAGMA key = '${clave}'`);
    dbInstance = db;
    return dbInstance;
}
