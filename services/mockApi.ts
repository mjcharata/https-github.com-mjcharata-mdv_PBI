import { PedidoCotacao, EstadoPedido, User, UserRole, EmailConfig, SqlConfig, Venda, Colaborador, MovimentoPonto, TipoMovimento, Ausencia, PedidoFerias, EstadoAprovacao, RoleAccessConfig, AppPermission, Cliente, DocumentoDivida, EmailMessage } from '../types';

// Famílias de produtos típicas da MDV
const PRODUCT_FAMILIES = [
  'Madeiras Maciças',
  'Derivados (MDF/Aglomerados)',
  'Pavimentos e Revestimentos',
  'Contraplacados',
  'Orlas e Colas',
  'Carpintaria / Serviços'
];

// --- DADOS EMAILS (MOCK) ---
const generateEmails = (): EmailMessage[] => {
  const emails: EmailMessage[] = [];
  
  // INBOX
  emails.push({
    id: 'e1', folder: 'INBOX',
    from: { name: 'João Silva', email: 'joao.silva@construcoes.ao', avatar: 'JS' },
    to: ['comercial@mdv.ao'],
    subject: 'Pedido de Cotação - Obra Talatona',
    preview: 'Bom dia, gostaríamos de solicitar orçamento para...',
    body: `<p>Bom dia,</p><p>Gostaríamos de solicitar orçamento para os seguintes materiais para a nossa obra em Talatona:</p><ul><li>50 un - Placas MDF 18mm Hidrófugo</li><li>100 m2 - Deck Ipê</li></ul><p>Aguardo breve resposta.</p><p>Cumprimentos,<br>João Silva</p>`,
    date: new Date().toISOString(),
    read: false, starred: true, hasAttachments: true,
    attachments: [{ name: 'lista_materiais.pdf', size: '1.2 MB', type: 'application/pdf' }]
  });

  emails.push({
    id: 'e2', folder: 'INBOX',
    from: { name: 'Maria Santos', email: 'maria.arq@design.ao', avatar: 'MS' },
    to: ['comercial@mdv.ao'],
    subject: 'Dúvida sobre stock de Carvalho',
    preview: 'Olá, podem confirmar se têm pranchas de carvalho...',
    body: `<p>Olá,</p><p>Podem confirmar se têm pranchas de Carvalho Americano em stock? Precisamos de cerca de 3m3 para um projeto de mobiliário.</p><p>Obrigada.</p>`,
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    read: true, starred: false, hasAttachments: false
  });
  
  emails.push({
    id: 'e3', folder: 'INBOX',
    from: { name: 'Fornecedor Madeiras Global', email: 'sales@globalwood.com', avatar: 'GW' },
    to: ['compras@mdv.ao'],
    subject: 'Envio de Fatura Proforma #2991',
    preview: 'Segue em anexo a proforma referente à vossa encomenda...',
    body: `<p>Estimados,</p><p>Segue em anexo a proforma referente à vossa encomenda de Pinho tratado.</p><p>Favor enviar comprovativo de pagamento.</p>`,
    date: new Date(Date.now() - 86400000).toISOString(), // Ontem
    read: true, starred: false, hasAttachments: true,
    attachments: [{ name: 'proforma_2991.pdf', size: '450 KB', type: 'application/pdf' }]
  });

  // SENT
  emails.push({
    id: 'e4', folder: 'SENT',
    from: { name: 'Carlos Manuel', email: 'carlos@mdv.ao', avatar: 'CM' },
    to: ['joao.silva@construcoes.ao'],
    subject: 'RE: Pedido de Cotação - Obra Talatona',
    preview: 'Bom dia Sr. João, segue em anexo a nossa proposta...',
    body: `<p>Bom dia Sr. João,</p><p>Obrigado pela preferência. Segue em anexo a nossa proposta nº 2024/500 para os materiais solicitados.</p><p>Temos todo o material em stock para entrega imediata.</p><p>Atenciosamente,<br>Carlos Manuel<br>MDV Madeiras</p>`,
    date: new Date().toISOString(),
    read: true, starred: false, hasAttachments: true,
    attachments: [{ name: 'Cotacao_2024_500.pdf', size: '200 KB', type: 'application/pdf' }]
  });

   emails.push({
    id: 'e5', folder: 'SENT',
    from: { name: 'Ana Sousa', email: 'ana@mdv.ao', avatar: 'AS' },
    to: ['geral@clienteantigo.ao'],
    subject: 'Campanha de Saldos - Deck',
    preview: 'Estimado cliente, informamos que estamos com uma campanha...',
    body: `<p>Estimado cliente,</p><p>Informamos que estamos com uma campanha especial de descontos em Deck Compósito até final do mês.</p><p>Aproveite!</p>`,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    read: true, starred: false, hasAttachments: false
  });

  return emails;
};

