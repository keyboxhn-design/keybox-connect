import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Phone,
  X 
} from "lucide-react";

interface Plantilla {
  id: string;
  titulo: string;
  contenido_markdown: string;
  variables_usadas: string[];
}

interface Variable {
  nombre: string;
  valor: string | string[];
  tipo: 'texto' | 'array';
}

interface MessageGeneratorModalProps {
  plantilla: Plantilla | null;
  isOpen: boolean;
  onClose: () => void;
}

const MessageGeneratorModal = ({ plantilla, isOpen, onClose }: MessageGeneratorModalProps) => {
  const { toast } = useToast();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");
  const [mensajeGenerado, setMensajeGenerado] = useState("");

  const initializeVariables = () => {
    if (!plantilla) return;
    
    const vars = plantilla.variables_usadas.map(v => ({
      nombre: v,
      valor: "",
      tipo: 'texto' as const
    }));
    setVariables(vars);
  };

  useState(() => {
    if (plantilla && isOpen) {
      initializeVariables();
    }
  });

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
    if (!plantilla) return;
    
    let mensaje = plantilla.contenido_markdown;
    
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

  const actualizarVariable = (index: number, valor: string) => {
    const nuevasVariables = [...variables];
    nuevasVariables[index] = { ...nuevasVariables[index], valor };
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
    if (!numeroWhatsApp) {
      toast({
        title: "Número requerido",
        description: "Ingresa un número de WhatsApp",
        variant: "destructive",
      });
      return;
    }
    
    const numero = numeroWhatsApp.replace(/\D/g, '');
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank');
  };

  const abrirTelegram = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://t.me/share/url?text=${mensaje}`, '_blank');
  };

  if (!plantilla) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modern-card">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Generar Mensaje</h2>
                <p className="text-sm text-muted-foreground">{plantilla.titulo}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Variables */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Variables</h3>
              <Badge className="modern-badge text-xs">
                {variables.length} variables
              </Badge>
            </div>
            
            <div className="space-y-3">
              {variables.map((variable, index) => (
                <motion.div
                  key={variable.nombre}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-2"
                >
                  <Label className="modern-label">
                    {variable.nombre}
                  </Label>
                  <Input
                    value={variable.valor as string}
                    onChange={(e) => actualizarVariable(index, e.target.value)}
                    placeholder={`Valor para ${variable.nombre}...`}
                    className="modern-input"
                  />
                </motion.div>
              ))}
              
              {variables.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Esta plantilla no tiene variables
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="modern-label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Número de WhatsApp
              </Label>
              <Input
                value={numeroWhatsApp}
                onChange={(e) => setNumeroWhatsApp(e.target.value)}
                placeholder="+504 9999-9999"
                className="modern-input"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generarMensaje}
                className="modern-button flex-1"
                disabled={variables.some(v => !v.valor) && variables.length > 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generar Mensaje
              </Button>
            </div>
          </div>

          {/* Vista Previa */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Vista Previa</h3>
            
            <div className="preview-box min-h-[300px]">
              {mensajeGenerado || "Genere el mensaje para ver la vista previa..."}
            </div>

            {mensajeGenerado && (
              <div className="flex gap-2">
                <Button
                  onClick={copiarMensaje}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  onClick={abrirWhatsApp}
                  className="modern-button flex-1"
                  disabled={!numeroWhatsApp}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  onClick={abrirTelegram}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageGeneratorModal;