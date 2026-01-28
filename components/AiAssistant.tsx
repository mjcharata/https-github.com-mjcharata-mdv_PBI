import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { api } from '../services/mockApi';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Olá! Sou o assistente inteligente da MDV Madeiras. Tenho acesso aos dados de vendas, clientes, cotações e RH. Em que posso ajudar?',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Obter Contexto da App
      const appData = await api.getContextoGlobal();
      
      // 2. Preparar Prompt de Sistema
      const systemInstruction = `
        És um assistente de gestão empresarial da MDV Madeiras.
        
        A tua ÚNICA fonte de verdade é o seguinte objeto JSON com os dados da empresa:
        ${JSON.stringify(appData)}
        
        REGRAS ESTRITAS:
        1. Responde APENAS com base nos dados fornecidos acima.
        2. Se o utilizador perguntar algo que não está nos dados (ex: meteorologia, factos externos, dados não listados), responde educadamente que não tens essa informação no sistema.
        3. NÃO inventes nomes, valores ou factos (Não alucines).
        4. Sê conciso e direto.
        5. Se te pedirem resumos financeiros, calcula com base nos dados 'kpis_vendas' ou 'ultimos_pedidos'.
        6. Se pedirem sobre RH, consulta 'kpis_rh'.
        7. Responde em Português de Portugal.
      `;

      // 3. Chamar Gemini API
      // Nota: A chave API deve estar disponível em process.env.API_KEY
      if (!process.env.API_KEY) {
        throw new Error("API Key não configurada.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Utilizar modelo Gemini 3 Flash para tarefas de texto básicas/rápidas
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg.text,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.2, // Baixa temperatura para reduzir alucinações
        }
      });

      const aiResponse = response.text;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiResponse || "Desculpe, não consegui processar a resposta.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Erro AI:", error);
      let errorText = "Ocorreu um erro ao comunicar com a inteligência.";
      if (error instanceof Error && error.message.includes("API Key")) {
        errorText = "Erro de configuração: Chave API não encontrada.";
      }
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: errorText,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-gray-600 rotate-90' : 'bg-mdv-primary text-white'}`}
        title="Assistente IA"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Janela de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-48px)] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up h-[500px]">
          
          {/* Header */}
          <div className="bg-mdv-primary text-white p-4 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">MDV Intelligence</h3>
              <p className="text-xs text-white/80">Powered by Gemini 3</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-mdv-primary text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Simples formatação de quebras de linha */}
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="min-h-[1rem]">{line}</p>
                  ))}
                  <span className={`text-[10px] block mt-1 text-right ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-mdv-primary" />
                  <span className="text-xs text-gray-500">A analisar dados...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre vendas, clientes..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdv-primary/50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-mdv-primary text-white p-2 rounded-lg hover:bg-mdv-secondary disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};