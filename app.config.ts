import 'dotenv/config';

export default {
    expo: {
        name: "Urbia",
        slug: "urbia",
        scheme:"urbia",
        version: "1.0.0",
        android: {
            package: "com.sigma.urbia",
            permissions: ["ACCESS_FINE_LOCATION"]
        },
        ios: {
            bundleIdentifier: "com.sigma.urbia",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "Para mostrarte tu posición en el mapa"
            }
        },
        plugins: [
            "@rnmapbox/maps",
            ["expo-location", { locationWhenInUsePermission: "Mostrar tu posición en el mapa" }]
        ]
    }
};