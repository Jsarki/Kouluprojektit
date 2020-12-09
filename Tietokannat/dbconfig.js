const { Pool } = require('pg')

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  port: 5432,
  database: "customer",
  password: "password123"
})

module.exports = {
  query: (text, params) => pool.query(text, params),
}
