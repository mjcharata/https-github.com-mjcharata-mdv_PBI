import sql from 'mssql';

export async function testSqlConnection(config: any) {
  const sqlConfig = {
    user: config.user,
    password: config.password,
    server: config.server,
    database: config.database,
    port: config.port || 1433,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: true, // Necessário para certificados auto-assinados locais
    },
  };

  try {
    const pool = await sql.connect(sqlConfig);
    // Tenta uma query simples para garantir que a base de dados está acessível
    await pool.request().query('SELECT 1');
    await pool.close();
    return true;
  } catch (error) {
    throw error;
  }
}