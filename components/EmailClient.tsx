import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApi';
import { EmailMessage } from '../types';
import { 
  Inbox, Send, Trash2, File, Star, Search, RefreshCw, Paperclip, 
  MoreVertical, CornerUpLeft, CornerUpRight, Reply, ReplyAll, Forward,
  ChevronLeft, ChevronRight, Menu, Mail, Plus
} from 'lucide-react';

export const EmailClient: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'TRASH' | 'DRAFTS'>('INBOX');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await api.getEmails();
      setEmails(data);
      // Auto-select first email of Inbox if available
      const inboxFirst = data.find(e => e.folder === 'INBOX');
      if (inboxFirst) setSelectedEmailId(inboxFirst.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = async (email: EmailMessage) => {
    setSelectedEmailId(email.id);
    if (!email.read) {
        // Mark as read locally and in API
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
        await api.markEmailRead(email.id);
    }
  };

  const filteredEmails = useMemo(() => {
    return emails
      .filter(e => e.folder === activeFolder)
      .filter(e => 
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.preview.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [emails, activeFolder, searchTerm]);

  const selectedEmail = useMemo(() => 
    emails.find(e => e.id === selectedEmailId), 
  [emails, selectedEmailId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const formatFullDate = (dateStr: string) => {
     return new Date(dateStr).toLocaleString('pt-PT', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
     });
  };

  if (loading && emails.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400">A carregar correio...</div>;
  }

  return (
    <div className="h-[calc(100vh-100px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
      
      {/* 1. FOLDER PANE (Left Sidebar) */}
      <div className="w-full md:w-56 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
         <div className="p-4">
             <button className="w-full bg-mdv-primary text-white py-2 px-4 rounded-md shadow-sm hover:bg-mdv-secondary transition-colors flex items-center justify-center gap-2 font-medium">
                <Plus className="w-4 h-4" /> Novo Email
             </button>
         </div>
         <nav className="flex-1 overflow-y-auto px-2 space-y-1">
             <button 
                onClick={() => setActiveFolder('INBOX')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeFolder === 'INBOX' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
             >
                <div className="flex items-center gap-3">
                   <Inbox className="w-4 h-4" /> Caixa de Entrada
                </div>
                {emails.filter(e => e.folder === 'INBOX' && !e.read).length > 0 && (
                   <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {emails.filter(e => e.folder === 'INBOX' && !e.read).length}
                   </span>
                )}
             </button>
             <button 
                onClick={() => setActiveFolder('SENT')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeFolder === 'SENT' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
             >
                <div className="flex items-center gap-3">
                   <Send className="w-4 h-4" /> Enviados
                </div>
             </button>
             <button 
                onClick={() => setActiveFolder('DRAFTS')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeFolder === 'DRAFTS' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
             >
                <div className="flex items-center gap-3">
                   <File className="w-4 h-4" /> Rascunhos
                </div>
             </button>
             <button 
                onClick={() => setActiveFolder('TRASH')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeFolder === 'TRASH' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
             >
                <div className="flex items-center gap-3">
                   <Trash2 className="w-4 h-4" /> Lixo
                </div>
             </button>
         </nav>
      </div>

      {/* 2. EMAIL LIST PANE (Middle) */}
      <div className={`${selectedEmail ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200 bg-white flex-shrink-0`}>
         {/* Search Header */}
         <div className="p-3 border-b border-gray-200 flex items-center gap-2">
            <div className="relative flex-1">
               <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-300 focus:ring-0 rounded-md text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Filtrar">
               <Menu className="w-4 h-4" />
            </button>
         </div>
         
         {/* List */}
         <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm p-4 text-center">
                  <Mail className="w-8 h-8 mb-2 opacity-20" />
                  Nenhum email nesta pasta.
               </div>
            ) : (
               filteredEmails.map(email => (
                  <div 
                     key={email.id}
                     onClick={() => handleSelectEmail(email)}
                     className={`group p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative
                        ${selectedEmailId === email.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
                        ${!email.read ? 'bg-white' : 'bg-gray-50/50'}
                     `}
                  >
                     <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm truncate pr-2 ${!email.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                           {email.from.name}
                        </span>
                        <span className={`text-xs whitespace-nowrap ${!email.read ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                           {formatDate(email.date)}
                        </span>
                     </div>
                     <div className={`text-sm mb-1 truncate ${!email.read ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                        {email.subject}
                     </div>
                     <div className="text-xs text-gray-500 truncate">
                        {email.preview}
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                        {email.hasAttachments && <Paperclip className="w-3 h-3 text-gray-400" />}
                        {email.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* 3. READING PANE (Right) */}
      <div className={`${!selectedEmail ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-white h-full relative`}>
         {selectedEmail ? (
            <>
               {/* Toolbar */}
               <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
                  <div className="flex items-center gap-1">
                      <button className="md:hidden mr-2 p-1 hover:bg-gray-100 rounded" onClick={() => setSelectedEmailId(null)}>
                         <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded" title="Eliminar">
                         <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="h-6 w-px bg-gray-300 mx-2"></div>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Responder">
                         <Reply className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Responder a Todos">
                         <ReplyAll className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Encaminhar">
                         <Forward className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-amber-400 hover:bg-gray-100 rounded">
                         <Star className={`w-5 h-5 ${selectedEmail.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded">
                         <MoreVertical className="w-5 h-5" />
                      </button>
                  </div>
               </div>

               {/* Email Content */}
               <div className="flex-1 overflow-y-auto p-6">
                  {/* Header Info */}
                  <div className="mb-6">
                     <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedEmail.subject}</h2>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-mdv-secondary/20 flex items-center justify-center text-mdv-secondary font-bold text-sm">
                              {selectedEmail.from.avatar || selectedEmail.from.name.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                              <div className="flex items-baseline gap-2">
                                 <span className="font-bold text-gray-900">{selectedEmail.from.name}</span>
                                 <span className="text-sm text-gray-500">&lt;{selectedEmail.from.email}&gt;</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                 Para: {selectedEmail.to.join(', ')}
                              </div>
                           </div>
                        </div>
                        <div className="text-sm text-gray-500">
                           {formatFullDate(selectedEmail.date)}
                        </div>
                     </div>
                  </div>

                  {/* Body */}
                  <div className="prose prose-sm max-w-none text-gray-800 border-t border-gray-100 pt-6">
                     <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                  </div>

                  {/* Attachments */}
                  {selectedEmail.hasAttachments && selectedEmail.attachments && (
                     <div className="mt-8 border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                           <Paperclip className="w-4 h-4" /> Anexos ({selectedEmail.attachments.length})
                        </h4>
                        <div className="flex flex-wrap gap-3">
                           {selectedEmail.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-white shadow-sm max-w-xs">
                                 <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 font-bold text-[10px] uppercase">
                                    {att.type.split('/')[1] || 'FILE'}
                                 </div>
                                 <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
                                    <p className="text-xs text-gray-500">{att.size}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </>
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30">
               <Mail className="w-16 h-16 mb-4 opacity-10" />
               <p className="text-lg font-medium">Selecione um email para ler</p>
            </div>
         )}
      </div>
    </div>
  );
};