// --- DADOS CLIENTES & DÍVIDAS (MOCK) ---
const generateClients = (): Cliente[] => {
  const clients: Cliente[] = [];
  const names = [
    'Construções Silva & Filhos', 'Mobiliário Moderno Lda', 'Obra Grande SA', 
    'Marcenaria Arte', 'Empreiteiros Unidos', 'Design Interiores Pro',
    'João Manuel Particular', 'Carpintaria Central', 'Global Wood Export', 'António Costa Unipessoal'
  ];

  names.forEach((name, idx) => {
    const isB2B = !name.includes('Particular') && !name.includes('António');
    const totalFaturado = 500000 + Math.floor(Math.random() * 5000000);
    const totalAnterior = totalFaturado * (0.8 + Math.random() * 0.4); // +/- 20%
    
    clients.push({
      id: `cli_${idx + 1}`,
      nome: name,
      nif: isB2B ? `50${Math.floor(Math.random() * 10000000)}` : `2${Math.floor(Math.random() * 10000000)}`,
      tipo: isB2B ? 'B2B' : 'B2C',
      localidade: ['Luanda', 'Benguela', 'Huambo', 'Lobito'][Math.floor(Math.random() * 4)],
      total_faturado_ano: totalFaturado,
      total_faturado_anterior: totalAnterior,
      margem_lucro_media: 15 + Math.floor(Math.random() * 25),
      prazo_medio_pagamento: 15 + Math.floor(Math.random() * 45),
      total_divida: Math.random() > 0.3 ? Math.floor(Math.random() * 800000) : 0,
      limite_credito: isB2B ? 2000000 : 500000,
      top_produtos: [
        { nome: PRODUCT_FAMILIES[0], valor: totalFaturado * 0.4 },
        { nome: PRODUCT_FAMILIES[1], valor: totalFaturado * 0.3 },
        { nome: PRODUCT_FAMILIES[3], valor: totalFaturado * 0.1 }
      ]
    });
  });
  return clients;
};

const generateDebts = (clientId: string): DocumentoDivida[] => {
  const count = Math.floor(Math.random() * 5); // 0 a 4 dívidas
  const debts: DocumentoDivida[] = [];
  for (let i = 0; i < count; i++) {
    const emissionDate = new Date();
    emissionDate.setDate(emissionDate.getDate() - Math.floor(Math.random() * 90));
    
    const dueDate = new Date(emissionDate);
    dueDate.setDate(dueDate.getDate() + 30);
    
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    debts.push({
      id: `doc_${clientId}_${i}`,
      documento: `FT 2024/${1000 + Math.floor(Math.random() * 5000)}`,
      data_emissao: emissionDate.toISOString(),
      data_vencimento: dueDate.toISOString(),
      valor_pendente: 50000 + Math.floor(Math.random() * 450000),
      dias_atraso: diffDays > 0 ? diffDays : 0
    });
  }
  return debts;
};

// --- DADOS INICIAIS (MOCK) ---
const mockPedidos: PedidoCotacao[] = Array.from({ length: 25 }).map((_, i) => {
  const states = Object.values(EstadoPedido);
  const state = states[Math.floor(Math.random() * states.length)];
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 10));
  date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));

  const subjects = ['Cotação Madeira Pinho', 'Orçamento Deck', 'Preço MDF Hidrófugo', 'Cotação para Obra Luanda', 'Fornecimento Vigas'];
  const senders = ['joao.silva@gmail.com', 'compras@construcoes.ao', 'marta.pereira@hotmail.com', 'geral@carpintarialopes.ao'];
  const families = ['Madeiras Maciças', 'Derivados', 'Pavimentos', 'Contraplacados'];

  return {
    id_interno: `REQ-${2024000 + i}`,
    email_message_id: `msg-${i}`,
    remetente: senders[Math.floor(Math.random() * senders.length)],
    assunto: subjects[Math.floor(Math.random() * subjects.length)],
    data_hora_recepcao: date.toISOString(),
    estado: state,
    preview_texto: 'Bom dia, solicito cotação para os seguintes materiais...',
    familia_produto: families[Math.floor(Math.random() * families.length)],
    valor_proforma: state === EstadoPedido.RESPONDIDO ? Math.floor(Math.random() * 1000000) : undefined,
    tempo_resposta_minutos: state === EstadoPedido.RESPONDIDO ? Math.floor(Math.random() * 480) : undefined,
    responsavel: state !== EstadoPedido.PENDENTE ? 'Carlos Vendedor' : undefined
  };
});

