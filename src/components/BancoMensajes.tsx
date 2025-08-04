import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, FileText, Download, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BancoMensajesProps {
  onVolver: () => void;
}

interface Plantilla {
  id: string;
  titulo: string;
  contenido_markdown: string;
  variables_usadas: string[];
}

interface Variable {
  nombre: string;
  valor: string;
}

const BancoMensajes = ({ onVolver }: BancoMensajesProps) => {
  const { toast } = useToast();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<string>("");
  const [contenidoMensaje, setContenidoMensaje] = useState("");
  const [tituloPlantilla, setTituloPlantilla] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [mensajeGenerado, setMensajeGenerado] = useState("");
  const [loading, setLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState<'plantilla' | 'variables'>('plantilla');

  // Cargar plantillas al iniciar
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

  // Cargar plantilla seleccionada
  const cargarPlantilla = (plantillaId: string) => {
    const plantilla = plantillas.find(p => p.id === plantillaId);
    if (plantilla) {
      setContenidoMensaje(plantilla.contenido_markdown);
      setTituloPlantilla(plantilla.titulo);
      
      // Extraer variables de la plantilla
      const variablesEncontradas = extraerVariables(plantilla.contenido_markdown);
      setVariables(variablesEncontradas.map(v => ({ nombre: v, valor: "" })));
    }
  };

  // Extraer variables del formato {variable}
  const extraerVariables = (texto: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = texto.match(regex);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match.slice(1, -1)))];
  };

  // Guardar plantilla
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

      cargarPlantillas();
      setTituloPlantilla("");
      setContenidoMensaje("");
      setVariables([]);
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

  // Eliminar plantilla
  const eliminarPlantilla = async (plantillaId: string) => {
    try {
      const { error } = await supabase
        .from('plantillas')
        .delete()
        .eq('id', plantillaId);

      if (error) throw error;

      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado exitosamente",
      });

      cargarPlantillas();
      if (plantillaSeleccionada === plantillaId) {
        setPlantillaSeleccionada("");
        setContenidoMensaje("");
        setTituloPlantilla("");
        setVariables([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la plantilla",
        variant: "destructive",
      });
    }
  };

  // Generar mensaje con variables
  const generarMensaje = () => {
    let mensaje = contenidoMensaje;
    
    variables.forEach(variable => {
      if (variable.valor) {
        const regex = new RegExp(`\\{${variable.nombre}\\}`, 'g');
        mensaje = mensaje.replace(regex, variable.valor);
      }
    });

    setMensajeGenerado(mensaje);
    toast({
      title: "Mensaje generado",
      description: "El mensaje ha sido generado con las variables",
    });
  };

  // Agregar variable manual
  const agregarVariable = () => {
    setVariables([...variables, { nombre: "", valor: "" }]);
  };

  // Actualizar variable
  const actualizarVariable = (index: number, campo: 'nombre' | 'valor', valor: string) => {
    const nuevasVariables = [...variables];
    nuevasVariables[index][campo] = valor;
    setVariables(nuevasVariables);
  };

  // Eliminar variable
  const eliminarVariable = (index: number) => {
    const nuevasVariables = variables.filter((_, i) => i !== index);
    setVariables(nuevasVariables);
  };

  // Copiar mensaje
  const copiarMensaje = () => {
    navigator.clipboard.writeText(mensajeGenerado);
    toast({
      title: "Copiado",
      description: "Mensaje copiado al portapapeles",
    });
  };

  // Generar enlaces WhatsApp/Telegram
  const abrirWhatsApp = () => {
    const mensaje = encodeURIComponent(mensajeGenerado);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

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
            <h1 className="text-3xl font-bold text-foreground">Banco de Mensajes</h1>
            <p className="text-muted-foreground">Crea mensajes personalizados con editor enriquecido y variables</p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={modoEdicion === 'plantilla' ? 'default' : 'outline'}
            onClick={() => setModoEdicion('plantilla')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Editor de Plantillas
          </Button>
          <Button 
            variant={modoEdicion === 'variables' ? 'default' : 'outline'}
            onClick={() => setModoEdicion('variables')}
            disabled={!contenidoMensaje}
          >
            <Plus className="h-4 w-4 mr-2" />
            Variables y Generación
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Panel izquierdo */}
          <div className="space-y-6">
            {modoEdicion === 'plantilla' && (
              <Card>
                <CardHeader>
                  <CardTitle>Editor de Plantillas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plantillaExistente">Cargar Plantilla Existente</Label>
                    <div className="flex gap-2">
                      <Select value={plantillaSeleccionada} onValueChange={(value) => {
                        setPlantillaSeleccionada(value);
                        cargarPlantilla(value);
                      }}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                          {plantillas.map((plantilla) => (
                            <SelectItem key={plantilla.id} value={plantilla.id}>
                              {plantilla.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {plantillaSeleccionada && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>¿Eliminar plantilla?</DialogTitle>
                            </DialogHeader>
                            <p>Esta acción no se puede deshacer.</p>
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="destructive" 
                                onClick={() => eliminarPlantilla(plantillaSeleccionada)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título de la Plantilla</Label>
                    <Input
                      id="titulo"
                      value={tituloPlantilla}
                      onChange={(e) => setTituloPlantilla(e.target.value)}
                      placeholder="Mi plantilla personalizada"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contenido">Contenido del Mensaje</Label>
                    <Textarea
                      id="contenido"
                      value={contenidoMensaje}
                      onChange={(e) => setContenidoMensaje(e.target.value)}
                      placeholder="Hola {nombre}, tu pedido de {cantidad} productos está listo..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa {"{variable}"} para crear variables dinámicas. Ejemplo: {"{nombre}"}, {"{cantidad}"}
                    </p>
                  </div>

                  <Button onClick={guardarPlantilla} disabled={loading} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Guardando..." : "Guardar Plantilla"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {modoEdicion === 'variables' && (
              <Card>
                <CardHeader>
                  <CardTitle>Variables del Mensaje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variables.map((variable, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2">
                        <Label className="text-xs">Variable</Label>
                        <Input
                          value={variable.nombre}
                          onChange={(e) => actualizarVariable(index, 'nombre', e.target.value)}
                          placeholder="nombre"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Valor</Label>
                        <Input
                          value={variable.valor}
                          onChange={(e) => actualizarVariable(index, 'valor', e.target.value)}
                          placeholder="Carlos Pérez"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => eliminarVariable(index)}
                        className="h-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" onClick={agregarVariable} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Variable
                  </Button>

                  <Button onClick={generarMensaje} className="w-full">
                    Generar Mensaje
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel derecho - Previsualización */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Previsualización</CardTitle>
              </CardHeader>
              <CardContent>
                {modoEdicion === 'plantilla' && (
                  <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                    {contenidoMensaje || "Escribe tu plantilla en el editor..."}
                  </div>
                )}

                {modoEdicion === 'variables' && mensajeGenerado && (
                  <>
                    <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                      {mensajeGenerado}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button variant="outline" onClick={copiarMensaje}>
                        Copiar
                      </Button>
                      <Button onClick={abrirWhatsApp} className="bg-green-600 hover:bg-green-700">
                        WhatsApp
                      </Button>
                    </div>
                    
                    <Button variant="secondary" onClick={abrirTelegram} className="w-full mt-2">
                      Telegram
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lista de plantillas */}
            <Card>
              <CardHeader>
                <CardTitle>Plantillas Guardadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plantillas.map((plantilla) => (
                    <div
                      key={plantilla.id}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setPlantillaSeleccionada(plantilla.id);
                        cargarPlantilla(plantilla.id);
                        setModoEdicion('plantilla');
                      }}
                    >
                      <div className="font-medium text-sm">{plantilla.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        Variables: {plantilla.variables_usadas.join(', ') || 'Ninguna'}
                      </div>
                    </div>
                  ))}
                  {plantillas.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No hay plantillas guardadas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BancoMensajes;