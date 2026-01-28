import React, { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertTriangle, User, Clock, RefreshCw, LogIn, LogOut, X, MapPin, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/mockApi';
import { Colaborador, MovimentoPonto, TipoMovimento } from '../types';

export const TimeClock: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
  const [lastPunch, setLastPunch] = useState<MovimentoPonto | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // State Workflow
  const [step, setStep] = useState<1|2|3>(1); // 1: Select Type, 2: Select User, 3: Camera
  const [selectedType, setSelectedType] = useState<TipoMovimento | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  
  // Data
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Geo
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar lista completa de colaboradores
    api.getColaboradores().then(cols => {
        setColaboradores(cols);
    });
    
    return () => stopCamera();
  }, []);

  // Efeito para ligar o stream ao elemento de vídeo quando o stream muda
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startProcess = (type: TipoMovimento) => {
      setSelectedType(type);
      setStep(2);
      setSearchTerm('');
  };

  const selectUser = (colab: Colaborador) => {
      setSelectedColaborador(colab);
      initCamera(colab);
  };

  const initCamera = async (colab: Colaborador) => {
    setStep(3);
    setCameraError(null);
    setLocationError(null);
    setMessage(null);

    // 1. Tentar obter geolocalização
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.warn("Erro de geolocalização:", error);
                setLocationError("Localização não detetada. O registo será marcado sem coordenadas.");
            }
        );
    } else {
        setLocationError("Geolocalização não suportada neste dispositivo.");
    }

    // 2. Iniciar Câmara
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         throw new Error("O seu navegador não suporta acesso à câmara.");
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      
      setStream(mediaStream);
      
      // Force play safely
      if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.error("Auto-play blocked", e));
          };
      }
    } catch (err: any) {
      console.error("Erro câmara:", err);
      setCameraError('Não foi possível aceder à webcam. Verifique se deu permissão ao navegador e se está a usar HTTPS.');
      setMessage({ type: 'error', text: 'Câmara indisponível.' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCancel = () => {
    stopCamera();
    setSelectedType(null);
    setSelectedColaborador(null);
    setStep(1);
    setMessage(null);
    setCameraError(null);
    setLocation(null);
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedColaborador || !selectedType) {
        setMessage({ type: 'error', text: 'Erro de inicialização. Recarregue a página.' });
        return;
    }

    // Verificar se o vídeo tem dados suficientes
    if (videoRef.current.readyState < 2) { // HAVE_CURRENT_DATA or higher
        setMessage({ type: 'info', text: 'A aguardar sinal da câmara... Tente novamente em instantes.' });
        return;
    }

    setProcessing(true);
    setMessage({ type: 'info', text: 'A registar ponto e localização...' });

    try {
        // 1. Capturar frame para o Canvas
        const context = canvasRef.current.getContext('2d');
        if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            
            // Espelhar o contexto se o vídeo estiver espelhado
            context.translate(canvasRef.current.width, 0);
            context.scale(-1, 1);
            
            context.drawImage(videoRef.current, 0, 0);
            
            // Reset transform
            context.setTransform(1, 0, 0, 1, 0, 0);
            
            // 2. Converter para Base64
            const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);

            // 3. Enviar para API (com Location se disponível)
            const movimento = await api.registarPonto(
                selectedColaborador.id, 
                imageBase64, 
                selectedType,
                location?.lat,
                location?.lng
            );
            
            setLastPunch(movimento);
            setMessage({ 
              type: 'success', 
              text: `${movimento.tipo} registada para ${selectedColaborador.nome} às ${new Date(movimento.data_hora).toLocaleTimeString()}` 
            });

            // Desligar câmara
            stopCamera();
            
            // Voltar ao início após sucesso (delay curto)
            setTimeout(() => {
                handleCancel();
            }, 4000);

        } else {
            throw new Error("Falha ao inicializar contexto de captura.");
        }

    } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Falha técnica no registo. Tente novamente.' });
    } finally {
        setProcessing(false);
    }
  };

  // Filtro de Colaboradores
  const filteredColabs = colaboradores.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-mdv-primary" />
            Registo de Ponto Biométrico
          </h2>
          <p className="text-gray-500">Sistema de reconhecimento facial com georreferenciação</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Coluna Esquerda: Workflow Steps */}
          <div className="flex flex-col items-center space-y-4 justify-center min-h-[400px]">
            
            {/* PASSO 1: Seleção de Tipo */}
            {step === 1 && (
              <div className="w-full space-y-4 animate-slide-up">
                <p className="text-center text-gray-600 mb-4 font-medium">1. Selecione o tipo de movimento:</p>
                <button 
                  onClick={() => startProcess(TipoMovimento.ENTRADA)}
                  className="w-full py-6 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-transform transform hover:scale-[1.02] active:scale-95"
                >
                  <LogIn className="w-8 h-8" />
                  <span className="text-xl font-bold">REGISTAR ENTRADA</span>
                </button>
                
                <button 
                  onClick={() => startProcess(TipoMovimento.SAIDA)}
                  className="w-full py-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-transform transform hover:scale-[1.02] active:scale-95"
                >
                  <LogOut className="w-8 h-8" />
                  <span className="text-xl font-bold">REGISTAR SAÍDA</span>
                </button>
              </div>
            )}

            {/* PASSO 2: Seleção de Colaborador */}
            {step === 2 && (
              <div className="w-full h-full flex flex-col animate-slide-up">
                 <div className="flex items-center justify-between mb-4">
                    <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
                       <X className="w-4 h-4" /> Cancelar
                    </button>
                    <span className="text-sm font-bold text-gray-400">PASSO 2/3</span>
                 </div>
                 
                 <p className="text-gray-800 font-bold text-lg mb-2">Quem é você?</p>
                 
                 <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar nome ou cargo..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-mdv-primary focus:border-mdv-primary bg-gray-50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                 </div>

                 <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1 custom-scrollbar">
                    {filteredColabs.map(colab => (
                       <button 
                         key={colab.id}
                         onClick={() => selectUser(colab)}
                         className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-mdv-primary hover:bg-mdv-primary/5 transition-all group text-left"
                       >
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                {colab.nome.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold text-gray-800 group-hover:text-mdv-primary">{colab.nome}</p>
                                <p className="text-xs text-gray-500">{colab.cargo}</p>
                             </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-mdv-primary" />
                       </button>
                    ))}
                 </div>
              </div>
            )}

            {/* PASSO 3: Câmara e Captura */}
            {step === 3 && selectedColaborador && (
              <div className="w-full flex flex-col animate-slide-up items-center">
                <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden shadow-inner border-4 border-gray-200 group">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${processing ? 'opacity-50 grayscale' : ''} transform scale-x-[-1]`}
                  />
                  
                  {/* Overlay Silhueta */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity">
                    <div className="w-40 h-56 border-2 border-white/60 rounded-[50%] border-dashed shadow-lg"></div>
                  </div>

                  {/* Loading State */}
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-800 z-10 p-6 text-center">
                      <Camera className="w-10 h-10 mb-4 opacity-50" />
                      <span className="font-medium text-lg mb-2">A iniciar câmara...</span>
                      {cameraError && (
                        <p className="text-xs text-red-300 max-w-xs bg-red-900/30 p-2 rounded border border-red-800/50">
                            {cameraError}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Tags Info */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                     <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs font-bold flex items-center gap-1">
                        {selectedType === 'ENTRADA' ? <LogIn className="w-3 h-3 text-green-400" /> : <LogOut className="w-3 h-3 text-amber-400" />}
                        {selectedType}
                     </div>
                     <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-[10px] font-medium flex items-center gap-1">
                        <MapPin className={`w-3 h-3 ${location ? 'text-blue-400' : 'text-gray-400'}`} />
                        {location ? 'GPS OK' : 'A obter GPS...'}
                     </div>
                  </div>
                </div>

                {locationError && (
                  <div className="w-full text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 mt-2 flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" /> {locationError}
                  </div>
                )}

                <div className="w-full max-w-md grid grid-cols-3 gap-2 mt-4">
                  <button
                    onClick={handleCancel}
                    className="col-span-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </button>
                  
                  <button
                    onClick={captureAndVerify}
                    disabled={processing || !stream}
                    className={`col-span-2 py-4 rounded-md font-bold text-white transition-all transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2
                      ${processing || !stream
                        ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                        : selectedType === 'ENTRADA' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                  >
                    {processing ? (
                      <span className="animate-pulse">A Processar...</span>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        CONFIRMAR
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Informação e Feedback */}
          <div className="flex flex-col justify-center space-y-6">
             
             {/* Identificação (Só aparece após seleção) */}
             <div className={`bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-4 shadow-sm transition-opacity duration-500 ${selectedColaborador ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                <div className="w-14 h-14 bg-mdv-primary rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-sm">
                  {selectedColaborador ? selectedColaborador.nome.charAt(0) : '?'}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Colaborador Selecionado</p>
                  <h3 className="font-bold text-gray-800 text-lg">{selectedColaborador ? selectedColaborador.nome : 'Aguardando seleção...'}</h3>
                  <p className="text-sm text-gray-500">{selectedColaborador?.cargo || '---'}</p>
                </div>
             </div>

             {/* Mensagens de Feedback */}
             {message && (
               <div className={`p-4 rounded-lg border-l-4 flex items-start gap-3 animate-fade-in shadow-sm
                 ${message.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 
                   message.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-blue-50 border-blue-500 text-blue-800'}
               `}>
                 {message.type === 'success' && <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0 text-green-600" />}
                 {message.type === 'error' && <AlertTriangle className="w-6 h-6 mt-0.5 flex-shrink-0 text-red-600" />}
                 {message.type === 'info' && <User className="w-6 h-6 mt-0.5 flex-shrink-0 text-blue-600" />}
                 <div>
                   <p className="font-bold">{message.type === 'success' ? 'Sucesso!' : message.type === 'error' ? 'Atenção' : 'Aguarde'}</p>
                   <p className="text-sm">{message.text}</p>
                 </div>
               </div>
             )}

             {/* Detalhes do Último Registo */}
             {lastPunch && (
               <div className="mt-auto pt-6 border-t border-gray-200 animate-slide-up">
                 <p className="text-xs font-bold text-gray-400 uppercase mb-3">Último Registo Efetuado</p>
                 <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div>
                     <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${lastPunch.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                       {lastPunch.tipo}
                     </span>
                     <p className="text-3xl font-mono font-bold text-gray-800 leading-none">
                       {new Date(lastPunch.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                     <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{new Date(lastPunch.data_hora).toLocaleDateString()}</p>
                        {lastPunch.latitude && (
                           <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 flex items-center" title={`Lat: ${lastPunch.latitude}, Lng: ${lastPunch.longitude}`}>
                              <MapPin className="w-2 h-2 mr-0.5" /> GPS
                           </span>
                        )}
                     </div>
                   </div>
                   
                   {lastPunch.confianca_facial && (
                      <div className="text-right">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-4 border-green-100 text-green-700 font-bold text-xs bg-green-50">
                          {(lastPunch.confianca_facial * 100).toFixed(0)}%
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Confiança</p>
                      </div>
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};