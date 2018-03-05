module.exports = {
  database: {
    name: process.env.DATABASE_NAME || 'notes',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 26257,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'unsecurepassword',
    pool_size: { min: 0, max: 1 }
  }
};
