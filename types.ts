

export enum EstadoPedido {
  PENDENTE = 'PENDENTE',
  RESPONDIDO = 'RESPONDIDO',
  IGNORADO = 'IGNORADO',
  CANCELADO = 'CANCELADO'
}

export enum UserRole {
  ADMIN = 'Administrador', // Acesso total (Definições, Users, Eliminar)
  MANAGER = 'Gestor',      // Ver relatórios, editar estados
  OPERATOR = 'Operador'    // Apenas ver lista e responder (simulado)
}

// --- PERMISSÕES DE ACESSO ---
export enum AppPermission {
  // CRM
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_QUOTES = 'VIEW_QUOTES',
  EDIT_QUOTES = 'EDIT_QUOTES',
  VIEW_SALES = 'VIEW_SALES',
  VIEW_CUSTOMERS = 'VIEW_CUSTOMERS',
  VIEW_EMAILS = 'VIEW_EMAILS', // Nova permissão para o cliente de email
  
  // RH
  VIEW_TIMECLOCK = 'VIEW_TIMECLOCK', // Aceder ao relógio de ponto
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE', // Ver dashboard RH
  MANAGE_ABSENCES = 'MANAGE_ABSENCES', // Aprovar faltas
  MANAGE_VACATIONS = 'MANAGE_VACATIONS', // Aprovar férias
  
  // SISTEMA
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ACL = 'MANAGE_ACL' // Gerir estes acessos
}

export interface RoleAccessConfig {
  role: UserRole;
  permissions: AppPermission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  active: boolean;
}

export interface EmailConfig {
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword?: string; // Opcional na interface por segurança
  imapSecure: boolean;
  searchKeywords: string; // Lista separada por virgulas
}

export interface SqlFieldMapping {
  key: keyof Venda | 'id'; // Chave interna da App
  label: string; // Nome legível na UI
  sqlTable: string; // Tabela ou View no SQL
  sqlColumn: string; // Nome da coluna no SQL
  required: boolean;
}

export interface SqlConfig {
  server: string;
  database: string;
  user: string;
  password?: string;
  port?: number; // Agora opcional
  encrypt: boolean;
  // Configuração de Mapeamento
  mappings: SqlFieldMapping[];
}

export interface Venda {
  id: string;
  numero_fatura: string;
  data_venda: string;
  cliente_nome: string;
  cliente_nif: string;
  total_liquido: number;
  total_imposto: number;
  total_bruto: number;
  vendedor: string;
  familia_produto: string; // Novo campo
  estado: 'PAGO' | 'PENDENTE' | 'ANULADO';
}

// --- NOVOS TIPOS: ANÁLISE DE CLIENTES ---

export interface DocumentoDivida {
  id: string;
  documento: string; // Ex: FT 2024/500
  data_emissao: string;
  data_vencimento: string;
  valor_pendente: number;
  dias_atraso: number;
}

export interface Cliente {
  id: string;
  nome: string;
  nif: string;
  tipo: 'B2B' | 'B2C';
  localidade: string;
  total_faturado_ano: number;
  total_faturado_anterior: number;
  margem_lucro_media: number; // %
  prazo_medio_pagamento: number; // dias
  total_divida: number; // Saldo em conta corrente
  limite_credito: number;
  top_produtos: { nome: string; valor: number }[];
}

// --- TIPOS EMAIL CLIENT ---
export interface EmailMessage {
  id: string;
  folder: 'INBOX' | 'SENT' | 'TRASH' | 'DRAFTS';
  from: { name: string; email: string; avatar?: string };
  to: string[];
  subject: string;
  preview: string;
  body: string; // HTML content
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachments: boolean;
  attachments?: { name: string; size: string; type: string }[];
}

export interface PedidoCotacao {
  id_interno: string;
  email_message_id: string;
  thread_id?: string;
  remetente: string;
  assunto: string;
  data_hora_recepcao: string; // ISO String
  data_hora_primeira_resposta?: string; // ISO String
  tempo_resposta_minutos?: number;
  estado: EstadoPedido;
  responsavel?: string;
  notas_internas?: string;
  preview_texto: string;
  valor_proforma?: number; 
  familia_produto?: string; // Novo campo: Classificação do pedido
}

export interface KpiData {
  totalPedidos: number;
  pedidosRespondidos: number;
  pedidosPendentes: number;
  tempoMedioRespostaMinutos: number;
  slaCumprimentoPercentagem: number; // % dentro do prazo de 4h
  valorTotalCotado: number; // Novo KPI
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  status: string; // 'TODOS' ou EstadoPedido
  search: string;
}

// --- MÓDULO RH (ASSIDUIDADE & FÉRIAS) ---

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  foto_url?: string;
  saldo_ferias: number; // Dias disponíveis
  foto_biometrica?: string; // Base64 da face registada para validação
  ativo: boolean; // Estado do colaborador
}

export enum TipoMovimento {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA'
}

export interface MovimentoPonto {
  id: string;
  colaborador_id: string;
  data_hora: string; // ISO
  tipo: TipoMovimento;
  metodo: 'FACIAL' | 'MANUAL';
  confianca_facial?: number; // % de match (simulado)
  foto_captura?: string; // Base64 ou URL
  latitude?: number;
  longitude?: number;
}

export enum EstadoAprovacao {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO'
}

export interface Ausencia {
  id: string;
  colaborador_id: string;
  colaborador_nome: string; // Desnormalizado para UI
  data_inicio: string;
  data_fim: string;
  tipo: 'DOENCA' | 'FAMILIA' | 'OUTRO';
  motivo: string;
  comprovativo_url?: string;
  estado: EstadoAprovacao;
}

export interface PedidoFerias {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  data_inicio: string;
  data_fim: string;
  dias_uteis: number;
  estado: EstadoAprovacao;
  observacoes?: string;
}