
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApi';
import { Cliente, DocumentoDivida } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, TrendingUp, Briefcase, User, AlertCircle, Search, ArrowLeft, 
  CreditCard, FileText, BadgeCheck, Phone, MapPin 
} from 'lucide-react';

const COLORS = ['#5D4037', '#8D6E63', '#A1887F', '#D7CCC8'];
const DEBT_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export const CustomerAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientDebts, setClientDebts] = useState<DocumentoDivida[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDebts, setLoadingDebts] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientDebts(selectedClient.id);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await api.getClientes();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadClientDebts = async (clientId: string) => {
    setLoadingDebts(true);
    try {
      const data = await api.getDividasCliente(clientId);
      setClientDebts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDebts(false);
    }
  };

  // --- FORMATTERS ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  // --- GLOBAL METRICS ---
  const globalStats = useMemo(() => {
    const totalFaturado = clients.reduce((acc, c) => acc + c.total_faturado_ano, 0);
    const totalDivida = clients.reduce((acc, c) => acc + c.total_divida, 0);
    const countB2B = clients.filter(c => c.tipo === 'B2B').length;
    const countB2C = clients.filter(c => c.tipo === 'B2C').length;
    const avgPMP = clients.length > 0 ? clients.reduce((acc, c) => acc + c.prazo_medio_pagamento, 0) / clients.length : 0;

    return { totalFaturado, totalDivida, countB2B, countB2C, avgPMP };
  }, [clients]);

  const topClients = useMemo(() => {
    return [...clients].sort((a, b) => b.total_faturado_ano - a.total_faturado_ano).slice(0, 10);
  }, [clients]);

  const b2bData = [
    { name: 'B2B (Empresas)', value: globalStats.countB2B },
    { name: 'B2C (Particulares)', value: globalStats.countB2C }
  ];

  // --- FILTERED LIST ---
  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nif.includes(searchTerm)
  );

  // --- RENDER: DETAIL VIEW ---
  if (selectedClient) {
    return (
      <div className="space-y-6 pb-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedClient(null)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
             <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               {selectedClient.nome}
               {selectedClient.tipo === 'B2B' && (
                 <span title="Empresa Verificada">
                   <BadgeCheck className="w-5 h-5 text-blue-500" />
                 </span>
               )}
             </h2>
             <p className="text-gray-500 flex items-center gap-4 text-sm mt-1">
               <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> NIF: {selectedClient.nif}</span>
               <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedClient.localidade}</span>
               <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedClient.tipo === 'B2B' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                 {selectedClient.tipo}
               </span>
             </p>
          </div>
        </div>

        {/* Client KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-mdv-primary">
              <p className="text-xs font-medium text-gray-500 uppercase">Faturação (Ano Corrente)</p>
              <h3 className="text-2xl font-bold text-mdv-primary mt-1">{formatCurrency(selectedClient.total_faturado_ano)}</h3>
              <p className={`text-xs mt-1 font-medium ${selectedClient.total_faturado_ano >= selectedClient.total_faturado_anterior ? 'text-green-600' : 'text-red-500'}`}>
                 {selectedClient.total_faturado_ano >= selectedClient.total_faturado_anterior ? '▲' : '▼'} vs Ano Anterior
              </p>
           </div>
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-xs font-medium text-gray-500 uppercase">Margem Média</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{selectedClient.margem_lucro_media}%</h3>
              <p className="text-xs text-gray-400 mt-1">Rentabilidade</p>
           </div>
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-amber-500">
              <p className="text-xs font-medium text-gray-500 uppercase">Prazo Médio Pagamento</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{selectedClient.prazo_medio_pagamento} Dias</h3>
              <p className="text-xs text-gray-400 mt-1">Histórico Financeiro</p>
           </div>
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500">
              <p className="text-xs font-medium text-gray-500 uppercase">Dívida Corrente</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(selectedClient.total_divida)}</h3>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${selectedClient.total_divida > selectedClient.limite_credito ? 'bg-red-600' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min((selectedClient.total_divida / selectedClient.limite_credito) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Limite: {formatCurrency(selectedClient.limite_credito)}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Top Products */}
           <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Produtos Mais Consumidos</h3>
              <div className="space-y-4">
                 {selectedClient.top_produtos.map((prod, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                             {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{prod.nome}</span>
                       </div>
                       <span className="text-sm font-bold text-gray-900">{formatCurrency(prod.valor)}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Debt Table (Conta Corrente) */}
           <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                 <CreditCard className="w-5 h-5 text-gray-400" />
                 Conta Corrente (Valores Pendentes)
              </h3>
              
              {loadingDebts ? (
                 <div className="text-center py-10 text-gray-500">A carregar extrato de conta...</div>
              ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 text-gray-600">
                          <tr>
                             <th className="px-4 py-2">Documento</th>
                             <th className="px-4 py-2">Emissão</th>
                             <th className="px-4 py-2">Vencimento</th>
                             <th className="px-4 py-2 text-right">Valor Pendente</th>
                             <th className="px-4 py-2 text-center">Estado</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {clientDebts.length === 0 ? (
                             <tr><td colSpan={5} className="p-6 text-center text-gray-500">Cliente sem valores pendentes. Situação regularizada.</td></tr>
                          ) : (
                             clientDebts.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 font-medium text-gray-800">{doc.documento}</td>
                                   <td className="px-4 py-3 text-gray-500">{new Date(doc.data_emissao).toLocaleDateString()}</td>
                                   <td className="px-4 py-3 text-gray-500">{new Date(doc.data_vencimento).toLocaleDateString()}</td>
                                   <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(doc.valor_pendente)}</td>
                                   <td className="px-4 py-3 text-center">
                                      {doc.dias_atraso > 0 ? (
                                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                            <AlertCircle className="w-3 h-3 mr-1" /> {doc.dias_atraso} Dias Atraso
                                         </span>
                                      ) : (
                                         <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                                            No Prazo
                                         </span>
                                      )}
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN DASHBOARD ---
  if (loading) return <div className="p-8 text-center animate-pulse">A carregar análise de clientes...</div>;

  return (
    <div className="space-y-6 pb-10">
       {/* Global Header Stats */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
          <div>
             <h2 className="text-2xl font-bold text-gray-800">Análise de Clientes 360º</h2>
             <p className="text-sm text-gray-500">Rankings, Rentabilidade e Gestão de Dívida</p>
          </div>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
             <input 
               type="text" 
               placeholder="Pesquisar cliente ou NIF..." 
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-mdv-primary focus:border-mdv-primary text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
             <div className="flex justify-between">
                <div>
                   <p className="text-xs font-medium text-gray-500 uppercase">Carteira Total</p>
                   <h3 className="text-2xl font-bold text-gray-800 mt-1">{clients.length}</h3>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-20" />
             </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
             <div className="flex justify-between">
                <div>
                   <p className="text-xs font-medium text-gray-500 uppercase">Dívida Total</p>
                   <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(globalStats.totalDivida)}</h3>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
             </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
             <div className="flex justify-between">
                <div>
                   <p className="text-xs font-medium text-gray-500 uppercase">Prazo Médio Rec.</p>
                   <h3 className="text-2xl font-bold text-amber-600 mt-1">{globalStats.avgPMP.toFixed(0)} Dias</h3>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-500 opacity-20" />
             </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
             <div className="flex justify-between">
                <div>
                   <p className="text-xs font-medium text-gray-500 uppercase">Vol. Faturação</p>
                   <h3 className="text-2xl font-bold text-mdv-primary mt-1">{(globalStats.totalFaturado / 1000000).toFixed(1)}M</h3>
                </div>
                <Briefcase className="w-8 h-8 text-mdv-primary opacity-20" />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart: Ranking */}
          <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
             <h3 className="text-lg font-semibold mb-4">Top 10 Clientes (Faturação)</h3>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={topClients} layout="vertical" margin={{left: 20}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="nome" type="category" width={150} tick={{fontSize: 11}} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{borderRadius: '8px'}} />
                      <Bar 
                        dataKey="total_faturado_ano" 
                        fill="#5D4037" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20} 
                        onClick={(data: any) => setSelectedClient(data.payload)} 
                        cursor="pointer" 
                      />
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-center text-xs text-gray-400 mt-2">Clique na barra para ver detalhes do cliente</p>
          </div>

          {/* Chart: Segmentation */}
          <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
             <h3 className="text-lg font-semibold mb-4">Segmentação B2B vs B2C</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={b2bData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {b2bData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#10B981'} />
                         ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Empresas ({globalStats.countB2B})</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Particulares ({globalStats.countB2C})</div>
             </div>
          </div>
       </div>

       {/* Client List Table */}
       <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
             <h3 className="text-lg font-semibold">Listagem de Clientes</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500 border-b">
                   <tr>
                      <th className="px-6 py-3 font-medium">Cliente</th>
                      <th className="px-6 py-3 font-medium">Tipo</th>
                      <th className="px-6 py-3 font-medium text-right">Faturação Ano</th>
                      <th className="px-6 py-3 font-medium text-center">Margem %</th>
                      <th className="px-6 py-3 font-medium text-right">Dívida Corrente</th>
                      <th className="px-6 py-3 font-medium text-center">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredClients.slice(0, 10).map(client => (
                      <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedClient(client)}>
                         <td className="px-6 py-4 font-medium text-gray-900">{client.nome}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${client.tipo === 'B2B' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                               {client.tipo}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right font-mono">{formatCurrency(client.total_faturado_ano)}</td>
                         <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${client.margem_lucro_media > 20 ? 'text-green-600' : 'text-amber-600'}`}>
                               {client.margem_lucro_media}%
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-red-600">{formatCurrency(client.total_divida)}</td>
                         <td className="px-6 py-4 text-center">
                            <button className="text-mdv-primary hover:underline text-xs font-bold">Ver Ficha</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
          {filteredClients.length > 10 && (
             <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 border-t">
                Mostrando 10 de {filteredClients.length} resultados. Use a pesquisa para filtrar.
             </div>
          )}
       </div>
    </div>
  );
};
