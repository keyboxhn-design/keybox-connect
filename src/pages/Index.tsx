import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Package, MessageSquare, Sparkles, Zap, Users } from "lucide-react";
import NotificacionesPaquetes from "@/components/NotificacionesPaquetes";
import BancoMensajes from "@/components/BancoMensajes";
import GestionClientes from "@/components/GestionClientes";

const Index = () => {
  const [activeModule, setActiveModule] = useState<"packages" | "messages" | "clients" | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring" as const,
        stiffness: 260,
        damping: 20
      }
    }
  };

  if (activeModule === "packages") {
    return <NotificacionesPaquetes onVolver={() => setActiveModule(null)} />;
  }

  if (activeModule === "messages") {
    return <BancoMensajes onVolver={() => setActiveModule(null)} />;
  }

  if (activeModule === "clients") {
    return <GestionClientes onVolver={() => setActiveModule(null)} />;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background relative overflow-hidden transition-colors duration-300"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-keybox-yellow/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-keybox-blue/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-20">
          <ModeToggle />
        </div>

        {/* Header with animated logo */}
        <motion.header variants={itemVariants} className="text-center mb-20">
          <motion.div 
            variants={logoVariants}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-keybox-yellow rounded-2xl flex items-center justify-center shadow-glow">
                <Package className="w-12 h-12 text-keybox-navy" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-keybox-blue rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </div>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-6xl font-bold text-foreground mb-6 tracking-tight"
          >
            Key<span className="text-keybox-yellow">Box</span>
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Sistema ultra-moderno de notificaciones automatizadas para entregas de paquetes
          </motion.p>
        </motion.header>

        {/* Module cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {/* Package Notifications Module */}
          <motion.div
            whileHover={{ 
              scale: 1.02,
              rotateY: 5,
              z: 50
            }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => setActiveModule("packages")}
          >
            <div className="h-80 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-elegant hover:shadow-glow transition-all duration-500 hover:bg-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-keybox-yellow/20 rounded-2xl flex items-center justify-center group-hover:bg-keybox-yellow/30 transition-colors duration-300">
                  <Package className="w-8 h-8 text-keybox-yellow" />
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-6 h-6 text-keybox-yellow" />
                </motion.div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Notificador de Paquetes
              </h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Genera mensajes automatizados y personalizados para entregas. Formatos profesionales con WhatsApp integration.
              </p>
              <div className="flex items-center text-keybox-yellow font-medium group-hover:translate-x-2 transition-transform duration-300">
                Comenzar →
              </div>
            </div>
          </motion.div>

          {/* Message Bank Module */}
          <motion.div
            whileHover={{ 
              scale: 1.02,
              rotateY: -5,
              z: 50
            }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => setActiveModule("messages")}
          >
            <div className="h-80 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-elegant hover:shadow-glow transition-all duration-500 hover:bg-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-keybox-blue/20 rounded-2xl flex items-center justify-center group-hover:bg-keybox-blue/30 transition-colors duration-300">
                  <MessageSquare className="w-8 h-8 text-keybox-blue" />
                </div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 text-keybox-blue" />
                </motion.div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Banco de Mensajes
              </h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Crea y gestiona plantillas visuales reutilizables. Editor enriquecido con variables dinámicas.
              </p>
              <div className="flex items-center text-keybox-blue font-medium group-hover:translate-x-2 transition-transform duration-300">
                Explorar →
              </div>
            </div>
          </motion.div>

          {/* Client Management Module */}
          <motion.div
            whileHover={{ 
              scale: 1.02,
              rotateY: 5,
              z: 50
            }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => setActiveModule("clients")}
          >
            <div className="h-80 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-elegant hover:shadow-glow transition-all duration-500 hover:bg-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-300">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-green-400" />
                </motion.div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Gestión de Clientes
              </h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Administra tu base de clientes KeyBox. Crea, edita y organiza información de contacto con búsqueda inteligente.
              </p>
              <div className="flex items-center text-green-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                Gestionar →
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features highlight */}
        <motion.div 
          variants={itemVariants}
          className="mt-20 text-center"
        >
          <div className="flex flex-wrap justify-center gap-6 text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-keybox-yellow rounded-full"></div>
              Animaciones 3D suaves
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-keybox-blue rounded-full"></div>
              Glassmorphism elegante
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-keybox-yellow rounded-full"></div>
              WhatsApp Integration
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-keybox-blue rounded-full"></div>
              Plantillas reutilizables
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Index;