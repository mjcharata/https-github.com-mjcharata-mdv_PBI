

import React, { useState, useEffect } from 'react';
import { User, UserRole, EmailConfig, SqlConfig, RoleAccessConfig, AppPermission } from '../types';
import { api } from '../services/mockApi';
import { Save, Plus, Trash2, Shield, Mail, Server, Lock, User as UserIcon, Database, ArrowRight, Table, Key, Plug, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EMAIL' | 'SQL' | 'USERS' | 'ACL'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [testResult, setTestResult] = useState<{success: boolean, msg: string} | null>(null);

  // Config State
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    imapHost: '', imapPort: 993, imapUser: '', imapSecure: true, searchKeywords: ''
  });
  
  const [sqlConfig, setSqlConfig] = useState<SqlConfig>({
    server: '', database: '', user: '', port: 1433, encrypt: false, mappings: []
  });

  // User & ACL State
  const [users, setUsers] = useState<User[]>([]);
  const [aclConfig, setAclConfig] = useState<RoleAccessConfig[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.OPERATOR });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emailData, sqlData, usersData, aclData] = await Promise.all([
        api.getEmailConfig(),
        api.getSqlConfig(),
        api.getUsers(),
        api.getAccessControl()
      ]);
      setEmailConfig(emailData);
      setSqlConfig(sqlData);
      setUsers(usersData);
      setAclConfig(aclData);
    } catch (err) {
      console.error("Erro ao carregar definições", err);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setSuccessMsg('');
    setTestResult(null);
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await api.saveEmailConfig(emailConfig);
      showSuccess('Configuração de e-mail guardada com sucesso.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const result = await api.testEmailConnection(emailConfig);
      setTestResult({ success: true, msg: result.message });
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Falha ao conectar.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSql = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await api.saveSqlConfig(sqlConfig);
      showSuccess('Configuração SQL Server e Mapeamento guardados com sucesso.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSql = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const result = await api.testSqlConnection(sqlConfig);
      setTestResult({ success: true, msg: result.message });
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Falha ao conectar.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveAcl = async () => {
    setLoading(true);
    try {
      await api.saveAccessControl(aclConfig);
      showSuccess('Permissões e acessos atualizados.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = (role: UserRole, permission: AppPermission) => {
    setAclConfig(prev => {
      const newConfig = [...prev];
      const roleConfig = newConfig.find(c => c.role === role);
      
      if (roleConfig) {
        const hasPerm = roleConfig.permissions.includes(permission);
        if (hasPerm) {
          roleConfig.permissions = roleConfig.permissions.filter(p => p !== permission);
        } else {
          roleConfig.permissions.push(permission);
        }
      } else {
        // Create new if not exists
        newConfig.push({ role, permissions: [permission] });
      }
      return newConfig;
    });
  };

  const updateMappingColumn = (index: number, newValue: string) => {
    const newMappings = [...sqlConfig.mappings];
    newMappings[index].sqlColumn = newValue;
    setSqlConfig({ ...sqlConfig, mappings: newMappings });
  };

  const updateMappingTable = (index: number, newValue: string) => {
    const newMappings = [...sqlConfig.mappings];
    newMappings[index].sqlTable = newValue;
    setSqlConfig({ ...sqlConfig, mappings: newMappings });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    
    setLoading(true);
    try {
      await api.addUser({ ...newUser, active: true });
      setNewUser({ name: '', email: '', role: UserRole.OPERATOR });
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
      showSuccess('Utilizador adicionado com sucesso.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja remover este utilizador?')) return;
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Group permissions for display
  const permissionGroups = [
    {
      title: 'CRM & Vendas',
      perms: [
        { key: AppPermission.VIEW_DASHBOARD, label: 'Ver Dashboard Principal' },
        { key: AppPermission.VIEW_QUOTES, label: 'Ver Cotações' },
        { key: AppPermission.EDIT_QUOTES, label: 'Editar/Responder Cotações' },
        { key: AppPermission.VIEW_SALES, label: 'Ver Análise de Vendas' },
        { key: AppPermission.VIEW_CUSTOMERS, label: 'Ver Análise de Clientes' }
      ]
    },
    {
       title: 'Comunicações',
       perms: [
          { key: AppPermission.VIEW_EMAILS, label: 'Acesso Cliente de Email' }
       ]
    },
    {
      title: 'Recursos Humanos',
      perms: [
        { key: AppPermission.VIEW_TIMECLOCK, label: 'Acesso Relógio de Ponto' },
        { key: AppPermission.VIEW_ATTENDANCE, label: 'Dashboard de Assiduidade' },
        { key: AppPermission.MANAGE_ABSENCES, label: 'Aprovar/Gerir Faltas' },
        { key: AppPermission.MANAGE_VACATIONS, label: 'Aprovar/Gerir Férias' }
      ]
    },
    {
      title: 'Administração do Sistema',
      perms: [
        { key: AppPermission.MANAGE_USERS, label: 'Gerir Utilizadores' },
        { key: AppPermission.MANAGE_ACL, label: 'Gerir Permissões de Acesso' },
        { key: AppPermission.MANAGE_SETTINGS, label: 'Configurações Técnicas' }
      ]
    }
  ];

  const roles = Object.values(UserRole);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Definições do Sistema</h2>
          <p className="text-gray-500">Configure as ligações e gira os acessos da aplicação.</p>
        </div>
        {successMsg && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('EMAIL'); clearMessages(); }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'EMAIL' 
              ? 'border-mdv-primary text-mdv-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Caixa de Correio
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('SQL'); clearMessages(); }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'SQL' 
              ? 'border-mdv-primary text-mdv-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            SQL Server / ERP
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('USERS'); clearMessages(); }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'USERS' 
              ? 'border-mdv-primary text-mdv-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Utilizadores
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('ACL'); clearMessages(); }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'ACL' 
              ? 'border-mdv-primary text-mdv-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Grupos & Acessos
          </div>
        </button>
      </div>

      {/* Content: EMAIL */}
      {activeTab === 'EMAIL' && (
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-400" />
            Configuração IMAP (Entrada)
          </h3>
          <form onSubmit={handleSaveEmail} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servidor IMAP</label>
                <input
                  type="text"
                  value={emailConfig.imapHost}
                  onChange={e => setEmailConfig({...emailConfig, imapHost: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                  placeholder="imap.exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
                <input
                  type="number"
                  value={emailConfig.imapPort}
                  onChange={e => setEmailConfig({...emailConfig, imapPort: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                  placeholder="993"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username)</label>
                <input
                  type="email"
                  value={emailConfig.imapUser}
                  onChange={e => setEmailConfig({...emailConfig, imapUser: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={emailConfig.imapPassword || ''}
                  onChange={e => setEmailConfig({...emailConfig, imapPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="ssl"
                checked={emailConfig.imapSecure}
                onChange={e => setEmailConfig({...emailConfig, imapSecure: e.target.checked})}
                className="rounded border-gray-300 text-mdv-primary focus:ring-mdv-primary"
              />
              <label htmlFor="ssl" className="text-sm text-gray-700">Utilizar SSL/TLS (Recomendado)</label>
            </div>

            <hr className="my-6 border-gray-100" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave de pesquisa</label>
              <p className="text-xs text-gray-500 mb-2">Separe as palavras por vírgulas. Usado para identificar pedidos de cotação.</p>
              <textarea
                value={emailConfig.searchKeywords}
                onChange={e => setEmailConfig({...emailConfig, searchKeywords: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span>{testResult.msg}</span>
              </div>
            )}

            <div className="flex justify-end pt-4 gap-3">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingConnection || loading}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                Testar Conexão
              </button>
              <button
                type="submit"
                disabled={loading || testingConnection}
                className="flex items-center gap-2 bg-mdv-primary text-white px-6 py-2 rounded-md hover:bg-mdv-secondary transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Guardar Configuração
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content: SQL */}
      {activeTab === 'SQL' && (
        <div className="max-w-5xl space-y-6">
          {/* Connection Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-400" />
              Conexão SQL Server (ERP)
            </h3>
            <form onSubmit={handleSaveSql} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servidor / Host</label>
                  <input
                    type="text"
                    value={sqlConfig.server}
                    onChange={e => setSqlConfig({...sqlConfig, server: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                    placeholder="192.168.1.100 ou SERVIDOR\INSTANCIA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porta (TCP/IP)</label>
                  <input
                    type="number"
                    value={sqlConfig.port || ''}
                    onChange={e => setSqlConfig({...sqlConfig, port: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                    placeholder="1433 (Padrão)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Base de Dados</label>
                   <input
                      type="text"
                      value={sqlConfig.database}
                      onChange={e => setSqlConfig({...sqlConfig, database: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                      placeholder="Ex: PHC_MDV"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utilizador BD</label>
                  <input
                    type="text"
                    value={sqlConfig.user}
                    onChange={e => setSqlConfig({...sqlConfig, user: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                    placeholder="sa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={sqlConfig.password || ''}
                    onChange={e => setSqlConfig({...sqlConfig, password: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Mapping Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Table className="w-4 h-4 text-gray-500" />
                    Mapeamento de Campos e Tabelas
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Indique a Tabela e Coluna SQL para cada campo da App
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left w-1/4">Campo na Aplicação</th>
                        <th className="px-4 py-2 w-8 text-center"></th>
                        <th className="px-4 py-2 text-left w-1/4">Tabela SQL</th>
                        <th className="px-4 py-2 text-left w-1/3">Coluna SQL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sqlConfig.mappings?.map((mapping, index) => (
                        <tr key={mapping.key}>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-700 block">{mapping.label}</span>
                            <span className="text-xs text-gray-400 font-mono">{mapping.key}</span>
                            {mapping.required && <span className="ml-2 text-xs text-red-500 font-bold">*Obrigatório</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-400">
                            <ArrowRight className="w-4 h-4 mx-auto" />
                          </td>
                          <td className="px-4 py-3">
                             <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-mdv-primary focus:border-mdv-primary font-mono text-gray-700"
                              value={mapping.sqlTable || ''}
                              onChange={(e) => updateMappingTable(index, e.target.value)}
                              placeholder="Ex: ft"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-mdv-primary focus:border-mdv-primary font-mono text-blue-700"
                              value={mapping.sqlColumn}
                              onChange={(e) => updateMappingColumn(index, e.target.value)}
                              placeholder={`Ex: ${mapping.key}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {testResult && (
                <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {testResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  <span>{testResult.msg}</span>
                </div>
              )}

              <div className="flex justify-end pt-4 gap-3">
                 <button
                    type="button"
                    onClick={handleTestSql}
                    disabled={testingConnection || loading}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                    Testar Conexão
                  </button>
                <button
                  type="submit"
                  disabled={loading || testingConnection}
                  className="flex items-center gap-2 bg-mdv-primary text-white px-6 py-2 rounded-md hover:bg-mdv-secondary transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Guardar Configuração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content: USERS */}
      {activeTab === 'USERS' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Lista de Utilizadores */}
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-semibold">Utilizadores Ativos</h3>
               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                 {users.length} Total
               </span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-600">
                   <tr>
                     <th className="px-6 py-3 font-medium">Nome</th>
                     <th className="px-6 py-3 font-medium">Email</th>
                     <th className="px-6 py-3 font-medium">Nível de Acesso</th>
                     <th className="px-6 py-3 font-medium text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {users.map(user => (
                     <tr key={user.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                           {user.avatarInitials}
                         </div>
                         <span className="font-medium text-gray-900">{user.name}</span>
                       </td>
                       <td className="px-6 py-4 text-gray-500">{user.email}</td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                           ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                             user.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                         `}>
                           <Shield className="w-3 h-3" />
                           {user.role}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleDeleteUser(user.id)}
                           className="text-gray-400 hover:text-red-500 transition-colors p-1"
                           title="Remover utilizador"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Formulário Novo User */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-gray-400" />
              Novo Utilizador
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                <div className="space-y-2">
                  {Object.values(UserRole).map((role) => (
                    <label key={role} className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${newUser.role === role ? 'border-mdv-primary bg-mdv-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={newUser.role === role}
                        onChange={() => setNewUser({...newUser, role: role as UserRole})}
                        className="text-mdv-primary focus:ring-mdv-primary"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">{role}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mdv-primary text-white py-2 rounded-md hover:bg-mdv-secondary transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Adicionar Utilizador
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content: ACL (Grupos e Acessos) */}
      {activeTab === 'ACL' && (
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-6xl">
           <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-semibold flex items-center gap-2">
                 <Shield className="w-5 h-5 text-gray-400" />
                 Gestão de Acessos por Grupo
               </h3>
               <p className="text-sm text-gray-500">Defina quais as funcionalidades que cada perfil de utilizador pode aceder.</p>
             </div>
             <button onClick={handleSaveAcl} disabled={loading} className="flex items-center gap-2 bg-mdv-primary text-white px-4 py-2 rounded hover:bg-mdv-secondary">
               <Save className="w-4 h-4" /> Guardar Permissões
             </button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-sm border-collapse">
               <thead>
                 <tr>
                   <th className="p-4 text-left bg-gray-50 border-b-2 border-gray-200 w-1/3">Funcionalidade</th>
                   {roles.map(role => (
                     <th key={role} className="p-4 text-center bg-gray-50 border-b-2 border-gray-200 w-1/4">
                       <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold
                         ${role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                           role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                       `}>
                         {role}
                       </span>
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {permissionGroups.map(group => (
                   <React.Fragment key={group.title}>
                     <tr className="bg-gray-50/50">
                       <td colSpan={roles.length + 1} className="p-3 font-bold text-gray-700 border-b border-gray-200">
                         {group.title}
                       </td>
                     </tr>
                     {group.perms.map(perm => (
                       <tr key={perm.key} className="hover:bg-gray-50 border-b border-gray-100">
                         <td className="p-4 text-gray-600 font-medium">
                           {perm.label}
                           <span className="block text-xs text-gray-400 font-normal mt-0.5">{perm.key}</span>
                         </td>
                         {roles.map(role => {
                           // Find config for this role
                           const roleConfig = aclConfig.find(c => c.role === role);
                           const isChecked = roleConfig ? roleConfig.permissions.includes(perm.key) : false;
                           
                           return (
                             <td key={`${role}-${perm.key}`} className="p-4 text-center">
                               <input 
                                 type="checkbox" 
                                 checked={isChecked}
                                 onChange={() => togglePermission(role, perm.key)}
                                 disabled={role === UserRole.ADMIN && perm.key === AppPermission.MANAGE_ACL} // Prevent Admin lockout
                                 className="w-5 h-5 text-mdv-primary rounded border-gray-300 focus:ring-mdv-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                               />
                             </td>
                           );
                         })}
                       </tr>
                     ))}
                   </React.Fragment>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};