import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MultiSelect from "./MultiSelect";
import { 
  ArrowLeft, 
  Copy, 
  MessageSquare, 
  Send, 
  Package,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plane,
  Ship,
  Plus
} from "lucide-react";

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

const modalidadOptions = [
  { value: "Premium", label: "Premium", icon: <Plane className="w-4 h-4" />, description: "Entrega rápida" },
  { value: "Standard", label: "Standard", icon: <Truck className="w-4 h-4" />, description: "Entrega estándar" },
  { value: "Marítimo", label: "Marítimo", icon: <Ship className="w-4 h-4" />, description: "Envío económico" },
];

const domicilioOptions = [
  { value: "TGU", label: "TGU", icon: <Truck className="w-4 h-4" />, description: "Tegucigalpa - L70" },
  { value: "Nacional", label: "Nacional", icon: <Truck className="w-4 h-4" />, description: "Nacional - L125" },
];

const NotificacionesPaquetes = ({ onVolver }: NotificacionesPaquetesProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  
  const [formData, setFormData] = useState({
    numeroCliente: "",
    nombre: "",
    modalidades: [] as string[],
    cantidad: "",
    trackings: "",
    peso: "",
    monto: "",
    incluirDomicilio: false,
    tiposDomicilio: [] as string[],
    esperarMasPaquetes: false,
  });

  const [mensajeGenerado, setMensajeGenerado] = useState("");
  const [paso, setPaso] = useState(1);

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

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  // Buscar cliente por número
  const buscarCliente = async (numeroCliente: string) => {
    if (!numeroCliente || numeroCliente.length < 3) return;
    
    setBuscandoCliente(true);
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
          title: "✅ Cliente encontrado",
          description: `Datos de ${data.nombre} cargados automáticamente`,
        });
      } else {
        setCliente(null);
        toast({
          title: "Cliente no encontrado",
          description: "Se creará un nuevo cliente con estos datos",
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
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Efecto para buscar cliente cuando cambia el número
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarCliente(formData.numeroCliente);
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.numeroCliente]);

  // Validar teléfono hondureño
  const validarTelefono = (telefono: string): boolean => {
    const regex = /^(\+504|504)?[\s-]?[3789]\d{3}[\s-]?\d{4}$/;
    return regex.test(telefono.replace(/\s/g, ''));
  };

  // Generar mensaje
  const generarMensaje = async () => {
    if (!formData.numeroCliente || !formData.nombre || formData.modalidades.length === 0 || 
        !formData.cantidad || !formData.trackings || !formData.peso || !formData.monto) {
      toast({
        title: "⚠️ Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    // Validar teléfono si se va a generar link
    if (cliente?.telefono && !validarTelefono(cliente.telefono)) {
      toast({
        title: "⚠️ Teléfono inválido",
        description: "El teléfono debe ser un número hondureño válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Formatear trackings como lista
      const trackingsList = formData.trackings
        .split('\n')
        .filter(t => t.trim())
        .map(t => `• ${t.trim()}`)
        .join('\n');

      // Información de modalidades
      const modalidadesTexto = formData.modalidades.join(' + ');

      // Información de domicilio
      let domicilioInfo = "";
      if (formData.incluirDomicilio && formData.tiposDomicilio.length > 0) {
        const domiciliosTexto = formData.tiposDomicilio.map(tipo => {
          const precio = tipo === "TGU" ? "L70" : "L125";
          return `📍 ${tipo} desde ${precio}`;
        }).join('\n');
        domicilioInfo = `${domiciliosTexto}\n⛔ No se acepta efectivo\n\n`;
      }

      // Mensaje de esperar más paquetes
      const esperarMensaje = formData.esperarMasPaquetes 
        ? "📦 Si esperas más paquetes, puedes agruparlos para la próxima entrega\n\n"
        : "";

      // Generar mensaje final
      const mensaje = `*¡Hola ${formData.nombre}!* ✨

📦 Tienes *${formData.cantidad} paquete(s)* listos para entrega vía *${modalidadesTexto}* 

🎯 Trackings:
${trackingsList}

⚖️ *Peso total:* _${formData.peso} lbs_
💵 *Monto a pagar:* _L${formData.monto}_

🔗 Consulta nuestras formas de pago:
👉 https://www.keyboxhn.com/formas-de-pago

${domicilioInfo}${esperarMensaje}🙌 ¡Gracias por preferir KeyBox!`;

      setMensajeGenerado(mensaje);

      // Guardar cliente si no existe
      let clienteId = cliente?.id;
      if (!cliente) {
        const { data: nuevoCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            numero_cliente: formData.numeroCliente,
            nombre: formData.nombre,
          })
          .select()
          .single();

        if (clienteError) {
          console.error('Error al guardar cliente:', clienteError);
        } else {
          clienteId = nuevoCliente.id;
          setCliente(nuevoCliente);
        }
      }

      // Guardar paquete
      const { error: paqueteError } = await supabase
        .from('paquetes')
        .insert({
          cliente_id: clienteId,
          cantidad: parseInt(formData.cantidad),
          modalidad: formData.modalidades.join(', '),
          peso_total: parseFloat(formData.peso),
          monto: parseFloat(formData.monto),
          trackings: formData.trackings.split('\n').filter(t => t.trim()),
          incluir_domicilio: formData.incluirDomicilio,
          tipo_domicilio: formData.tiposDomicilio.join(', '),
          esperar_mas_paquetes: formData.esperarMasPaquetes,
        });

      if (paqueteError) console.error('Error al guardar paquete:', paqueteError);

      toast({
        title: "✅ Mensaje generado",
        description: "El mensaje y enlace WhatsApp están listos",
      });

      setPaso(3);

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
      title: "📋 Copiado",
      description: "Mensaje copiado al portapapeles",
    });
  };

  // Copiar link WhatsApp
  const copiarLinkWhatsApp = () => {
    if (!cliente?.telefono) {
      toast({
        title: "⚠️ Sin teléfono",
        description: "No hay número de teléfono registrado para este cliente",
        variant: "destructive",
      });
      return;
    }

    const telefonoLimpio = cliente.telefono.replace(/[\s\-\+]/g, '');
    const telefonoWhatsApp = telefonoLimpio.startsWith('504') ? telefonoLimpio : `504${telefonoLimpio}`;
    const mensaje = encodeURIComponent(mensajeGenerado);
    const link = `https://wa.me/${telefonoWhatsApp}?text=${mensaje}`;
    
    navigator.clipboard.writeText(link);
    toast({
      title: "📋 Link copiado",
      description: "Enlace de WhatsApp copiado al portapapeles",
    });
  };

  // Abrir WhatsApp
  const abrirWhatsApp = () => {
    if (!cliente?.telefono) {
      toast({
        title: "⚠️ Sin teléfono",
        description: "No hay número de teléfono registrado para este cliente",
        variant: "destructive",
      });
      return;
    }

    const telefonoLimpio = cliente.telefono.replace(/[\s\-\+]/g, '');
    const telefonoWhatsApp = telefonoLimpio.startsWith('504') ? telefonoLimpio : `504${telefonoLimpio}`;
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://wa.me/${telefonoWhatsApp}?text=${mensaje}`, '_blank');
  };

  // Abrir Telegram
  const abrirTelegram = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://t.me/share/url?text=${mensaje}`, '_blank');
  };

  const validarPaso1 = () => {
    return formData.numeroCliente && formData.nombre && formData.modalidades.length > 0;
  };

  const validarPaso2 = () => {
    return formData.cantidad && formData.trackings && formData.peso && formData.monto;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-primary"
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
              <div className="w-12 h-12 bg-keybox-yellow/20 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-keybox-yellow" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Notificador de Paquetes</h1>
                <p className="text-white/70">Genera mensajes automáticos con vínculos directos</p>
              </div>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  stepNum === paso 
                    ? 'bg-keybox-yellow text-keybox-navy' 
                    : stepNum < paso 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/20 text-white/60'
                }`}
              >
                {stepNum < paso ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
            ))}
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 pb-8">
        <AnimatePresence mode="wait">
          {/* Paso 1: Información del Cliente */}
          {paso === 1 && (
            <motion.div
              key="paso1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-2xl mx-auto"
            >
              <Card className="form-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-keybox-navy">
                    <User className="w-5 h-5" />
                    Paso 1: Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="numeroCliente" className="text-keybox-navy font-medium">
                        Número de Cliente KeyBox *
                      </Label>
                      <div className="relative">
                        <Input
                          id="numeroCliente"
                          value={formData.numeroCliente}
                          onChange={(e) => setFormData({...formData, numeroCliente: e.target.value.toUpperCase()})}
                          placeholder="KB12345"
                          className="modern-input"
                        />
                        {buscandoCliente && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                      </div>
                      {cliente && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Cliente encontrado en base de datos
                        </div>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="nombre" className="text-keybox-navy font-medium">
                        Nombre del Destinatario *
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Carlos Pérez"
                        className="modern-input"
                      />
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label className="text-keybox-navy font-medium">
                      Modalidades de Envío * 
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Selección múltiple
                      </Badge>
                    </Label>
                    <MultiSelect
                      options={modalidadOptions}
                      value={formData.modalidades}
                      onChange={(value) => setFormData({...formData, modalidades: value})}
                      placeholder="Seleccionar modalidades..."
                    />
                  </motion.div>

                  {cliente?.telefono && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 text-green-700">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">Teléfono WhatsApp: {cliente.telefono}</span>
                        {validarTelefono(cliente.telefono) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4"
                  >
                    <Button
                      onClick={() => setPaso(2)}
                      disabled={!validarPaso1()}
                      className="w-full modern-button text-lg py-4"
                    >
                      Continuar a Información de Paquetes →
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Paso 2: Información del Paquete */}
          {paso === 2 && (
            <motion.div
              key="paso2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-2xl mx-auto"
            >
              <Card className="form-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-keybox-navy">
                    <Package className="w-5 h-5" />
                    Paso 2: Detalles del Paquete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="cantidad" className="text-keybox-navy font-medium">
                        Cantidad de Paquetes *
                      </Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="1"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                        placeholder="2"
                        className="modern-input"
                      />
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="peso" className="text-keybox-navy font-medium">
                        Peso Total (lbs) *
                      </Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.peso}
                        onChange={(e) => setFormData({...formData, peso: e.target.value})}
                        placeholder="2.5"
                        className="modern-input"
                      />
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="trackings" className="text-keybox-navy font-medium">
                      Códigos de Tracking (uno por línea) *
                    </Label>
                    <Textarea
                      id="trackings"
                      value={formData.trackings}
                      onChange={(e) => setFormData({...formData, trackings: e.target.value})}
                      placeholder="1Z32145US01&#10;9274812831HN"
                      rows={4}
                      className="modern-input font-mono"
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="monto" className="text-keybox-navy font-medium">
                      Monto Total (Lempiras) *
                    </Label>
                    <Input
                      id="monto"
                      type="number"
                      min="0"
                      value={formData.monto}
                      onChange={(e) => setFormData({...formData, monto: e.target.value})}
                      placeholder="210"
                      className="modern-input"
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4 bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="incluirDomicilio"
                        checked={formData.incluirDomicilio}
                        onCheckedChange={(checked) => setFormData({...formData, incluirDomicilio: checked as boolean})}
                      />
                      <Label htmlFor="incluirDomicilio" className="text-keybox-navy font-medium">
                        Incluir información de domicilio
                      </Label>
                    </div>

                    {formData.incluirDomicilio && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <Label className="text-keybox-navy">Tipos de Domicilio</Label>
                        <MultiSelect
                          options={domicilioOptions}
                          value={formData.tiposDomicilio}
                          onChange={(value) => setFormData({...formData, tiposDomicilio: value})}
                          placeholder="Seleccionar zonas de domicilio..."
                        />
                      </motion.div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="esperarMasPaquetes"
                        checked={formData.esperarMasPaquetes}
                        onCheckedChange={(checked) => setFormData({...formData, esperarMasPaquetes: checked as boolean})}
                      />
                      <Label htmlFor="esperarMasPaquetes" className="text-keybox-navy font-medium">
                        ¿Desea esperar más paquetes?
                      </Label>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      onClick={() => setPaso(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      ← Volver
                    </Button>
                    <Button
                      onClick={generarMensaje}
                      disabled={!validarPaso2() || loading}
                      className="flex-1 modern-button"
                    >
                      {loading ? "Generando..." : "Generar Mensaje + Link →"}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Paso 3: Mensaje Generado */}
          {paso === 3 && mensajeGenerado && (
            <motion.div
              key="paso3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Previsualización del mensaje */}
                <Card className="form-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-keybox-navy">
                      <MessageSquare className="w-5 h-5" />
                      Mensaje Generado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto custom-scrollbar">
                      {mensajeGenerado}
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones */}
                <Card className="form-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-keybox-navy">
                      <Send className="w-5 h-5" />
                      Acciones Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="grid grid-cols-1 gap-3"
                    >
                      <Button
                        onClick={copiarMensaje}
                        variant="outline"
                        className="w-full py-3"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Mensaje
                      </Button>
                      
                      <Button
                        onClick={copiarLinkWhatsApp}
                        variant="outline"
                        className="w-full py-3"
                        disabled={!cliente?.telefono}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Enlace WhatsApp
                      </Button>
                      
                      <Button
                        onClick={abrirWhatsApp}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                        disabled={!cliente?.telefono}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Abrir WhatsApp Web
                      </Button>
                      
                      <Button
                        onClick={abrirTelegram}
                        variant="outline"
                        className="w-full py-3"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Compartir en Telegram
                      </Button>
                    </motion.div>

                    {!cliente?.telefono && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">
                            Agrega el teléfono del cliente en Gestión de Clientes para generar enlaces directos de WhatsApp
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="pt-4 border-t border-gray-200"
                    >
                      <Button
                        onClick={() => {
                          setPaso(1);
                          setFormData({
                            numeroCliente: "",
                            nombre: "",
                            modalidades: [],
                            cantidad: "",
                            trackings: "",
                            peso: "",
                            monto: "",
                            incluirDomicilio: false,
                            tiposDomicilio: [],
                            esperarMasPaquetes: false,
                          });
                          setMensajeGenerado("");
                          setCliente(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Nueva Notificación
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default NotificacionesPaquetes;