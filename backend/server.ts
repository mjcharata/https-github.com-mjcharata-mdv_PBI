import express from 'express';
import cors from 'cors';
import { testImapConnection } from './imapService';
import { testSqlConnection } from './sqlService';

const app = express();
app.use(cors()); // Permite chamadas do frontend
app.use(express.json());

// Endpoint para testar email
app.post('/api/test-email', async (req, res) => {
  try {
    await testImapConnection(req.body);
    res.json({ success: true, message: 'Conexão IMAP estabelecida com sucesso.' });
  } catch (error: any) {
    console.error('Erro IMAP:', error);
    res.status(400).json({ success: false, error: error.message || 'Falha na conexão IMAP' });
  }
});

// Endpoint para testar SQL
app.post('/api/test-sql', async (req, res) => {
  try {
    await testSqlConnection(req.body);
    res.json({ success: true, message: 'Conexão SQL Server estabelecida com sucesso.' });
  } catch (error: any) {
    console.error('Erro SQL:', error);
    res.status(400).json({ success: false, error: error.message || 'Falha na conexão SQL Server' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend MDV a correr na porta ${PORT}`);
});