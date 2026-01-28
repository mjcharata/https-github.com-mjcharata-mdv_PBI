

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/mockApi';
import { Colaborador, MovimentoPonto, Ausencia, PedidoFerias, EstadoAprovacao } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar as CalendarIcon, Clock, Users, AlertCircle, CheckCircle, FileText, Plus, Download, X, Plane, UserCog, Camera, ScanFace, Power, Ban } from 'lucide-react';

export const AttendanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'AUSENCIAS' | 'FERIAS' | 'COLABORADORES'>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [ferias, setFerias] = useState<PedidoFerias[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoPonto[]>([]);

  // Form States
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [newAbsence, setNewAbsence] = useState({ tipo: 'DOENCA', data_inicio: '', data_fim: '', motivo: '' });

  // Add Colaborador State
  const [showAddColabModal, setShowAddColabModal] = useState(false);
  const [newColab, setNewColab] = useState({ nome: '', email: '', cargo: '', departamento: '' });

  // Facial Registration States
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [selectedColabForFace, setSelectedColabForFace] = useState<Colaborador | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processingFace, setProcessingFace] = useState(false);
  const [faceMessage, setFaceMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Cleanup stream on modal close
    if (!showFaceModal && stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
    }
  }, [showFaceModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cols, aus, fer, movs] = await Promise.all([
        api.getColaboradores(),
        api.getAusencias(),
        api.getFerias(),
        api.getMovimentos()
      ]);
      setColaboradores(cols);
      setAusencias(aus);
      setFerias(fer);
      setMovimentos(movs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- CÁLCULO DE KPIs ---
  const kpis = React.useMemo(() => {
    const totalCols = colaboradores.filter(c => c.ativo).length;
    const pendingVacations = ferias.filter(f => f.estado === EstadoAprovacao.PENDENTE).length;
    
    // Mock para gráficos (em produção seria calculado via backend)
    const attendanceTrend = [
      { name: 'Seg', percent: 98 }, { name: 'Ter', percent: 95 }, 
      { name: 'Qua', percent: 100 }, { name: 'Qui', percent: 92 }, { name: 'Sex', percent: 96 }
    ];

    const hoursData = colaboradores.filter(c => c.ativo).map(c => {
       return { name: c.nome.split(' ')[0], horas: 38 + Math.random() * 5 };
    });

    return { totalCols, pendingVacations, attendanceTrend, hoursData };
  }, [colaboradores, ferias]);

  const handleApproveAbsence = async (id: string) => {
    await api.atualizarEstadoAusencia(id, EstadoAprovacao.APROVADO);
    loadData();
  };

  const handleApproveVacation = async (id: string) => {
    await api.atualizarEstadoFerias(id, EstadoAprovacao.APROVADO);
    loadData();
  };

  const submitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaboradores[0]) return; // Safety check
    await api.criarAusencia({
      colaborador_id: colaboradores[0].id, // Assume user atual
      colaborador_nome: colaboradores[0].nome,
      data_inicio: newAbsence.data_inicio,
      data_fim: newAbsence.data_fim,
      tipo: newAbsence.tipo as any,
      motivo: newAbsence.motivo
    });
    setShowAbsenceModal(false);
    setNewAbsence({ tipo: 'DOENCA', data_inicio: '', data_fim: '', motivo: '' });
    loadData();
  };

  const handleAddColab = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await api.addColaborador(newColab);
        setNewColab({ nome: '', email: '', cargo: '', departamento: '' });
        setShowAddColabModal(false);
        await loadData();
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if(!window.confirm("Tem a certeza que deseja alterar o estado deste colaborador?")) return;
    try {
        await api.toggleColaboradorStatus(id);
        await loadData();
    } catch (err) {
        console.error(err);
    }
  };

  // --- FACIAL REGISTRATION LOGIC ---
  const openFaceModal = async (colab: Colaborador) => {
      setSelectedColabForFace(colab);
      setShowFaceModal(true);
      setFaceMessage(null);
      
      try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
          });
          setStream(mediaStream);
          if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play();
          }
      } catch (err) {
          console.error("Camera error:", err);
          setFaceMessage("Erro ao aceder à câmara. Verifique as permissões.");
      }
  };

  const captureFace = async () => {
      if (!videoRef.current || !canvasRef.current || !selectedColabForFace) return;
      
      setProcessingFace(true);
      try {
          const context = canvasRef.current.getContext('2d');
          if (context) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              
              // Espelhar
              context.translate(canvasRef.current.width, 0);
              context.scale(-1, 1);
              context.drawImage(videoRef.current, 0, 0);
              
              const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
              
              await api.atualizarBiometria(selectedColabForFace.id, imageBase64);
              setFaceMessage("Face registada com sucesso!");
              
              // Fechar após delay
              setTimeout(() => {
                  setShowFaceModal(false);
                  loadData(); // Recarregar para atualizar status
              }, 1500);
          }
      } catch (err) {
          console.error(err);
          setFaceMessage("Erro ao guardar imagem.");
      } finally {
          setProcessingFace(false);
      }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">A carregar módulo de RH...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-2 overflow-x-auto">
        <button onClick={() => setActiveTab('DASHBOARD')} className={`px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'DASHBOARD' ? 'border-mdv-primary text-mdv-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
           Visão Geral
        </button>
        <button onClick={() => setActiveTab('COLABORADORES')} className={`px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'COLABORADORES' ? 'border-mdv-primary text-mdv-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
           Colaboradores & Biometria
        </button>
        <button onClick={() => setActiveTab('AUSENCIAS')} className={`px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'AUSENCIAS' ? 'border-mdv-primary text-mdv-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
           Gestão de Ausências
        </button>
        <button onClick={() => setActiveTab('FERIAS')} className={`px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'FERIAS' ? 'border-mdv-primary text-mdv-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
           Mapa de Férias
        </button>
      </div>

      {/* VIEW: DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-mdv-primary relative overflow-hidden">
              <p className="text-xs font-medium text-gray-500 uppercase relative z-10">Colaboradores Ativos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 relative z-10">{kpis.totalCols}</h3>
              <Users className="w-16 h-16 text-mdv-primary absolute -bottom-4 -right-4 opacity-10" />
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500 relative overflow-hidden">
              <p className="text-xs font-medium text-gray-500 uppercase relative z-10">Assiduidade Semanal</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 relative z-10">96.2%</h3>
              <CheckCircle className="w-16 h-16 text-green-600 absolute -bottom-4 -right-4 opacity-10" />
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-amber-500 relative overflow-hidden">
              <p className="text-xs font-medium text-gray-500 uppercase relative z-10">Pedidos Férias</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 relative z-10">{kpis.pendingVacations}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1 relative z-10">Pendentes aprovação</p>
              <Plane className="w-16 h-16 text-amber-600 absolute -bottom-4 -right-4 opacity-10" />
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500 relative overflow-hidden">
              <p className="text-xs font-medium text-gray-500 uppercase relative z-10">Ausências Hoje</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 relative z-10">0</h3>
              <AlertCircle className="w-16 h-16 text-red-600 absolute -bottom-4 -right-4 opacity-10" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Taxa de Assiduidade (%)</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={kpis.attendanceTrend}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                         <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                         <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         <Line type="monotone" dataKey="percent" stroke="#5D4037" strokeWidth={3} dot={{fill: '#5D4037', r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Horas Trabalhadas (Última Semana)</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.hoursData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                         <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         <Bar dataKey="horas" fill="#8D6E63" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* VIEW: COLABORADORES */}
      {activeTab === 'COLABORADORES' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-fade-in">
           <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  Ficha de Colaboradores
               </h3>
               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                 {colaboradores.length} Total
               </span>
             </div>
             <button 
                onClick={() => setShowAddColabModal(true)}
                className="flex items-center gap-2 bg-mdv-primary text-white px-3 py-1.5 rounded-md text-sm hover:bg-mdv-secondary shadow-sm transition-colors"
             >
                <Plus className="w-4 h-4" /> Novo Colaborador
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500 border-b">
                   <tr>
                      <th className="px-6 py-3 font-medium">Nome</th>
                      <th className="px-6 py-3 font-medium">Cargo</th>
                      <th className="px-6 py-3 font-medium">Departamento</th>
                      <th className="px-6 py-3 font-medium">Biometria</th>
                      <th className="px-6 py-3 font-medium text-center">Estado</th>
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {colaboradores.map(colab => (
                      <tr key={colab.id} className={`hover:bg-gray-50 transition-colors ${!colab.ativo ? 'opacity-60 bg-gray-50' : ''}`}>
                         <td className="px-6 py-4 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-600 font-bold ${colab.ativo ? 'bg-gray-200' : 'bg-gray-100'}`}>
                               {colab.nome.charAt(0)}
                            </div>
                            <div>
                               <span className={`font-medium ${colab.ativo ? 'text-gray-900' : 'text-gray-500'}`}>{colab.nome}</span>
                               <p className="text-xs text-gray-400">{colab.email}</p>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-gray-500">{colab.cargo}</td>
                         <td className="px-6 py-4 text-gray-500">{colab.departamento}</td>
                         <td className="px-6 py-4">
                            {colab.foto_biometrica ? (
                               <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                  <ScanFace className="w-3 h-3" /> OK
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium">
                                  <AlertCircle className="w-3 h-3" /> Pendente
                               </span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${colab.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {colab.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                onClick={() => openFaceModal(colab)}
                                disabled={!colab.ativo}
                                className="text-mdv-primary hover:bg-mdv-primary/10 p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Registar Face"
                                >
                                <Camera className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleToggleStatus(colab.id)}
                                    className={`${colab.ativo ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'} p-1.5 rounded transition-colors`}
                                    title={colab.ativo ? "Inativar" : "Ativar"}
                                >
                                    {colab.ativo ? <Ban className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* VIEW: AUSÊNCIAS */}
      {activeTab === 'AUSENCIAS' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-fade-in">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Histórico de Ausências</h3>
              <button 
                 onClick={() => setShowAbsenceModal(true)}
                 className="flex items-center gap-2 bg-mdv-primary text-white px-4 py-2 rounded-md text-sm hover:bg-mdv-secondary font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" /> Justificar Ausência
              </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-white text-gray-500 border-b">
                 <tr>
                   <th className="px-6 py-3 font-medium">Colaborador</th>
                   <th className="px-6 py-3 font-medium">Tipo</th>
                   <th className="px-6 py-3 font-medium">Período</th>
                   <th className="px-6 py-3 font-medium">Motivo</th>
                   <th className="px-6 py-3 font-medium">Estado</th>
                   <th className="px-6 py-3 font-medium text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {ausencias.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Sem registos de ausência.</td></tr>
                 )}
                 {ausencias.map(aus => (
                   <tr key={aus.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 font-medium text-gray-900">{aus.colaborador_nome}</td>
                     <td className="px-6 py-4">
                       <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{aus.tipo}</span>
                     </td>
                     <td className="px-6 py-4 text-gray-500">
                       {new Date(aus.data_inicio).toLocaleDateString()} <span className="text-gray-300 px-1">→</span> {new Date(aus.data_fim).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-4 text-gray-600 italic truncate max-w-xs" title={aus.motivo}>{aus.motivo}</td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${aus.estado === 'APROVADO' ? 'bg-green-100 text-green-800' : 
                            aus.estado === 'PENDENTE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                        `}>
                          {aus.estado === 'APROVADO' && <CheckCircle className="w-3 h-3" />}
                          {aus.estado === 'PENDENTE' && <Clock className="w-3 h-3" />}
                          {aus.estado}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       {aus.estado === 'PENDENTE' && (
                          <div className="flex justify-end gap-2">
                             <button onClick={() => handleApproveAbsence(aus.id)} className="text-green-600 hover:bg-green-50 border border-green-200 px-3 py-1 rounded text-xs font-medium transition-colors">Aprovar</button>
                             <button className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1 rounded text-xs font-medium transition-colors">Rejeitar</button>
                          </div>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* VIEW: FÉRIAS */}
      {activeTab === 'FERIAS' && (
        <div className="space-y-6 animate-fade-in">
           {/* Cards de Saldo */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {colaboradores.slice(0,3).map(colab => (
                 <div key={colab.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                          {colab.nome.charAt(0)}
                       </div>
                       <div>
                          <p className="font-bold text-gray-800 text-sm">{colab.nome}</p>
                          <p className="text-xs text-gray-500">{colab.departamento}</p>
                       </div>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-3 bg-gray-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                       <span className="text-gray-500 font-medium">Saldo Disponível</span>
                       <span className="font-bold text-mdv-primary bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{colab.saldo_ferias} dias</span>
                    </div>
                 </div>
              ))}
           </div>

           <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                 <h3 className="text-lg font-semibold text-gray-800">Pedidos de Férias</h3>
              </div>
              <table className="w-full text-sm text-left">
                 <thead className="bg-white text-gray-500 border-b">
                   <tr>
                     <th className="px-6 py-3 font-medium">Colaborador</th>
                     <th className="px-6 py-3 font-medium">Datas</th>
                     <th className="px-6 py-3 font-medium">Dias Úteis</th>
                     <th className="px-6 py-3 font-medium">Observações</th>
                     <th className="px-6 py-3 font-medium">Estado</th>
                     <th className="px-6 py-3 font-medium text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {ferias.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">Sem pedidos de férias pendentes.</td></tr>
                   )}
                   {ferias.map(fer => (
                     <tr key={fer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{fer.colaborador_nome}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                           {new Date(fer.data_inicio).toLocaleDateString()} - {new Date(fer.data_fim).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">{fer.dias_uteis}</td>
                        <td className="px-6 py-4 text-gray-500 italic">{fer.observacoes || '-'}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                              ${fer.estado === 'APROVADO' ? 'bg-green-100 text-green-800' : 
                                fer.estado === 'PENDENTE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                           `}>
                              {fer.estado}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {fer.estado === 'PENDENTE' && (
                              <button 
                                 onClick={() => handleApproveVacation(fer.id)}
                                 className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 px-3 py-1 rounded hover:bg-green-50"
                              >
                                 Aprovar
                              </button>
                           )}
                        </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODAL: Novo Colaborador */}
      {showAddColabModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Novo Colaborador</h3>
                      <button onClick={() => setShowAddColabModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <form onSubmit={handleAddColab} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                          <input 
                              type="text" 
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                              value={newColab.nome}
                              onChange={e => setNewColab({...newColab, nome: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input 
                              type="email" 
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                              value={newColab.email}
                              onChange={e => setNewColab({...newColab, email: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                              <input 
                                  type="text" 
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                                  value={newColab.cargo}
                                  onChange={e => setNewColab({...newColab, cargo: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                              <select 
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                                  value={newColab.departamento}
                                  onChange={e => setNewColab({...newColab, departamento: e.target.value})}
                                  required
                              >
                                  <option value="">Selecione...</option>
                                  <option value="Produção">Produção</option>
                                  <option value="Logística">Logística</option>
                                  <option value="Comercial">Comercial</option>
                                  <option value="Financeiro">Financeiro</option>
                                  <option value="Recursos Humanos">Recursos Humanos</option>
                              </select>
                          </div>
                      </div>
                      <div className="pt-4">
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-mdv-primary text-white py-3 rounded-md hover:bg-mdv-secondary font-bold shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
                          >
                              {loading ? 'A Guardar...' : 'Criar Colaborador'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL: Registar Face */}
      {showFaceModal && selectedColabForFace && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative">
             <button onClick={() => setShowFaceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                <X className="w-6 h-6" />
             </button>

             <h3 className="text-xl font-bold text-gray-800 mb-2">Registo Biométrico</h3>
             <p className="text-sm text-gray-500 mb-6">
                Capture uma foto frontal de <span className="font-bold text-gray-700">{selectedColabForFace.nome}</span> para validação de ponto.
             </p>

             <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-200 mb-6">
                 {/* Video Stream */}
                 <video 
                     ref={videoRef} 
                     className="w-full h-full object-cover transform scale-x-[-1]"
                     autoPlay 
                     muted 
                     playsInline 
                 />
                 <canvas ref={canvasRef} className="hidden" />
                 
                 {/* Guides */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-40 h-56 border-2 border-dashed border-white/70 rounded-[50%]"></div>
                 </div>
                 
                 {faceMessage && (
                     <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded text-sm backdrop-blur-md">
                         {faceMessage}
                     </div>
                 )}
             </div>

             <div className="flex justify-end gap-3">
                 <button 
                    onClick={() => setShowFaceModal(false)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={captureFace}
                    disabled={processingFace || !stream}
                    className="px-6 py-2 bg-mdv-primary text-white rounded-md font-bold hover:bg-mdv-secondary disabled:opacity-50 flex items-center gap-2"
                 >
                    {processingFace ? <span className="animate-spin">⌛</span> : <Camera className="w-4 h-4" />}
                    Capturar & Guardar
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL: Nova Ausência */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-gray-800">Justificar Ausência</h3>
               <button onClick={() => setShowAbsenceModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={submitAbsence} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ausência</label>
                   <select 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                      value={newAbsence.tipo}
                      onChange={e => setNewAbsence({...newAbsence, tipo: e.target.value})}
                   >
                      <option value="DOENCA">Doença</option>
                      <option value="FAMILIA">Assistência Familiar</option>
                      <option value="OUTRO">Outro Motivo</option>
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                      <input 
                        type="date" 
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                        value={newAbsence.data_inicio}
                        onChange={e => setNewAbsence({...newAbsence, data_inicio: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                      <input 
                        type="date" 
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                        value={newAbsence.data_fim}
                        onChange={e => setNewAbsence({...newAbsence, data_fim: e.target.value})}
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Descrição</label>
                   <textarea 
                      required
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-mdv-primary focus:border-mdv-primary"
                      placeholder="Descreva o motivo..."
                      value={newAbsence.motivo}
                      onChange={e => setNewAbsence({...newAbsence, motivo: e.target.value})}
                   />
                </div>
                <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-300">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Anexar Comprovativo (PDF/IMG)</label>
                   <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-mdv-primary/10 file:text-mdv-primary hover:file:bg-mdv-primary/20 cursor-pointer"/>
                </div>
                <div className="pt-4">
                   <button type="submit" className="w-full bg-mdv-primary text-white py-3 rounded-md hover:bg-mdv-secondary font-bold shadow-md transition-transform active:scale-[0.98]">
                      Submeter Justificação
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};