import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  Package, 
  Star,
  Edit,
  Trash2,
  MessageSquare
} from "lucide-react";

interface Cliente {
  id: string;
  numero_cliente: string;
  nombre: string;
  email?: string;
  telefono?: string;
  created_at: string;
  updated_at: string;
}

interface GestionClientesProps {
  onVolver: () => void;
}

const GestionClientes = ({ onVolver }: GestionClientesProps) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState({
    numero_cliente: "",
    nombre: "",
    email: "",
    telefono: "",
    notas: ""
  });
  
  const { toast } = useToast();

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
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar clientes",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
    }
  };

  const guardarCliente = async () => {
    if (!formulario.numero_cliente || !formulario.nombre) {
      toast({
        title: "Error",
        description: "Número de cliente y nombre son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (clienteSeleccionado) {
        // Editar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update({
            numero_cliente: formulario.numero_cliente,
            nombre: formulario.nombre,
            email: formulario.email || null,
            telefono: formulario.telefono || null,
          })
          .eq('id', clienteSeleccionado.id);

        if (error) throw error;
        
        toast({
          title: "¡Éxito!",
          description: "Cliente actualizado correctamente",
        });
      } else {
        // Crear nuevo cliente
        const { error } = await supabase
          .from('clientes')
          .insert({
            numero_cliente: formulario.numero_cliente,
            nombre: formulario.nombre,
            email: formulario.email || null,
            telefono: formulario.telefono || null,
          });

        if (error) throw error;
        
        toast({
          title: "¡Éxito!",
          description: "Cliente creado correctamente",
        });
      }

      // Limpiar formulario y recargar
      setFormulario({ numero_cliente: "", nombre: "", email: "", telefono: "", notas: "" });
      setClienteSeleccionado(null);
      setModoEdicion(false);
      cargarClientes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar cliente",
        variant: "destructive",
      });
    }
  };

  const eliminarCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "¡Éxito!",
        description: "Cliente eliminado correctamente",
      });
      
      cargarClientes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar cliente",
        variant: "destructive",
      });
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setFormulario({
      numero_cliente: cliente.numero_cliente,
      nombre: cliente.nombre,
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      notas: ""
    });
    setModoEdicion(true);
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.numero_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(busqueda.toLowerCase()))
  );

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
                <Users className="w-6 h-6 text-keybox-yellow" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestión de Clientes</h1>
                <p className="text-white/70">Administra tu base de clientes KeyBox</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setModoEdicion(true)}
            className="hover-lift interactive-scale bg-keybox-yellow text-keybox-navy hover:bg-keybox-yellow/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Clientes */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="glass-card border-white/20 shadow-floating">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Clientes ({clientesFiltrados.length})
                  </CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, número o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {clientesFiltrados.map((cliente, index) => (
                    <motion.div
                      key={cliente.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover-lift"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="bg-keybox-yellow/20 text-keybox-yellow border-keybox-yellow/30">
                              #{cliente.numero_cliente}
                            </Badge>
                            <h3 className="font-semibold text-white">{cliente.nombre}</h3>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-white/70">
                            {cliente.telefono && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {cliente.telefono}
                              </div>
                            )}
                            {cliente.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {cliente.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editarCliente(cliente)}
                            className="text-white/70 hover:text-white hover:bg-white/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => eliminarCliente(cliente.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {clientesFiltrados.length === 0 && !cargando && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <p className="text-white/70">
                      {busqueda ? "No se encontraron clientes" : "No hay clientes registrados"}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Formulario */}
          <AnimatePresence>
            {modoEdicion && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="lg:col-span-1"
              >
                <Card className="glass-card border-white/20 shadow-floating">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      {clienteSeleccionado ? "Editar Cliente" : "Nuevo Cliente"}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setModoEdicion(false);
                          setClienteSeleccionado(null);
                          setFormulario({ numero_cliente: "", nombre: "", email: "", telefono: "", notas: "" });
                        }}
                        className="text-white/70 hover:text-white hover:bg-white/20"
                      >
                        ✕
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="numero_cliente" className="text-white">Número de Cliente *</Label>
                      <Input
                        id="numero_cliente"
                        placeholder="KB001"
                        value={formulario.numero_cliente}
                        onChange={(e) => setFormulario({ ...formulario, numero_cliente: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="nombre" className="text-white">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        placeholder="Juan Pérez"
                        value={formulario.nombre}
                        onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="telefono" className="text-white">Teléfono WhatsApp</Label>
                      <Input
                        id="telefono"
                        placeholder="+504 9999-9999"
                        value={formulario.telefono}
                        onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        value={formulario.email}
                        onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="pt-4"
                    >
                      <Button
                        onClick={guardarCliente}
                        className="w-full hover-lift interactive-scale bg-keybox-yellow text-keybox-navy hover:bg-keybox-yellow/90 font-semibold"
                      >
                        {clienteSeleccionado ? "Actualizar Cliente" : "Crear Cliente"}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default GestionClientes;