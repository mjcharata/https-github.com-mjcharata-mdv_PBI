

import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Table2, RefreshCw, LogOut, Menu, Settings as SettingsIcon, BarChart3, Lock, Clock, Users, ShieldAlert, Briefcase, Mail } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { QuoteTable } from './components/QuoteTable';
import { Settings } from './components/Settings';
import { SalesAnalysis } from './components/SalesAnalysis';
import { TimeClock } from './components/TimeClock';
import { AttendanceDashboard } from './components/AttendanceDashboard';
import { CustomerAnalysis } from './components/CustomerAnalysis';
import { EmailClient } from './components/EmailClient';
import { AiAssistant } from './components/AiAssistant';
import { api } from './services/mockApi';
import { PedidoCotacao, RoleAccessConfig, UserRole, AppPermission } from './types';

// Helper para verificar permissões
const hasPermission = (role: UserRole, permission: AppPermission, accessConfig: RoleAccessConfig[]): boolean => {
  const config = accessConfig.find(c => c.role === role);
  return config ? config.permissions.includes(permission) : false;
};

// Sidebar Component
const Sidebar = ({ 
  mobileOpen, 
  setMobileOpen, 
  userRole, 
  accessConfig 
}: { 
  mobileOpen: boolean, 
  setMobileOpen: (v: boolean) => void,
  userRole: UserRole,
  accessConfig: RoleAccessConfig[]
}) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path ? 'bg-mdv-secondary/30 text-white' : 'text-gray-300 hover:bg-mdv-secondary/10 hover:text-white';
  const can = (p: AppPermission) => hasPermission(userRole, p, accessConfig);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      
      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-mdv-primary text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Area - White background for correct logo contrast */}
        <div className="h-24 flex items-center justify-center bg-white border-b border-mdv-primary/20 px-4">
          <img 
            src="https://mdvmadeiras.com/wp-content/uploads/2021/02/logo-mdv.png" 
            alt="MDV Madeiras" 
            className="h-16 max-w-full object-contain"
            onError={(e) => {
              // Fallback text if image fails again
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-mdv-primary font-bold text-xl">MDV MADEIRAS</span>';
            }}
          />
        </div>
        
        <nav className="mt-6 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comercial</p>
          
          {can(AppPermission.VIEW_DASHBOARD) && (
            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/')}`} onClick={() => setMobileOpen(false)}>
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          )}

          {can(AppPermission.VIEW_EMAILS) && (
            <Link to="/email" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/email')}`} onClick={() => setMobileOpen(false)}>
              <Mail className="w-5 h-5" />
              <span>Email & Comunicações</span>
            </Link>
          )}

          {can(AppPermission.VIEW_QUOTES) && (
            <Link to="/pedidos" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/pedidos')}`} onClick={() => setMobileOpen(false)}>
              <Table2 className="w-5 h-5" />
              <span>Cotações (CRM)</span>
            </Link>
          )}

          {can(AppPermission.VIEW_SALES) && (
            <Link to="/vendas" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/vendas')}`} onClick={() => setMobileOpen(false)}>
              <BarChart3 className="w-5 h-5" />
              <span>Análise de Vendas</span>
            </Link>
          )}

          {can(AppPermission.VIEW_CUSTOMERS) && (
            <Link to="/clientes" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/clientes')}`} onClick={() => setMobileOpen(false)}>
              <Briefcase className="w-5 h-5" />
              <span>Análise Clientes</span>
            </Link>
          )}

          <div className="my-4 border-t border-white/10"></div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recursos Humanos</p>

          {can(AppPermission.VIEW_TIMECLOCK) && (
            <Link to="/ponto" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/ponto')}`} onClick={() => setMobileOpen(false)}>
              <Clock className="w-5 h-5" />
              <span>Relógio de Ponto</span>
            </Link>
          )}

          {can(AppPermission.VIEW_ATTENDANCE) && (
            <Link to="/rh" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/rh')}`} onClick={() => setMobileOpen(false)}>
              <Users className="w-5 h-5" />
              <span>Assiduidade e Férias</span>
            </Link>
          )}
          
          <div className="my-4 border-t border-white/10"></div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sistema</p>
          
          {(can(AppPermission.MANAGE_SETTINGS) || can(AppPermission.MANAGE_USERS) || can(AppPermission.MANAGE_ACL)) && (
            <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/settings')}`} onClick={() => setMobileOpen(false)}>
              <SettingsIcon className="w-5 h-5" />
              <span>Definições</span>
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/10 bg-mdv-primary">
          <button 
             onClick={() => window.location.reload()}
             className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

interface ProtectedRouteProps {
  role: UserRole;
  permission: AppPermission;
  accessConfig: RoleAccessConfig[];
}

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  role, 
  permission, 
  accessConfig 
}: React.PropsWithChildren<ProtectedRouteProps>) => {
  if (accessConfig.length === 0) return null; // Loading state handled in parent or effectively hidden
  
  if (!hasPermission(role, permission, accessConfig)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
        <p>Não tem permissão para aceder a esta funcionalidade.</p>
      </div>
    );
  }
  return <>{children}</>;
};

