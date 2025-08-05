import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import VariableSelector from "./VariableSelector";
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  Copy,
  MessageSquare,
  Send,
  Hash,
  Search,
  Sparkles
} from "lucide-react";

interface BancoMensajesProps {
  onVolver: () => void;
}

interface Plantilla {
  id: string;
  titulo: string;
  contenido_markdown: string;
  variables_usadas: string[];
  created_at: string;
}

interface Variable {
  nombre: string;
  valor: string | string[];
  tipo: 'texto' | 'array';
}

const BancoMensajes = ({ onVolver }: BancoMensajesProps) => {
  const { toast } = useToast();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<Plantilla | null>(null);
  const [contenidoMensaje, setContenidoMensaje] = useState("");
  const [tituloPlantilla, setTituloPlantilla] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [mensajeGenerado, setMensajeGenerado] = useState("");
  const [loading, setLoading] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [busquedaPlantilla, setBusquedaPlantilla] = useState("");
  
  // Variable selector
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const { data, error } = await supabase
        .from('plantillas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlantillas(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cargar las plantillas",
        variant: "destructive",
      });
    }
  };

  const cargarPlantilla = (plantilla: Plantilla) => {
    setPlantillaSeleccionada(plantilla);
    setContenidoMensaje(plantilla.contenido_markdown);
    setTituloPlantilla(plantilla.titulo);
    
    const variablesEncontradas = extraerVariables(plantilla.contenido_markdown);
    setVariables(variablesEncontradas.map(v => ({ 
      nombre: v, 
      valor: "", 
      tipo: 'texto' as const
    })));
  };

  const extraerVariables = (texto: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = texto.match(regex);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match.slice(1, -1)))];
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContenidoMensaje(value);
    setCursorPosition(cursorPos);
    
    // Detectar si el usuario escribió '{'
    if (value[cursorPos - 1] === '{') {
      const rect = e.target.getBoundingClientRect();
      setSelectorPosition({
        x: rect.left,
        y: rect.top + rect.height + 10
      });
      setShowVariableSelector(true);
    }
    
    // Actualizar variables encontradas
    const variablesEncontradas = extraerVariables(value);
    const nuevasVariables = variablesEncontradas.map(nombre => {
      const existente = variables.find(v => v.nombre === nombre);
      return existente || { nombre, valor: "", tipo: 'texto' as const };
    });
    setVariables(nuevasVariables);
  };

  const insertarVariable = (variableText: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = cursorPosition - 1; // -1 para reemplazar el '{'
    const end = cursorPosition;
    
    const newValue = contenidoMensaje.substring(0, start) + 
                    variableText + 
                    contenidoMensaje.substring(end);
    
    setContenidoMensaje(newValue);
    setShowVariableSelector(false);
    
    // Foco de vuelta al textarea
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variableText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 100);
  };

  const guardarPlantilla = async () => {
    if (!tituloPlantilla || !contenidoMensaje) {
      toast({
        title: "Campos incompletos",
        description: "Ingresa un título y contenido para la plantilla",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const variablesUsadas = extraerVariables(contenidoMensaje);
      
      if (plantillaSeleccionada) {
        // Actualizar plantilla existente
        const { error } = await supabase
          .from('plantillas')
          .update({
            titulo: tituloPlantilla,
            contenido_markdown: contenidoMensaje,
            variables_usadas: variablesUsadas,
          })
          .eq('id', plantillaSeleccionada.id);

        if (error) throw error;
        
        toast({
          title: "Plantilla actualizada",
          description: "La plantilla se ha actualizado exitosamente",
        });
      } else {
        // Crear nueva plantilla
        const { error } = await supabase
          .from('plantillas')
          .insert({
            titulo: tituloPlantilla,
            contenido_markdown: contenidoMensaje,
            variables_usadas: variablesUsadas,
          });

        if (error) throw error;

        toast({
          title: "Plantilla guardada",
          description: "La plantilla se ha guardado exitosamente",
        });
      }

      cargarPlantillas();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al guardar la plantilla",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const duplicarPlantilla = () => {
    setPlantillaSeleccionada(null);
    setTituloPlantilla(`${tituloPlantilla} (Copia)`);
  };

  const limpiarEditor = () => {
    setPlantillaSeleccionada(null);
    setTituloPlantilla("");
    setContenidoMensaje("");
    setVariables([]);
    setMensajeGenerado("");
  };

  const formatearArrayComoLista = (valor: string | string[]): string => {
    if (Array.isArray(valor)) {
      return valor.map(item => `• ${item}`).join('\n');
    }
    if (typeof valor === 'string' && valor.includes('\n')) {
      return valor.split('\n').map(item => `• ${item.trim()}`).join('\n');
    }
    return valor as string;
  };

  const generarMensaje = () => {
    let mensaje = contenidoMensaje;
    
    variables.forEach(variable => {
      if (variable.valor) {
        const regex = new RegExp(`\\{${variable.nombre}\\}`, 'g');
        const valorFormateado = variable.tipo === 'array' || variable.nombre === 'trackings' 
          ? formatearArrayComoLista(variable.valor)
          : variable.valor;
        mensaje = mensaje.replace(regex, valorFormateado as string);
      }
    });

    setMensajeGenerado(mensaje);
    toast({
      title: "Mensaje generado",
      description: "El mensaje ha sido generado con las variables",
    });
  };

  const actualizarVariable = (index: number, campo: 'nombre' | 'valor' | 'tipo', valor: any) => {
    const nuevasVariables = [...variables];
    nuevasVariables[index] = { ...nuevasVariables[index], [campo]: valor };
    setVariables(nuevasVariables);
  };

  const copiarMensaje = () => {
    navigator.clipboard.writeText(mensajeGenerado);
    toast({
      title: "Copiado",
      description: "Mensaje copiado al portapapeles",
    });
  };

  const abrirWhatsApp = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const abrirTelegram = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://t.me/share/url?text=${mensaje}`, '_blank');
  };

  const plantillasFiltradas = plantillas.filter(plantilla =>
    plantilla.titulo.toLowerCase().includes(busquedaPlantilla.toLowerCase()) ||
    plantilla.variables_usadas.some(v => v.toLowerCase().includes(busquedaPlantilla.toLowerCase()))
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-primary relative"
    >
      {/* Header */}
      <motion.header 
        variants={itemVariants}
        className="glass-card mx-6 pt-8 pb-6 px-8 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onVolver}
              className="hover-lift interactive-scale text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-keybox-blue/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-keybox-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Banco de Mensajes</h1>
                <p className="text-white/70">Editor avanzado con variables dinámicas y autocompletado</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={limpiarEditor}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
            <Button
              onClick={duplicarPlantilla}
              disabled={!plantillaSeleccionada}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Panel Lateral - Plantillas */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="glass-card border-white/20 shadow-floating h-fit">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Plantillas Guardadas
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    placeholder="Buscar plantillas..."
                    value={busquedaPlantilla}
                    onChange={(e) => setBusquedaPlantilla(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {plantillasFiltradas.map((plantilla, index) => (
                  <motion.div
                    key={plantilla.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => cargarPlantilla(plantilla)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover-lift ${
                      plantillaSeleccionada?.id === plantilla.id
                        ? 'bg-keybox-blue/20 border border-keybox-blue/40'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <h3 className="font-semibold text-white text-sm mb-2">{plantilla.titulo}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {plantilla.variables_usadas.slice(0, 3).map((variable) => (
                        <Badge 
                          key={variable} 
                          className="text-xs bg-keybox-yellow/20 text-keybox-yellow border-keybox-yellow/30"
                        >
                          {variable}
                        </Badge>
                      ))}
                      {plantilla.variables_usadas.length > 3 && (
                        <Badge className="text-xs bg-white/10 text-white/70">
                          +{plantilla.variables_usadas.length - 3}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2">
                      {plantilla.contenido_markdown.substring(0, 60)}...
                    </p>
                  </motion.div>
                ))}
                
                {plantillasFiltradas.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">No hay plantillas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Editor Principal */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="glass-card border-white/20 shadow-floating">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Editor de Plantillas</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setVistaPrevia(!vistaPrevia)}
                      variant="ghost"
                      className="text-white/70 hover:text-white hover:bg-white/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {vistaPrevia ? 'Editor' : 'Preview'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-white">Título de la Plantilla</Label>
                  <Input
                    value={tituloPlantilla}
                    onChange={(e) => setTituloPlantilla(e.target.value)}
                    placeholder="Mi plantilla personalizada..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl px-4 py-3"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label className="text-white flex items-center gap-2">
                    Contenido del Mensaje
                    <Badge className="bg-keybox-yellow/20 text-keybox-yellow text-xs">
                      Escriba &#123; para insertar variables
                    </Badge>
                  </Label>
                  
                  {!vistaPrevia ? (
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={contenidoMensaje}
                        onChange={handleTextareaChange}
                        placeholder="¡Hola {nombre}! Tu pedido de {cantidad} productos está listo..."
                        rows={12}
                        className="font-mono text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl p-4 resize-none"
                      />
                      <div className="absolute top-2 right-2">
                        <Sparkles className="w-4 h-4 text-keybox-yellow animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl p-4 min-h-[300px] border border-white/20">
                      <div className="text-white/90 whitespace-pre-wrap font-mono text-sm">
                        {contenidoMensaje || "Escribe tu plantilla para ver la previsualización..."}
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-2"
                >
                  <Button
                    onClick={guardarPlantilla}
                    disabled={loading}
                    className="flex-1 bg-keybox-navy text-white hover:bg-keybox-navy/90 rounded-xl font-medium shadow-medium hover:shadow-strong"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Guardando..." : plantillaSeleccionada ? "Actualizar" : "Guardar Plantilla"}
                  </Button>
                  
                  {variables.length > 0 && (
                    <Button
                      onClick={generarMensaje}
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      <Hash className="w-4 h-4 mr-2" />
                      Procesar Variables
                    </Button>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Panel Variables */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="glass-card border-white/20 shadow-floating">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Variables ({variables.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {variables.map((variable, index) => (
                  <motion.div
                    key={`${variable.nombre}-${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-keybox-blue/20 text-keybox-blue border-keybox-blue/30">
                        {variable.nombre}
                      </Badge>
                      <select
                        value={variable.tipo}
                        onChange={(e) => actualizarVariable(index, 'tipo', e.target.value as 'texto' | 'array')}
                        className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                      >
                        <option value="texto" className="text-black">Texto</option>
                        <option value="array" className="text-black">Lista</option>
                      </select>
                    </div>
                    
                    {variable.tipo === 'array' ? (
                      <Textarea
                        value={Array.isArray(variable.valor) ? variable.valor.join('\n') : variable.valor}
                        onChange={(e) => actualizarVariable(index, 'valor', e.target.value.split('\n'))}
                        placeholder="Elemento 1&#10;Elemento 2&#10;Elemento 3"
                        rows={3}
                        className="text-xs bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg"
                      />
                    ) : (
                      <Input
                        value={variable.valor as string}
                        onChange={(e) => actualizarVariable(index, 'valor', e.target.value)}
                        placeholder="Valor de la variable..."
                        className="text-xs bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg"
                      />
                    )}
                  </motion.div>
                ))}
                
                {variables.length === 0 && (
                  <div className="text-center py-8">
                    <Hash className="w-12 h-12 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">
                      Usa {"{variable}"} en tu plantilla
                    </p>
                  </div>
                )}

                {mensajeGenerado && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-3 pt-4 border-t border-white/20"
                  >
                    <h4 className="text-white font-medium">Mensaje Final:</h4>
                    <div className="bg-white/5 rounded-xl p-3 text-white/90 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                      {mensajeGenerado}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        size="sm"
                        onClick={copiarMensaje}
                        variant="outline"
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        onClick={abrirWhatsApp}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MessageSquare className="w-3 h-3 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        onClick={abrirTelegram}
                        variant="outline"
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Send className="w-3 h-3 mr-2" />
                        Telegram
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Variable Selector */}
      <VariableSelector
        isOpen={showVariableSelector}
        onClose={() => setShowVariableSelector(false)}
        onSelectVariable={insertarVariable}
        position={selectorPosition}
      />
    </motion.div>
  );
};

export default BancoMensajes;