
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';
import { Venda } from '../types';
import { api } from '../services/mockApi';
import { DollarSign, TrendingUp, Receipt, Users, Calendar, Search, Download, UserCheck, Package, Filter, X } from 'lucide-react';

export const SalesAnalysis: React.FC = () => {
  const [sales, setSales] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [selectedSeller, setSelectedSeller] = useState<string>('ALL');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api.getVendas();
      setSales(data);
    } catch (err) {
      console.error("Erro ao carregar vendas", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper de formatação
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  // Lista única de vendedores para o dropdown
  const sellersList = useMemo(() => {
    const sellers = new Set(sales.map(s => s.vendedor));
    return Array.from(sellers).sort();
  }, [sales]);

  // Lista única de famílias para o dropdown
  const familiesList = useMemo(() => {
    const families = new Set(sales.map(s => s.familia_produto).filter(Boolean));
    return Array.from(families).sort();
  }, [sales]);

  // Filtragem Principal de Dados
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const isNotCancelled = s.estado !== 'ANULADO';
      const matchesYear = new Date(s.data_venda).getFullYear().toString() === yearFilter;
      const matchesSeller = selectedSeller === 'ALL' || s.vendedor === selectedSeller;
      const matchesFamily = selectedFamily === 'ALL' || s.familia_produto === selectedFamily;
      
      return isNotCancelled && matchesYear && matchesSeller && matchesFamily;
    });
  }, [sales, yearFilter, selectedSeller, selectedFamily]);

  // Cálculos de KPIs baseados nos dados filtrados
  const kpis = useMemo(() => {
    const totalFaturado = filteredSales.reduce((acc, curr) => acc + curr.total_bruto, 0);
    const totalVendas = filteredSales.length;
    const ticketMedio = totalVendas > 0 ? totalFaturado / totalVendas : 0;
    
    // Cálculo do Top Vendedor
    const allSalesInYear = sales.filter(s => s.estado !== 'ANULADO' && new Date(s.data_venda).getFullYear().toString() === yearFilter);
    const vendedoresMap: {[key: string]: number} = {};
    let totalCompanySales = 0;

    allSalesInYear.forEach(s => {
      vendedoresMap[s.vendedor] = (vendedoresMap[s.vendedor] || 0) + s.total_bruto;
      totalCompanySales += s.total_bruto;
    });

    const sortedSellers = Object.entries(vendedoresMap).sort((a, b) => b[1] - a[1]);
    const topVendedorName = sortedSellers.length > 0 ? sortedSellers[0][0] : '-';
    const topVendedorValue = sortedSellers.length > 0 ? sortedSellers[0][1] : 0;

    const sellerValue = selectedSeller === 'ALL' ? topVendedorValue : totalFaturado;
    const contribution = totalCompanySales > 0 ? (sellerValue / totalCompanySales) * 100 : 0;

    return { 
      totalFaturado, 
      totalVendas, 
      ticketMedio, 
      topVendedorName, 
      topVendedorValue,
      contribution
    };
  }, [filteredSales, sales, yearFilter, selectedSeller]);

  // Dados para Gráfico Mensal (Usa filteredSales)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, valor: 0, qtd: 0 }));
    
    filteredSales.forEach(s => {
      const monthIdx = new Date(s.data_venda).getMonth();
      data[monthIdx].valor += s.total_bruto;
      data[monthIdx].qtd += 1;
    });
    
    return data;
  }, [filteredSales]);

  // Dados para Gráfico de Família - USAR CONTEXTO MENOS RESTRITO PARA PERMITIR SELEÇÃO?
  // Se eu filtrar por "Madeira", o gráfico mostra so madeira. 
  // Para funcionar como filtro interativo, o ideal é mostrar todas, mas destacar a selecionada.
  const familyData = useMemo(() => {
    // Calcular sobre vendas do ano e vendedor selecionado, IGNORANDO o filtro de família atual
    // para que as barras continuem visíveis para clique
    const contextSales = sales.filter(s => {
       const isNotCancelled = s.estado !== 'ANULADO';
       const matchesYear = new Date(s.data_venda).getFullYear().toString() === yearFilter;
       const matchesSeller = selectedSeller === 'ALL' || s.vendedor === selectedSeller;
       return isNotCancelled && matchesYear && matchesSeller;
    });

    const counts: {[key: string]: number} = {};
    contextSales.forEach(s => {
      const fam = s.familia_produto || 'Outros';
      counts[fam] = (counts[fam] || 0) + s.total_bruto;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales, yearFilter, selectedSeller]);

  // Lista filtrada para tabela
  const filteredTableData = filteredSales
    .filter(s => 
      (s.cliente_nome.toLowerCase().includes(filterText.toLowerCase()) || 
       s.numero_fatura.toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime())
    .slice(0, 50);

  const handleFamilyChartClick = (data: any) => {
     if (data && data.activePayload && data.activePayload.length > 0) {
        const clickedFamily = data.activePayload[0].payload.name;
        setSelectedFamily(prev => prev === clickedFamily ? 'ALL' : clickedFamily);
     }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">A conectar ao Servidor SQL e a importar vendas...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Análise de Vendas</h2>
          <p className="text-sm text-gray-500">
            Relatórios de Faturação e Performance Comercial
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Filtro Ano */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={yearFilter} 
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-sm bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Filtro Família */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2 min-w-[200px]">
            <Package className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={selectedFamily} 
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="text-sm bg-transparent focus:outline-none cursor-pointer w-full"
            >
              <option value="ALL">Todas as Famílias</option>
              {familiesList.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <button className="flex items-center gap-2 bg-mdv-primary text-white px-4 py-2 rounded-md text-sm hover:bg-mdv-secondary">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {selectedFamily !== 'ALL' && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-800 p-3 rounded border border-blue-100 animate-fade-in">
           <Filter className="w-4 h-4" />
           Filtrado por Família: <strong>{selectedFamily}</strong>
           <button onClick={() => setSelectedFamily('ALL')} className="ml-auto text-blue-600 hover:text-blue-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Faturação Bruta</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.totalFaturado)}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {selectedSeller === 'ALL' ? 'Global' : selectedSeller} • {selectedFamily === 'ALL' ? 'Todas' : selectedFamily}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-full">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Nº Transações</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalVendas}</h3>
              <p className="text-xs text-gray-400 mt-1">Faturas emitidas</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-full">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Ticket Médio</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.ticketMedio)}</h3>
              <p className="text-xs text-gray-400 mt-1">Média por fatura</p>
            </div>
            <div className="p-2 bg-green-50 rounded-full">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Cartão Dinâmico de Vendedor */}
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-amber-500 relative">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Analisar Vendedor
            </p>
            <div className="p-2 bg-amber-50 rounded-full">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          
          <select 
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="w-full mb-2 text-sm border-gray-200 rounded-md focus:border-amber-500 focus:ring-amber-500 bg-gray-50 p-1"
          >
            <option value="ALL">Todos / Top Vendedor</option>
            {sellersList.map(seller => (
              <option key={seller} value={seller}>{seller}</option>
            ))}
          </select>

          {selectedSeller === 'ALL' ? (
            <>
              <h3 className="text-lg font-bold text-gray-900 truncate" title={kpis.topVendedorName}>
                Top: {kpis.topVendedorName}
              </h3>
              <p className="text-xs text-gray-500">
                {formatCurrency(kpis.topVendedorValue)} (Global)
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {formatCurrency(kpis.totalFaturado)}
              </h3>
              <p className="text-xs text-amber-600 font-medium">
                Contributo de {kpis.contribution.toFixed(1)}%
              </p>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de Evolução */}
        <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex justify-between">
            <span>Evolução de Faturação</span>
            <span className="text-sm font-normal text-gray-500">Ano {yearFilter}</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D4037" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#5D4037" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Faturação']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#5D4037" fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico por Família - INTERATIVO */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
           <h3 className="text-lg font-semibold mb-2">Por Família de Produto</h3>
           <p className="text-xs text-gray-400 mb-4">Clique nas barras para filtrar</p>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={familyData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onClick={handleFamilyChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                <RechartsTooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {familyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedFamily === entry.name || selectedFamily === 'ALL' ? '#8D6E63' : '#E0E0E0'} 
                      cursor="pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold">Detalhe de Vendas</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text"
              placeholder="Pesquisar fatura ou cliente..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-mdv-primary focus:border-mdv-primary"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Fatura</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Família</th>
                <th className="px-6 py-3 font-medium text-right">Total Bruto</th>
                <th className="px-6 py-3 font-medium">Vendedor</th>
                <th className="px-6 py-3 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTableData.length === 0 && (
                 <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                     Nenhuma venda encontrada com os filtros selecionados.
                   </td>
                 </tr>
              )}
              {filteredTableData.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(venda.data_venda).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">{venda.numero_fatura}</td>
                  <td className="px-6 py-3 text-gray-700 truncate max-w-[150px]" title={venda.cliente_nome}>
                    {venda.cliente_nome}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 cursor-pointer hover:bg-mdv-primary hover:text-white transition-colors"
                      onClick={() => setSelectedFamily(venda.familia_produto)}
                      title="Filtrar por esta família"
                    >
                      {venda.familia_produto}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(venda.total_bruto)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    <span 
                      className="cursor-pointer hover:underline"
                      onClick={() => setSelectedSeller(venda.vendedor)}
                      title="Filtrar por este vendedor"
                    >
                      {venda.vendedor}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${venda.estado === 'PAGO' ? 'bg-green-100 text-green-800' : 
                        venda.estado === 'PENDENTE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {venda.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
