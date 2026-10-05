export const getTransportData = 'SELECT *\n' +
    'FROM (\n' +
    '    SELECT\n' +
    '        r.feed_id AS tipo,\n' +
    '\n' +
    '        CASE\n' +
    '            WHEN r.feed_id = \'bus\'\n' +
    '            THEN CAST(CAST(r.route_short_name AS INTEGER) AS TEXT)\n' +
    '            ELSE r.route_short_name\n' +
    '        END AS linea,\n' +
    '\n' +
    '        CASE r.feed_id\n' +
    '            WHEN \'bus\'  THEN r.route_short_name\n' +
    '            WHEN \'tren\' THEN r.route_long_name\n' +
    '        END AS ramal,\n' +
    '\n' +
    '        r.route_id,\n' +
    '        a.agency_name AS empresa,\n' +
    '\n' +
    '        CASE\n' +
    '            WHEN r.feed_id = \'bus\' THEN (\n' +
    '                SELECT t.trip_headsign\n' +
    '                FROM trips t\n' +
    '                WHERE t.route_id = r.route_id\n' +
    '                  AND t.direction_id = 0\n' +
    '                LIMIT 1\n' +
    '            )\n' +
    '        END AS destino\n' +
    '\n' +
    '    FROM routes r\n' +
    '    LEFT JOIN agency a\n' +
    '        ON a.agency_id = r.agency_id\n' +
    ') x\n' +
    '\n' +
    'ORDER BY\n' +
    '    CASE x.tipo\n' +
    '        WHEN \'subte\' THEN 1\n' +
    '        WHEN \'tren\'  THEN 2\n' +
    '        ELSE 3\n' +
    '    END,\n' +
    '\n' +
    '    CASE\n' +
    '        WHEN CAST(x.linea AS INTEGER) > 0\n' +
    '        THEN CAST(x.linea AS INTEGER)\n' +
    '        ELSE 999999\n' +
    '    END,\n' +
    '\n' +
    '    x.linea,\n' +
    '    x.ramal;'
