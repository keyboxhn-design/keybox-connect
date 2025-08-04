import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare, Sparkles } from "lucide-react";
import NotificacionesPaquetes from "@/components/NotificacionesPaquetes";
import BancoMensajes from "@/components/BancoMensajes";

const Index = () => {
  const [moduloActivo, setModuloActivo] = useState<'inicio' | 'paquetes' | 'mensajes'>('inicio');

  if (moduloActivo === 'paquetes') {
    return <NotificacionesPaquetes onVolver={() => setModuloActivo('inicio')} />;
  }

  if (moduloActivo === 'mensajes') {
    return <BancoMensajes onVolver={() => setModuloActivo('inicio')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-secondary" />
            <h1 className="text-4xl font-bold text-primary-foreground">KeyBox</h1>
            <Sparkles className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-xl text-primary-foreground/90 mb-2">
            Generador de Mensajes Automáticos
          </p>
          <Badge variant="secondary" className="text-sm">
            v1.0 - Sistema de Comunicación
          </Badge>
        </div>

        {/* Módulos principales */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Módulo 1: Notificaciones de Paquetes */}
          <Card 
            className="hover:shadow-glow transition-all duration-300 cursor-pointer animate-scale-in border-primary/20 bg-card/95 backdrop-blur-sm"
            onClick={() => setModuloActivo('paquetes')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <Package className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">
                Notificaciones Paquetes
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Genera mensajes automáticos para WhatsApp y Telegram con información de paquetes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Autocompletado de datos de cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Enlaces directos de WhatsApp/Telegram</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Cálculo automático de domicilio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Formato profesional y amigable</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-primary hover:opacity-90 border-0">
                Acceder al Módulo
              </Button>
            </CardContent>
          </Card>

          {/* Módulo 2: Banco de Mensajes */}
          <Card 
            className="hover:shadow-glow transition-all duration-300 cursor-pointer animate-scale-in border-primary/20 bg-card/95 backdrop-blur-sm"
            onClick={() => setModuloActivo('mensajes')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-accent flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">
                Banco de Mensajes
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Crea mensajes personalizados con editor enriquecido y variables masivas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Editor con formato rich text</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Variables dinámicas personalizables</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Importación CSV/Excel masiva</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Plantillas reutilizables</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full">
                Acceder al Módulo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-primary-foreground/70">
          <p className="text-sm">
            © 2025 KeyBox - Sistema de Generación de Mensajes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
