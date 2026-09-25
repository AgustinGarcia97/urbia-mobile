import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from "expo-sqlite";

export async function copiarGtfsSiHaceFalta() {
    const carpetaSqlite = FileSystem.documentDirectory + 'SQLite/';
    const destino = carpetaSqlite + 'gtfs.db';
    const pragma =  process.env.EXPO_PUBLIC_PRAGMA;
    alert(pragma)
    if ((await FileSystem.getInfoAsync(destino)).exists) return; // ya está, no repetir

    await FileSystem.makeDirectoryAsync(carpetaSqlite, { intermediates: true });
    await FileSystem.copyAsync({
        from: 'file:///sdcard/Android/data/com.sigma.urbia/files/gtfs.db',
        to: destino,
    });
    const db = await SQLite.openDatabaseAsync('gtfs.db');
    await db.execAsync(`PRAGMA ${pragma}`);



    const tablas = await db.getAllAsync(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table';
    `);

    console.log("TABLAS:", tablas);

}

