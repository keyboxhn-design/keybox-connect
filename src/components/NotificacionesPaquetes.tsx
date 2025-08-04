import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Copy, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificacionesPaquetesProps {
  onVolver: () => void;
}

interface Cliente {
  id: string;
  numero_cliente: string;
  nombre: string;
  email?: string;
  telefono?: string;
}

const NotificacionesPaquetes = ({ onVolver }: NotificacionesPaquetesProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    numeroCliente: "",
    nombre: "",
    modalidad: "",
    cantidad: "",
    trackings: "",
    peso: "",
    monto: "",
    incluirDomicilio: false,
    tipoDomicilio: "TGU",
    esperarMasPaquetes: false,
  });

  const [mensajeGenerado, setMensajeGenerado] = useState("");

  // Buscar cliente por número
  const buscarCliente = async (numeroCliente: string) => {
    if (!numeroCliente) return;
    
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('numero_cliente', numeroCliente)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCliente(data);
        setFormData(prev => ({
          ...prev,
          nombre: data.nombre,
        }));
        
        toast({
          title: "Cliente encontrado",
          description: `Datos de ${data.nombre} cargados automáticamente`,
        });
      } else {
        setCliente(null);
        toast({
          title: "Cliente no encontrado",
          description: "Puedes crear un nuevo cliente con estos datos",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al buscar el cliente",
        variant: "destructive",
      });
    }
  };

  // Efecto para buscar cliente cuando cambia el número
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.numeroCliente.length > 2) {
        buscarCliente(formData.numeroCliente);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.numeroCliente]);

  // Generar mensaje
  const generarMensaje = async () => {
    if (!formData.numeroCliente || !formData.nombre || !formData.modalidad || !formData.cantidad || !formData.trackings || !formData.peso || !formData.monto) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Formatear trackings
      const trackingsList = formData.trackings
        .split('\n')
        .filter(t => t.trim())
        .map(t => `- ${t.trim()}`)
        .join('\n');

      // Información de domicilio
      let domicilioInfo = "";
      if (formData.incluirDomicilio) {
        const precio = formData.tipoDomicilio === "TGU" ? "L70" : "L125";
        domicilioInfo = `📍 Domicilio ${formData.tipoDomicilio} desde ${precio}\n(No se acepta pago en efectivo)\n\n`;
      }

      // Mensaje de esperar más paquetes
      const esperarMensaje = formData.esperarMasPaquetes 
        ? "Si estás esperando más paquetes, puedes esperar la próxima notificación para agruparlos 😄📦\n\n"
        : "";

      // Generar mensaje final
      const mensaje = `¡Hola *${formData.nombre}*! 🚀

🎁 Tienes *${formData.cantidad} paquete(s)* listos para entrega vía *${formData.modalidad}* ✈️

📦 Trackings:
${trackingsList}

⚖️ Peso total: *${formData.peso} lbs*
💰 Monto a pagar: *L${formData.monto}*

💡 Puedes consultar nuestras formas de pago aquí:
👉 https://www.keyboxhn.com/formas-de-pago

${domicilioInfo}${esperarMensaje}¡Gracias por elegir KeyBox! ✨`;

      setMensajeGenerado(mensaje);

      // Guardar cliente si no existe
      if (!cliente) {
        const { error: clienteError } = await supabase
          .from('clientes')
          .insert({
            numero_cliente: formData.numeroCliente,
            nombre: formData.nombre,
          });

        if (clienteError) console.error('Error al guardar cliente:', clienteError);
      }

      // Guardar paquete
      const { error: paqueteError } = await supabase
        .from('paquetes')
        .insert({
          cliente_id: cliente?.id,
          cantidad: parseInt(formData.cantidad),
          modalidad: formData.modalidad,
          peso_total: parseFloat(formData.peso),
          monto: parseFloat(formData.monto),
          trackings: formData.trackings.split('\n').filter(t => t.trim()),
          incluir_domicilio: formData.incluirDomicilio,
          tipo_domicilio: formData.tipoDomicilio,
          esperar_mas_paquetes: formData.esperarMasPaquetes,
        });

      if (paqueteError) console.error('Error al guardar paquete:', paqueteError);

      toast({
        title: "Mensaje generado",
        description: "El mensaje ha sido generado exitosamente",
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al generar el mensaje",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copiar mensaje
  const copiarMensaje = () => {
    navigator.clipboard.writeText(mensajeGenerado);
    toast({
      title: "Copiado",
      description: "Mensaje copiado al portapapeles",
    });
  };

  // Abrir WhatsApp
  const abrirWhatsApp = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  // Abrir Telegram
  const abrirTelegram = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://t.me/share/url?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={onVolver}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notificaciones Paquetes</h1>
            <p className="text-muted-foreground">Genera mensajes automáticos para WhatsApp y Telegram</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Paquete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroCliente">Número de Cliente KeyBox *</Label>
                  <Input
                    id="numeroCliente"
                    value={formData.numeroCliente}
                    onChange={(e) => setFormData({...formData, numeroCliente: e.target.value})}
                    placeholder="KB12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Destinatario *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Carlos Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modalidad">Modalidad de Envío *</Label>
                  <Select value={formData.modalidad} onValueChange={(value) => setFormData({...formData, modalidad: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Marítimo">Marítimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad de Paquetes *</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackings">Códigos de Tracking (uno por línea) *</Label>
                <Textarea
                  id="trackings"
                  value={formData.trackings}
                  onChange={(e) => setFormData({...formData, trackings: e.target.value})}
                  placeholder="1Z32145US01&#10;9274812831HN"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="peso">Peso Total (lbs) *</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({...formData, peso: e.target.value})}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto Total (Lempiras) *</Label>
                  <Input
                    id="monto"
                    type="number"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    placeholder="210"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluirDomicilio"
                    checked={formData.incluirDomicilio}
                    onCheckedChange={(checked) => setFormData({...formData, incluirDomicilio: checked as boolean})}
                  />
                  <Label htmlFor="incluirDomicilio">Incluir información de domicilio</Label>
                </div>

                {formData.incluirDomicilio && (
                  <Select value={formData.tipoDomicilio} onValueChange={(value) => setFormData({...formData, tipoDomicilio: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TGU">TGU (L70)</SelectItem>
                      <SelectItem value="Nacional">Nacional (L125)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="esperarMasPaquetes"
                    checked={formData.esperarMasPaquetes}
                    onCheckedChange={(checked) => setFormData({...formData, esperarMasPaquetes: checked as boolean})}
                  />
                  <Label htmlFor="esperarMasPaquetes">¿Desea esperar más paquetes?</Label>
                </div>
              </div>

              <Button onClick={generarMensaje} disabled={loading} className="w-full">
                {loading ? "Generando..." : "Generar Mensaje + Enlace WhatsApp"}
              </Button>
            </CardContent>
          </Card>

          {/* Previsualización del mensaje */}
          {mensajeGenerado && (
            <Card>
              <CardHeader>
                <CardTitle>Mensaje Generado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                  {mensajeGenerado}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={copiarMensaje}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={abrirWhatsApp} className="bg-green-600 hover:bg-green-700">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
                
                <Button variant="secondary" onClick={abrirTelegram} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Telegram
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificacionesPaquetes;