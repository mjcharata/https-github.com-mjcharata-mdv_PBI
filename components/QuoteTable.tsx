import React, { useState, useMemo } from 'react';
import { EstadoPedido, PedidoCotacao } from '../types';
import { Filter, Edit2, User, FileText, Search, Package, X, Calendar } from 'lucide-react';

interface QuoteTableProps {
  data: PedidoCotacao[];
  onUpdate: (id: string, updates: Partial<PedidoCotacao>) => void;
}

export const QuoteTable: React.FC<QuoteTableProps> = ({ data, onUpdate }) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [familyFilter, setFamilyFilter] = useState<string>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado temporário para edição
  const [editForm, setEditForm] = useState<Partial<PedidoCotacao>>({});

  // Extrair famílias únicas para o filtro
  const familiesList = useMemo(() => {
    const families = new Set(data.map(p => p.familia_produto).filter(Boolean) as string[]);
    return Array.from(families).sort();
  }, [data]);

  const filteredData = data.filter(pedido => {
    const matchesText = 
      pedido.remetente.toLowerCase().includes(filterText.toLowerCase()) ||
      pedido.assunto.toLowerCase().includes(filterText.toLowerCase()) ||
      (pedido.responsavel || '').toLowerCase().includes(filterText.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || pedido.estado === statusFilter;
    const matchesFamily = familyFilter === 'TODOS' || pedido.familia_produto === familyFilter;
    
    // Filtro de Data
    let matchesDate = true;
    if (startDate || endDate) {
      const pedidoDate = new Date(pedido.data_hora_recepcao).toISOString().split('T')[0]; // YYYY-MM-DD
      if (startDate && pedidoDate < startDate) matchesDate = false;
      if (endDate && pedidoDate > endDate) matchesDate = false;
    }
    
    return matchesText && matchesStatus && matchesFamily && matchesDate;
  });

  const handleEdit = (pedido: PedidoCotacao) => {
    setEditingId(pedido.id_interno);
    setEditForm({ ...pedido });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const formatTime = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);
  };

  const getStatusColor = (status: EstadoPedido) => {
    switch (status) {
      case EstadoPedido.RESPONDIDO: return 'bg-green-100 text-green-800 border-green-200';
      case EstadoPedido.PENDENTE: return 'bg-amber-100 text-amber-800 border-amber-200';
      case EstadoPedido.IGNORADO: return 'bg-gray-100 text-gray-800 border-gray-200';
      case EstadoPedido.CANCELADO: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setStatusFilter('TODOS');
    setFamilyFilter('TODOS');
    setFilterText('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = statusFilter !== 'TODOS' || familyFilter !== 'TODOS' || filterText !== '' || startDate !== '' || endDate !== '';

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Filters Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text"
              placeholder="Pesquisar remetente, assunto..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-mdv-primary focus:border-mdv-primary"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-300">
            <Calendar className="text-gray-400 h-4 w-4" />
            <input 
              type="date" 
              className="text-xs border-none focus:ring-0 p-1 text-gray-600 w-24"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Data Início"
            />
            <span className="text-gray-400 text-xs">até</span>
            <input 
              type="date" 
              className="text-xs border-none focus:ring-0 p-1 text-gray-600 w-24"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Data Fim"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 hidden sm:block mx-1"></div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select 
              className={`border rounded-md text-sm py-2 px-3 focus:ring-mdv-primary focus:border-mdv-primary ${statusFilter !== 'TODOS' ? 'border-mdv-primary bg-mdv-primary/5 text-mdv-primary font-medium' : 'border-gray-300'}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="TODOS">Todos os Estados</option>
              <option value={EstadoPedido.PENDENTE}>Pendentes</option>
              <option value={EstadoPedido.RESPONDIDO}>Respondidos</option>
              <option value={EstadoPedido.IGNORADO}>Ignorados</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Package className="text-gray-400 h-4 w-4" />
            <select 
              className={`border rounded-md text-sm py-2 px-3 focus:ring-mdv-primary focus:border-mdv-primary max-w-[180px] ${familyFilter !== 'TODOS' ? 'border-mdv-primary bg-mdv-primary/5 text-mdv-primary font-medium' : 'border-gray-300'}`}
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
            >
              <option value="TODOS">Todas as Famílias</option>
              {familiesList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md transition-colors ml-auto xl:ml-0"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-[100px]">Estado</th>
              <th className="px-4 py-3 w-[120px]">Receção</th>
              <th className="px-4 py-3 w-[180px]">Remetente</th>
              <th className="px-4 py-3">Assunto / Família</th>
              <th className="px-4 py-3 w-[120px] text-right">Valor Proforma</th>
              <th className="px-4 py-3 w-[100px]">Tempo Resp.</th>
              <th className="px-4 py-3 w-[180px]">Responsável / Notas</th>
              <th className="px-4 py-3 w-[60px] text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nenhum pedido encontrado com os filtros atuais.
                </td>
              </tr>
            )}
            {filteredData.map((pedido) => {
              const isEditing = editingId === pedido.id_interno;
              const date = new Date(pedido.data_hora_recepcao).toLocaleString('pt-PT', { 
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
              });

              return (
                <tr key={pedido.id_interno} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select 
                        className="w-full text-xs p-1 border rounded"
                        value={editForm.estado || pedido.estado}
                        onChange={(e) => setEditForm({...editForm, estado: e.target.value as EstadoPedido})}
                      >
                        {Object.values(EstadoPedido).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span 
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${getStatusColor(pedido.estado)}`}
                        onClick={() => setStatusFilter(pedido.estado)}
                        title="Filtrar por este estado"
                      >
                        {pedido.estado}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs" title={pedido.remetente}>
                    {pedido.remetente}
                  </td>
                  <td className="px-4 py-3 text-gray-700 truncate max-w-xs">
                    {isEditing ? (
                       <div className="space-y-1">
                         <div className="font-medium">{pedido.assunto}</div>
                         <select 
                            className="w-full text-xs p-1 border rounded"
                            value={editForm.familia_produto || pedido.familia_produto || ''}
                            onChange={(e) => setEditForm({...editForm, familia_produto: e.target.value})}
                          >
                            <option value="">Sem Família</option>
                            {familiesList.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                       </div>
                    ) : (
                      <>
                        <div className="font-medium" title={pedido.assunto}>{pedido.assunto}</div>
                        {pedido.familia_produto && (
                          <span 
                            className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1 cursor-pointer hover:bg-mdv-primary hover:text-white transition-colors"
                            onClick={() => setFamilyFilter(pedido.familia_produto || 'TODOS')}
                            title="Filtrar por esta família"
                          >
                            <Package className="w-3 h-3" /> {pedido.familia_produto}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {isEditing ? (
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full text-xs p-1 border rounded text-right"
                        value={editForm.valor_proforma || ''}
                        onChange={(e) => setEditForm({...editForm, valor_proforma: parseFloat(e.target.value)})}
                      />
                    ) : (
                       <div className={pedido.valor_proforma ? 'text-gray-900' : 'text-gray-300'}>
                         {pedido.valor_proforma ? formatCurrency(pedido.valor_proforma) : '-'}
                       </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono">
                    {formatTime(pedido.tempo_resposta_minutos)}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="space-y-1">
                         <input 
                           type="text" 
                           placeholder="Responsável"
                           className="w-full text-xs p-1 border rounded"
                           value={editForm.responsavel || ''}
                           onChange={(e) => setEditForm({...editForm, responsavel: e.target.value})}
                         />
                         <input 
                           type="text" 
                           placeholder="Notas"
                           className="w-full text-xs p-1 border rounded"
                           value={editForm.notas_internas || ''}
                           onChange={(e) => setEditForm({...editForm, notas_internas: e.target.value})}
                         />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {pedido.responsavel && (
                          <div className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                            <User className="w-3 h-3" /> {pedido.responsavel}
                          </div>
                        )}
                        {pedido.notas_internas && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 italic truncate max-w-[150px]" title={pedido.notas_internas}>
                            <FileText className="w-3 h-3" /> {pedido.notas_internas}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <button 
                        onClick={handleSave}
                        className="text-xs bg-mdv-primary text-white px-2 py-1 rounded hover:bg-mdv-secondary"
                      >
                        Guardar
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleEdit(pedido)}
                        className="p-1 text-gray-400 hover:text-mdv-primary hover:bg-gray-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};