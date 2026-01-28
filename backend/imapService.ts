/* 
 * NOTA: Este ficheiro é para ser executado num ambiente Node.js, não no browser.
 * Dependências necessárias: npm install imap-simple simple-parser pdf-parse dotenv
 */

import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
// @ts-ignore: pdf-parse não tem tipos oficiais instalados por padrão neste ambiente
import pdf from 'pdf-parse'; 
import { EstadoPedido } from '../types'; 

// Configuração via Variáveis de Ambiente (Default)
const config = {
  imap: {
    user: process.env.IMAP_USERNAME || 'commercial@mdvmadeiras.com',
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST || 'imap.mdvmadeiras.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: process.env.IMAP_SECURE === 'true',
    authTimeout: 3000,
  },
};

// Palavras-chave para deteção de pedido
const KEYWORDS_PT = ['cotação', 'orcamento', 'orçamento', 'preço', 'preços', 'pedido de cotação'];
const KEYWORDS_EN = ['quotation', 'quote', 'rfq', 'price request', 'pricing'];
const ALL_KEYWORDS = [...KEYWORDS_PT, ...KEYWORDS_EN];

/**
 * Testa a conexão IMAP com as credenciais fornecidas.
 * Usado pelo botão de teste nas definições.
 */
export async function testImapConnection(customConfig: any) {
  const imapConfig = {
    imap: {
      user: customConfig.imapUser,
      password: customConfig.imapPassword,
      host: customConfig.imapHost,
      port: customConfig.imapPort,
      tls: customConfig.imapSecure,
      authTimeout: 5000,
    },
  };

  try {
    const connection = await imap.connect(imapConfig);
    await connection.end();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Tenta extrair o valor total de uma Proforma/Orçamento a partir do texto do PDF.
 * Procura padrões como "Total: 1.234,56" ou "Valor a Pagar: 1000 AOA".
 */
function extractValueFromPdfText(text: string): number | undefined {
  const regexTotal = /(?:total|valor|montante).{0,30}?(\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}(?:,\d{3})*\.\d{2})/i;
  
  const match = text.match(regexTotal);
  if (match && match[1]) {
    let valueStr = match[1];
    if (valueStr.includes(',')) {
      valueStr = valueStr.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(valueStr);
  }
  return undefined;
}

export async function checkEmails() {
  try {
    const connection = await imap.connect(config);
    await connection.openBox('INBOX');

    const delay = 24 * 3600 * 1000;
    const yesterday = new Date();
    yesterday.setTime(Date.now() - delay);
    const searchCriteria = [['SINCE', yesterday.toISOString()]];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const results = [];

    for (const item of messages) {
      const all = item.parts.find((part: any) => part.which === '');
      const idHeader = item.parts.find((part: any) => part.which === 'HEADER');

      if (all && all.body) {
        const parsed = await simpleParser(all.body);
        const subject = parsed.subject || '';
        const text = parsed.text || '';
        const from = parsed.from?.text || '';
        
        const isQuoteRequest = ALL_KEYWORDS.some(keyword => 
          subject.toLowerCase().includes(keyword) || 
          text.toLowerCase().substring(0, 500).includes(keyword) 
        );

        const isInternalResponse = from.includes('@mdvmadeiras.com');

        if (isInternalResponse) {
           if (parsed.attachments && parsed.attachments.length > 0) {
             for (const att of parsed.attachments) {
               if (att.contentType === 'application/pdf') {
                 try {
                   const pdfData = await (pdf as any)(att.content);
                   const extractedValue = extractValueFromPdfText(pdfData.text);
                   
                   if (extractedValue) {
                     console.log(`Valor proforma extraído (${subject}): ${extractedValue} AOA`);
                   }
                 } catch (err) {
                   console.error("Erro ao ler PDF:", err);
                 }
               }
             }
           }
        } else if (isQuoteRequest) {
             results.push({
                email_message_id: idHeader.body['message-id'][0],
                remetente: from,
                assunto: subject,
                data_hora_recepcao: parsed.date,
                preview_texto: text.substring(0, 100)
             });
        }
      }
    }

    connection.end();
    return results;

  } catch (error) {
    console.error("Erro na conexão IMAP:", error);
    throw error;
  }
}