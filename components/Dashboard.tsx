import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { PedidoCotacao, EstadoPedido } from '../types';
import { Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3, Banknote, FileText, Calendar, DollarSign, Hash, Package, Filter, X } from 'lucide-react';

interface DashboardProps {
  data: PedidoCotacao[];
  loading: boolean;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#9CA3AF'];
const FAMILY_COLORS = ['#5D4037', '#8D6E63', '#A1887F', '#D7CCC8', '#3E2723', '#795548'];

const CHART_COLORS = {
  current: '#5D4037', // MDV Primary
  previous: '#D1D5DB' // Gray 300
};

type ViewMode = 'DAILY' | 'MONTHLY' | 'YEARLY';
type MetricMode = 'COUNT' | 'VALUE';

export const Dashboard: React.FC<DashboardProps> = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
  const [metricMode, setMetricMode] = useState<MetricMode>('VALUE');
  
  // Interactive Filters State
  const [activeFamily, setActiveFamily] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  // 1. Filter Data based on interactions
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchFamily = activeFamily ? d.familia_produto === activeFamily : true;
      const matchStatus = activeStatus ? d.estado === activeStatus : true;
      return matchFamily && matchStatus;
    });
  }, [data, activeFamily, activeStatus]);

  // 2. Calculate KPIs based on FILTERED data
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const respondidos = filteredData.filter(d => d.estado === EstadoPedido.RESPONDIDO).length;
    const pendentes = filteredData.filter(d => d.estado === EstadoPedido.PENDENTE).length;
    
    const respondidosComTempo = filteredData.filter(d => d.tempo_resposta_minutos !== undefined);
    const somaTempo = respondidosComTempo.reduce((acc, curr) => acc + (curr.tempo_resposta_minutos || 0), 0);
    const mediaTempo = respondidosComTempo.length > 0 ? Math.round(somaTempo / respondidosComTempo.length) : 0;
    
    const dentroSla = respondidosComTempo.filter(d => (d.tempo_resposta_minutos || 0) <= 240).length; // SLA 4h = 240min
    const slaPercent = respondidosComTempo.length > 0 ? Math.round((dentroSla / respondidosComTempo.length) * 100) : 100;

    // Cálculo de valores financeiros
    const totalOrcamentado = filteredData.reduce((acc, curr) => acc + (curr.valor_proforma || 0), 0);
    const ticketMedio = respondidos > 0 ? totalOrcamentado / respondidos : 0;

    return { total, respondidos, pendentes, mediaTempo, slaPercent, totalOrcamentado, ticketMedio };
  }, [filteredData]);

  // 3. Chart Data Preparation (Status Distribution)
  const statusDistribution = useMemo(() => {
    // Show distribution of data filtered ONLY by family, to allow status selection
    const contextData = data.filter(d => activeFamily ? d.familia_produto === activeFamily : true);

    const counts = {
      [EstadoPedido.RESPONDIDO]: 0,
      [EstadoPedido.PENDENTE]: 0,
      [EstadoPedido.CANCELADO]: 0,
      [EstadoPedido.IGNORADO]: 0,
    };
    contextData.forEach(d => { counts[d.estado] = (counts[d.estado] || 0) + 1; });
    return [
      { name: 'Respondido', value: counts[EstadoPedido.RESPONDIDO], key: EstadoPedido.RESPONDIDO },
      { name: 'Pendente', value: counts[EstadoPedido.PENDENTE], key: EstadoPedido.PENDENTE },
      { name: 'Cancelado', value: counts[EstadoPedido.CANCELADO], key: EstadoPedido.CANCELADO },
      { name: 'Ignorado', value: counts[EstadoPedido.IGNORADO], key: EstadoPedido.IGNORADO },
    ];
  }, [data, activeFamily]);

  const familyDistribution = useMemo(() => {
    // Show distribution of data filtered ONLY by status, to allow family selection
    const contextData = data.filter(d => activeStatus ? d.estado === activeStatus : true);

    const counts: {[key: string]: number} = {};
    contextData.forEach(d => {
      const fam = d.familia_produto || 'Não classificado';
      counts[fam] = (counts[fam] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6
  }, [data, activeStatus]);

  const timeDistribution = useMemo(() => {
    const buckets = {
      '0-1h': 0,
      '1-4h': 0,
      '4-8h': 0,
      '>8h': 0,
    };
    filteredData.filter(d => d.tempo_resposta_minutos !== undefined).forEach(d => {
      const m = d.tempo_resposta_minutos || 0;
      if (m <= 60) buckets['0-1h']++;
      else if (m <= 240) buckets['1-4h']++;
      else if (m <= 480) buckets['4-8h']++;
      else buckets['>8h']++;
    });
    return Object.keys(buckets).map(key => ({ name: key, value: buckets[key as keyof typeof buckets] }));
  }, [filteredData]);

  // Evolution Data - Uses Filtered Data
  const evolutionData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    const currentMonth = now.getMonth();

    const getValue = (d: PedidoCotacao) => metricMode === 'COUNT' ? 1 : (d.valor_proforma || 0);

    if (viewMode === 'YEARLY') {
      const yearlyMap = new Map<number, number>();
      filteredData.forEach(d => {
        const year = new Date(d.data_hora_recepcao).getFullYear();
        const val = getValue(d);
        yearlyMap.set(year, (yearlyMap.get(year) || 0) + val);
      });
      
      return Array.from(yearlyMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, val]) => ({
          name: year.toString(),
          Atual: val,
          Anterior: 0 
        }));
    }

    if (viewMode === 'MONTHLY') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return months.map((monthName, index) => {
        const currentVal = filteredData
          .filter(d => {
            const date = new Date(d.data_hora_recepcao);
            return date.getMonth() === index && date.getFullYear() === currentYear;
          })
          .reduce((acc, curr) => acc + getValue(curr), 0);

        const prevVal = filteredData
          .filter(d => {
            const date = new Date(d.data_hora_recepcao);
            return date.getMonth() === index && date.getFullYear() === previousYear;
          })
          .reduce((acc, curr) => acc + getValue(curr), 0);

        return { name: monthName, Atual: currentVal, Anterior: prevVal };
      });
    }

    if (viewMode === 'DAILY') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return daysArray.map(day => {
        const currentVal = filteredData
          .filter(d => {
            const date = new Date(d.data_hora_recepcao);
            return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          })
          .reduce((acc, curr) => acc + getValue(curr), 0);

        const prevVal = filteredData
          .filter(d => {
            const date = new Date(d.data_hora_recepcao);
            return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === previousYear;
          })
          .reduce((acc, curr) => acc + getValue(curr), 0);

        return { name: day.toString(), Atual: currentVal, Anterior: prevVal };
      });
    }
    return [];
  }, [filteredData, viewMode, metricMode]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  const formatTooltipValue = (val: number) => {
    return metricMode === 'VALUE' ? formatCurrency(val) : val;
  };

  // Handlers
  const toggleFamily = (familyName: string) => {
    setActiveFamily(prev => prev === familyName ? null : familyName);
  };

  const toggleStatus = (statusName: string) => {
    setActiveStatus(prev => prev === statusName ? null : statusName);
  };

  const resetFilters = () => {
    setActiveFamily(null);
    setActiveStatus(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">A carregar métricas e a processar histórico...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Active Filters Bar */}
      {(activeFamily || activeStatus) && (
        <div className="bg-mdv-primary/5 border border-mdv-primary/20 p-3 rounded-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
             <Filter className="w-4 h-4 text-mdv-primary" />
             <span className="text-sm font-medium text-gray-700">Filtros Ativos:</span>
             <div className="flex gap-2">
               {activeFamily && (
                 <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs font-medium text-mdv-primary shadow-sm">
                   {activeFamily}
                   <button onClick={() => setActiveFamily(null)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                 </span>
               )}
               {activeStatus && (
                 <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs font-medium text-mdv-primary shadow-sm">
                   {activeStatus}
                   <button onClick={() => setActiveStatus(null)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                 </span>
               )}
             </div>
          </div>
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-mdv-primary underline">
            Limpar Tudo
          </button>
        </div>
      )}

      {/* KPIs Header Row 1: Operational */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-mdv-primary flex items-center justify-between transition-transform hover:scale-[1.01]">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
            <p className="text-3xl font-bold text-mdv-primary">{kpis.total}</p>
          </div>
          <BarChart3 className="text-mdv-primary h-8 w-8 opacity-20" />
        </div>
        
        <div 
          className={`bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500 flex items-center justify-between cursor-pointer transition-all hover:shadow-md ${activeStatus === EstadoPedido.RESPONDIDO ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
          onClick={() => toggleStatus(EstadoPedido.RESPONDIDO)}
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Respondidos</p>
            <p className="text-3xl font-bold text-green-600">{kpis.respondidos}</p>
            <p className="text-xs text-green-500 mt-1">{kpis.slaPercent}% dentro SLA (4h)</p>
          </div>
          <CheckCircle className="text-green-500 h-8 w-8 opacity-20" />
        </div>

        <div 
          className={`bg-white p-6 rounded-lg shadow-sm border-l-4 border-amber-500 flex items-center justify-between cursor-pointer transition-all hover:shadow-md ${activeStatus === EstadoPedido.PENDENTE ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
          onClick={() => toggleStatus(EstadoPedido.PENDENTE)}
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Pendentes</p>
            <p className="text-3xl font-bold text-amber-600">{kpis.pendentes}</p>
          </div>
          <AlertCircle className="text-amber-500 h-8 w-8 opacity-20" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tempo Médio</p>
            <p className="text-3xl font-bold text-blue-600">{Math.floor(kpis.mediaTempo / 60)}h {kpis.mediaTempo % 60}m</p>
          </div>
          <Clock className="text-blue-500 h-8 w-8 opacity-20" />
        </div>
      </div>

      {/* KPIs Header Row 2: Financial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Orçamentado</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{formatCurrency(kpis.totalOrcamentado)}</p>
            <p className="text-xs text-gray-400 mt-1">Valor acumulado (filtrado)</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full">
            <Banknote className="text-blue-600 h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Valor Médio / Cotação</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{formatCurrency(kpis.ticketMedio)}</p>
             <p className="text-xs text-gray-400 mt-1">Ticket médio das propostas</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-full">
            <FileText className="text-purple-600 h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Evolution Chart Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-mdv-primary" /> 
              Análise Evolutiva
            </h3>
            <p className="text-sm text-gray-500">Comparativo com período homólogo (Dados Filtrados)</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {/* Toggle View Mode */}
             <div className="flex bg-gray-100 p-1 rounded-md">
                <button onClick={() => setViewMode('DAILY')} className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'DAILY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Diária</button>
                <button onClick={() => setViewMode('MONTHLY')} className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'MONTHLY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mensal</button>
                <button onClick={() => setViewMode('YEARLY')} className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'YEARLY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Anual</button>
             </div>

             {/* Toggle Metric Mode */}
             <div className="flex bg-gray-100 p-1 rounded-md">
                <button onClick={() => setMetricMode('COUNT')} className={`p-1.5 rounded ${metricMode === 'COUNT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Quantidade"><Hash className="w-4 h-4" /></button>
                <button onClick={() => setMetricMode('VALUE')} className={`p-1.5 rounded ${metricMode === 'VALUE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Valor Financeiro"><DollarSign className="w-4 h-4" /></button>
             </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={(val) => metricMode === 'VALUE' ? (val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`) : val}
                tick={{ fontSize: 12 }}
              />
              <RechartsTooltip 
                formatter={(value: number) => [formatTooltipValue(value), metricMode === 'VALUE' ? 'Valor' : 'Qtd']}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Atual" name={viewMode === 'YEARLY' ? "Total" : (new Date().getFullYear().toString())} fill={CHART_COLORS.current} radius={[4, 4, 0, 0]} />
              {viewMode !== 'YEARLY' && (
                <Bar dataKey="Anterior" name={(new Date().getFullYear() - 1).toString()} fill={CHART_COLORS.previous} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row: Operational Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Time Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Tempo de Resposta
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#8D6E63" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart - CLICKABLE */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Estado (Filtro)
          </h3>
          <div className="h-64 w-full flex justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => toggleStatus(data.key)}
                  cursor="pointer"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      opacity={activeStatus && activeStatus !== entry.key ? 0.3 : 1}
                      stroke={activeStatus === entry.key ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Central Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                 <span className="block text-xs text-gray-500">Clique para</span>
                 <span className="block text-xs font-bold text-gray-700">Filtrar</span>
               </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-2 text-xs text-gray-600 flex-wrap">
            {statusDistribution.map((entry, index) => (
              <div key={entry.name} className={`flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1 rounded ${activeStatus === entry.key ? 'font-bold text-gray-900' : ''}`} onClick={() => toggleStatus(entry.key)}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Family Product Chart - CLICKABLE */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" /> Famílias (Filtro)
          </h3>
          <div className="h-64 w-full flex justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={familyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => toggleFamily(data.name)}
                  cursor="pointer"
                >
                  {familyDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-fam-${index}`} 
                      fill={FAMILY_COLORS[index % FAMILY_COLORS.length]} 
                      opacity={activeFamily && activeFamily !== entry.name ? 0.3 : 1}
                      stroke={activeFamily === entry.name ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
             {/* Central Label */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                 <span className="block text-xs text-gray-500">Clique para</span>
                 <span className="block text-xs font-bold text-gray-700">Filtrar</span>
               </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-2 text-xs text-gray-600 flex-wrap">
            {familyDistribution.slice(0, 3).map((entry, index) => (
              <div key={entry.name} className={`flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1 rounded ${activeFamily === entry.name ? 'font-bold text-gray-900' : ''}`} onClick={() => toggleFamily(entry.name)}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FAMILY_COLORS[index % FAMILY_COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};