const mockVendas: Venda[] = Array.from({ length: 50 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 60));
  return {
    id: `venda-${i}`,
    numero_fatura: `FT 2024/${500 + i}`,
    data_venda: date.toISOString(),
    cliente_nome: `Cliente ${i % 5 === 0 ? 'Empresa' : 'Particular'} ${i}`,
    cliente_nif: `500${100000 + i}`,
    total_liquido: 100000,
    total_imposto: 14000,
    total_bruto: 114000 + Math.floor(Math.random() * 500000),
    vendedor: ['Carlos Manuel', 'Ana Sousa', 'Pedro Costa'][Math.floor(Math.random() * 3)],
    familia_produto: PRODUCT_FAMILIES[Math.floor(Math.random() * PRODUCT_FAMILIES.length)],
    estado: Math.random() > 0.1 ? 'PAGO' : 'PENDENTE'
  };
});

const mockUsers: User[] = [
  { id: '1', name: 'Carlos Manuel', email: 'carlos@mdv.ao', role: UserRole.ADMIN, avatarInitials: 'CM', active: true },
  { id: '2', name: 'Ana Sousa', email: 'ana@mdv.ao', role: UserRole.MANAGER, avatarInitials: 'AS', active: true },
  { id: '3', name: 'Pedro Costa', email: 'pedro@mdv.ao', role: UserRole.OPERATOR, avatarInitials: 'PC', active: true }
];

const mockColaboradores: Colaborador[] = [
  { id: 'c1', nome: 'João Operário', email: 'joao@mdv.ao', cargo: 'Operador de Máquinas', departamento: 'Produção', saldo_ferias: 22, ativo: true },
  { id: 'c2', nome: 'Maria Silva', email: 'maria@mdv.ao', cargo: 'Assistente RH', departamento: 'Recursos Humanos', saldo_ferias: 15, ativo: true },
  { id: 'c3', nome: 'António Motorista', email: 'antonio@mdv.ao', cargo: 'Logística', departamento: 'Logística', saldo_ferias: 5, ativo: true }
];

const mockAusencias: Ausencia[] = [
  { id: 'a1', colaborador_id: 'c1', colaborador_nome: 'João Operário', data_inicio: '2024-03-10', data_fim: '2024-03-12', tipo: 'DOENCA', motivo: 'Gripe', estado: EstadoAprovacao.APROVADO }
];

const mockFerias: PedidoFerias[] = [
  { id: 'f1', colaborador_id: 'c2', colaborador_nome: 'Maria Silva', data_inicio: '2024-08-01', data_fim: '2024-08-15', dias_uteis: 10, estado: EstadoAprovacao.PENDENTE, observacoes: 'Férias de Verão' }
];

const mockClients = generateClients();
const mockEmails = generateEmails();

// Armazenamento em memória (simulado)
let localPedidos = [...mockPedidos];
let localEmailConfig: EmailConfig = { imapHost: 'imap.gmail.com', imapPort: 993, imapUser: 'demo@mdv.ao', imapSecure: true, searchKeywords: 'cotação, orçamento' };
let localSqlConfig: SqlConfig = { server: '192.168.1.10', database: 'PHC_MDV', user: 'sa', port: 1433, encrypt: false, mappings: [
    { key: 'numero_fatura', label: 'Nº Fatura', sqlTable: 'ft', sqlColumn: 'ftstamp', required: true },
    { key: 'total_bruto', label: 'Total Bruto', sqlTable: 'ft', sqlColumn: 'etotal', required: true },
    { key: 'cliente_nome', label: 'Nome Cliente', sqlTable: 'cl', sqlColumn: 'nome', required: true }
]};
let localUsers = [...mockUsers];
let localColaboradores = [...mockColaboradores];
let localEmails = [...mockEmails];

// Access Control List (ACL) - Mock
let localAcl: RoleAccessConfig[] = [
  { 
    role: UserRole.ADMIN, 
    permissions: Object.values(AppPermission) // All permissions
  },
  {
    role: UserRole.MANAGER,
    permissions: [
      AppPermission.VIEW_DASHBOARD, AppPermission.VIEW_QUOTES, AppPermission.EDIT_QUOTES, 
      AppPermission.VIEW_SALES, AppPermission.VIEW_CUSTOMERS, AppPermission.VIEW_ATTENDANCE, 
      AppPermission.MANAGE_ABSENCES, AppPermission.MANAGE_VACATIONS, AppPermission.VIEW_EMAILS
    ]
  },
  {
    role: UserRole.OPERATOR,
    permissions: [
      AppPermission.VIEW_QUOTES, AppPermission.EDIT_QUOTES, AppPermission.VIEW_TIMECLOCK, AppPermission.VIEW_EMAILS
    ]
  }
];

// Helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// BACKEND URL (Para testes reais)
// Em ambiente de demo browser-only, isto não funcionará, mas mantemos para estrutura.
const API_URL = 'http://localhost:3001/api';

// --- VALIDAÇÃO ESTRITA LOCAL (FALLBACK ROBUSTO) ---
const validateEmailStrict = (config: EmailConfig) => {
    // 1. Validar Email - Regex mais permissivo
    if (!config.imapUser || config.imapUser.length < 3) {
        throw new Error("Utilizador de email inválido.");
    }
    // 2. Validar Host
    if (!config.imapHost || config.imapHost.length < 3) {
        throw new Error("Endereço do servidor IMAP inválido.");
    }
    // 3. Validar Porta (Portas padrão de email)
    const standardPorts = [143, 993, 110, 995, 25, 465, 587];
    if (config.imapPort && !standardPorts.includes(config.imapPort)) {
        console.warn(`Porta ${config.imapPort} incomum.`);
    }
    // 4. Password
    if (!config.imapPassword) {
        throw new Error("A password é obrigatória.");
    }
};

const validateSqlStrict = (config: SqlConfig) => {
    if (!config.server || config.server.length < 3) throw new Error("Endereço do servidor SQL inválido.");
    if (!config.database) throw new Error("Indique a Base de Dados.");
    if (!config.user) throw new Error("Indique o utilizador SQL.");
};

