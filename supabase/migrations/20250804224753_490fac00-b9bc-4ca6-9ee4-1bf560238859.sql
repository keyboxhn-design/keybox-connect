-- Crear tabla de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cliente TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de paquetes
CREATE TABLE public.paquetes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  modalidad TEXT NOT NULL CHECK (modalidad IN ('Premium', 'Standard', 'Marítimo')),
  peso_total DECIMAL(10,2) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  trackings TEXT[] NOT NULL,
  incluir_domicilio BOOLEAN DEFAULT false,
  tipo_domicilio TEXT CHECK (tipo_domicilio IN ('TGU', 'Nacional')),
  esperar_mas_paquetes BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de plantillas
CREATE TABLE public.plantillas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido_markdown TEXT NOT NULL,
  variables_usadas TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de mensajes generados
CREATE TABLE public.mensajes_generados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  plantilla_id UUID REFERENCES public.plantillas(id) ON DELETE SET NULL,
  mensaje_final TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'telegram')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_generados ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS (permitir acceso público por ahora, se puede restringir con auth más tarde)
CREATE POLICY "Permitir acceso completo a clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir acceso completo a paquetes" ON public.paquetes FOR ALL USING (true);
CREATE POLICY "Permitir acceso completo a plantillas" ON public.plantillas FOR ALL USING (true);
CREATE POLICY "Permitir acceso completo a mensajes" ON public.mensajes_generados FOR ALL USING (true);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paquetes_updated_at
  BEFORE UPDATE ON public.paquetes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plantillas_updated_at
  BEFORE UPDATE ON public.plantillas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunas plantillas predeterminadas
INSERT INTO public.plantillas (titulo, contenido_markdown, variables_usadas) VALUES
('Notificación Estándar de Paquetes', 
'¡Hola *{nombre}*! 🚀

🎁 Tienes *{cantidad} paquete(s)* listos para entrega vía *{modalidad}* ✈️

📦 Trackings:
{trackings}

⚖️ Peso total: *{peso} lbs*
💰 Monto a pagar: *L{monto}*

💡 Puedes consultar nuestras formas de pago aquí:
👉 https://www.keyboxhn.com/formas-de-pago

{domicilio_info}

{esperar_mensaje}

¡Gracias por elegir KeyBox! ✨',
ARRAY['nombre', 'cantidad', 'modalidad', 'trackings', 'peso', 'monto', 'domicilio_info', 'esperar_mensaje']
),
('Mensaje Personalizado Básico',
'Hola {nombre}, 

{mensaje_personalizado}

Saludos,
KeyBox Team',
ARRAY['nombre', 'mensaje_personalizado']
);