// Timeout in milliseconds (15 minutes)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; 

// Main Layout & App
const MainLayout = () => {
  const [data, setData] = useState<PedidoCotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // ACL State
  const [currentUser, setCurrentUser] = useState<{name: string, role: UserRole}>({ name: 'Carlos Manuel', role: UserRole.ADMIN });
  const [accessConfig, setAccessConfig] = useState<RoleAccessConfig[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to reset timer
  const resetTimer = () => {
    if (sessionExpired) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSessionExpired(true);
    }, INACTIVITY_TIMEOUT);
  };

  // Setup activity listeners
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    resetTimer();
    const handleActivity = () => resetTimer();
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [sessionExpired]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pedidos, acl] = await Promise.all([
        api.getPedidos(),
        api.getAccessControl()
      ]);
      setData(pedidos);
      setAccessConfig(acl);
      setLastSync(new Date());
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePedido = async (id: string, updates: Partial<PedidoCotacao>) => {
    await api.updatePedido(id, updates);
    // Atualização otimista ou refresh
    setData(prev => prev.map(p => p.id_interno === id ? { ...p, ...updates } : p));
  };

  const handleUnlock = () => {
    setSessionExpired(false);
    resetTimer();
  };

  if (sessionExpired) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sessão Bloqueada</h2>
          <p className="text-gray-500 mb-6">
            Por motivos de segurança, a sua sessão foi bloqueada após 15 minutos de inatividade.
          </p>
          <button 
            onClick={handleUnlock}
            className="w-full bg-mdv-primary text-white py-3 rounded-md hover:bg-mdv-secondary transition-colors font-medium"
          >
            Desbloquear Sessão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-mdv-bg overflow-hidden relative">
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        userRole={currentUser.role} 
        accessConfig={accessConfig}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-gray-600" onClick={() => setMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Portal MDV</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Role Switcher Simulator for Demo Purposes */}
            <select 
               className="text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600"
               value={currentUser.role}
               onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as UserRole})}
               title="Simular Perfil (Apenas Demo)"
            >
              {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <span className="text-xs text-gray-500 hidden sm:inline">
              Última sinc.: {lastSync.toLocaleTimeString('pt-PT')}
            </span>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
            <div className="h-8 w-8 bg-mdv-primary rounded-full flex items-center justify-center text-white text-xs font-bold" title={currentUser.role}>
              {currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main Content Scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_DASHBOARD} accessConfig={accessConfig}>
                   <Dashboard data={data} loading={loading} />
                </ProtectedRoute>
              } />
              
              <Route path="/email" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_EMAILS} accessConfig={accessConfig}>
                   <EmailClient />
                </ProtectedRoute>
              } />

              <Route path="/pedidos" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_QUOTES} accessConfig={accessConfig}>
                  <QuoteTable data={data} onUpdate={handleUpdatePedido} />
                </ProtectedRoute>
              } />
              
              <Route path="/vendas" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_SALES} accessConfig={accessConfig}>
                  <SalesAnalysis />
                </ProtectedRoute>
              } />

              <Route path="/clientes" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_CUSTOMERS} accessConfig={accessConfig}>
                  <CustomerAnalysis />
                </ProtectedRoute>
              } />
              
              <Route path="/ponto" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_TIMECLOCK} accessConfig={accessConfig}>
                  <TimeClock />
                </ProtectedRoute>
              } />
              
              <Route path="/rh" element={
                <ProtectedRoute role={currentUser.role} permission={AppPermission.VIEW_ATTENDANCE} accessConfig={accessConfig}>
                  <AttendanceDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                // Settings requires specific permission but acts as entry point for sub-tabs
                <ProtectedRoute role={currentUser.role} permission={AppPermission.MANAGE_SETTINGS} accessConfig={accessConfig}>
                  <Settings />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
      
      {/* AI Assistant Overlay */}
      <AiAssistant />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
};

export default App;