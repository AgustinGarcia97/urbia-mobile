import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('gtfs.db');

const tablas = await db.getAllAsync(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table';
`);

console.log(tablas)