export const api = {
  // CRM & Cotações
  getPedidos: async (): Promise<PedidoCotacao[]> => {
    await delay(500);
    return [...localPedidos];
  },
  
  updatePedido: async (id: string, updates: Partial<PedidoCotacao>): Promise<void> => {
    await delay(300);
    localPedidos = localPedidos.map(p => p.id_interno === id ? { ...p, ...updates } : p);
  },

  // Emails
  getEmails: async (): Promise<EmailMessage[]> => {
    await delay(600);
    return [...localEmails];
  },
  
  markEmailRead: async (id: string): Promise<void> => {
    await delay(100);
    localEmails = localEmails.map(e => e.id === id ? { ...e, read: true } : e);
  },

  // Configurações
  getEmailConfig: async (): Promise<EmailConfig> => {
    await delay(200);
    return localEmailConfig;
  },

  saveEmailConfig: async (config: EmailConfig): Promise<void> => {
    await delay(500);
    localEmailConfig = config;
  },

  testEmailConnection: async (config: EmailConfig): Promise<{success: boolean, message: string}> => {
    // 1. Validação básica pré-envio
    if (!config.imapHost || !config.imapUser) {
        throw new Error("Preencha o servidor e o utilizador.");
    }
    
    // 2. Tentar conexão real ao Backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(`${API_URL}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro de autenticação no servidor de email.");
      }
      return { success: true, message: "Conexão Real: Sucesso!" };

    } catch (error: any) {
      // 3. FALLBACK: Backend Offline / Erro de Rede / Browser Only
      // Assumimos modo demo/offline e validamos localmente.
      console.warn("Backend offline ou inacessível. A usar validação local estrita.");
      
      try {
          validateEmailStrict(config);
          await delay(800);
          return { success: true, message: "Modo Offline: Dados validados localmente (Simulação)." };
      } catch (validationErr: any) {
          throw new Error(validationErr.message);
      }
    }
  },

  getSqlConfig: async (): Promise<SqlConfig> => {
    await delay(200);
    return localSqlConfig;
  },

  saveSqlConfig: async (config: SqlConfig): Promise<void> => {
    await delay(500);
    localSqlConfig = config;
  },

  testSqlConnection: async (config: SqlConfig): Promise<{success: boolean, message: string}> => {
    // 1. Validação básica
    if (!config.server || !config.user) {
        throw new Error("Preencha o servidor e utilizador SQL.");
    }

    // 2. Tentar conexão real
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_URL}/test-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao conectar ao SQL Server");
      }
      return { success: true, message: "Conexão SQL Real: Sucesso!" };

    } catch (error: any) {
      // 3. FALLBACK: Backend Offline
      console.warn("Backend offline. A usar validação SQL local.");
      try {
          validateSqlStrict(config);
          await delay(800);
          return { success: true, message: "Modo Offline: Dados SQL validados localmente (Simulação)." };
      } catch (validationErr: any) {
          throw new Error(validationErr.message);
      }
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    await delay(300);
    return localUsers;
  },

  addUser: async (user: Partial<User>): Promise<User> => {
    await delay(400);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: user.name || 'Novo User',
      email: user.email || '',
      role: user.role || UserRole.OPERATOR,
      avatarInitials: (user.name || 'NU').substring(0, 2).toUpperCase(),
      active: true
    };
    localUsers.push(newUser);
    return newUser;
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(300);
    localUsers = localUsers.filter(u => u.id !== id);
  },

  // Access Control
  getAccessControl: async (): Promise<RoleAccessConfig[]> => {
    await delay(200);
    return localAcl;
  },

  saveAccessControl: async (config: RoleAccessConfig[]): Promise<void> => {
    await delay(400);
    localAcl = config;
  },

  // Vendas & Clientes
  getVendas: async (): Promise<Venda[]> => {
    await delay(800);
    return [...mockVendas];
  },

  getClientes: async (): Promise<Cliente[]> => {
    await delay(600);
    return [...mockClients];
  },

  getDividasCliente: async (clientId: string): Promise<DocumentoDivida[]> => {
    await delay(400);
    return generateDebts(clientId);
  },

  // RH Modules
  getColaboradores: async (): Promise<Colaborador[]> => {
    await delay(400);
    return [...localColaboradores];
  },
  
  addColaborador: async (data: Omit<Colaborador, 'id' | 'ativo' | 'saldo_ferias'>): Promise<Colaborador> => {
    await delay(500);
    const newColab: Colaborador = {
        id: `c${Date.now()}`,
        ...data,
        saldo_ferias: 22,
        ativo: true
    };
    localColaboradores.push(newColab);
    return newColab;
  },

  toggleColaboradorStatus: async (id: string): Promise<void> => {
    await delay(300);
    localColaboradores = localColaboradores.map(c => 
        c.id === id ? { ...c, ativo: !c.ativo } : c
    );
  },

  getAusencias: async (): Promise<Ausencia[]> => {
    await delay(300);
    return [...mockAusencias];
  },

  getFerias: async (): Promise<PedidoFerias[]> => {
    await delay(300);
    return [...mockFerias];
  },

  getMovimentos: async (): Promise<MovimentoPonto[]> => {
    await delay(300);
    return []; // Mock vazio inicial
  },

  registarPonto: async (colaboradorId: string, fotoBase64: string, tipo: TipoMovimento, lat?: number, lng?: number): Promise<MovimentoPonto> => {
    await delay(1500); // Simular processamento facial
    return {
      id: `mov-${Date.now()}`,
      colaborador_id: colaboradorId,
      data_hora: new Date().toISOString(),
      tipo: tipo,
      metodo: 'FACIAL',
      confianca_facial: 0.94 + (Math.random() * 0.05),
      foto_captura: fotoBase64,
      latitude: lat,
      longitude: lng
    };
  },

  atualizarBiometria: async (colaboradorId: string, fotoBase64: string): Promise<void> => {
    await delay(1000);
    localColaboradores = localColaboradores.map(c => c.id === colaboradorId ? { ...c, foto_biometrica: 'registada' } : c);
  },

  criarAusencia: async (dados: Omit<Ausencia, 'id' | 'estado'>): Promise<void> => {
    await delay(500);
    mockAusencias.push({
      id: `a${Date.now()}`,
      ...dados,
      estado: EstadoAprovacao.PENDENTE
    });
  },

  atualizarEstadoAusencia: async (id: string, estado: EstadoAprovacao): Promise<void> => {
    await delay(300);
    const idx = mockAusencias.findIndex(a => a.id === id);
    if (idx !== -1) mockAusencias[idx].estado = estado;
  },

  atualizarEstadoFerias: async (id: string, estado: EstadoAprovacao): Promise<void> => {
    await delay(300);
    const idx = mockFerias.findIndex(f => f.id === id);
    if (idx !== -1) mockFerias[idx].estado = estado;
  },

  // AI Context
  getContextoGlobal: async (): Promise<any> => {
    await delay(100);
    // Retorna um snapshot leve dos dados para o LLM
    return {
      kpis_vendas: {
        total_ano: mockVendas.reduce((acc, v) => acc + v.total_bruto, 0),
        top_familias: PRODUCT_FAMILIES.slice(0,3)
      },
      kpis_rh: {
        total_colaboradores: localColaboradores.length,
        ausencias_pendentes: mockAusencias.filter(a => a.estado === 'PENDENTE').length
      },
      ultimos_pedidos: localPedidos.slice(0, 5).map(p => ({ assunto: p.assunto, estado: p.estado }))
    };
  }
};