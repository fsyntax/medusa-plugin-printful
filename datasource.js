const { DataSource } = require("typeorm")

const AppDataSource = new DataSource({
    type: "postgres",
    port: 5432,
    username: "postgres",
    password: "fischi123",
    database: "medusa-db-wsfmx",
    entities: [
        "dist/models/printful-webhook-config.js",
        "dist/models/printful-webhook-events.js",
    ],
    migrations: [
        "dist/migrations/*.js",
    ],
})

module.exports = {
    datasource: AppDataSource,
}
