import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Search, Zap } from "lucide-react";

interface Variable {
  key: string;
  label: string;
  description: string;
  example: string;
  category: string;
}

interface VariableSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariable: (variable: string) => void;
  position: { x: number; y: number };
}

const variables: Variable[] = [
  // Variables de cliente
  { key: "nombre", label: "Nombre", description: "Nombre del cliente", example: "Carlos Mendoza", category: "Cliente" },
  { key: "numero_cliente", label: "Número Cliente", description: "ID del cliente KeyBox", example: "KB001", category: "Cliente" },
  { key: "telefono", label: "Teléfono", description: "Número WhatsApp", example: "+504 9999-9999", category: "Cliente" },
  
  // Variables de paquete
  { key: "cantidad", label: "Cantidad", description: "Número de paquetes", example: "2", category: "Paquete" },
  { key: "modalidad", label: "Modalidad", description: "Tipo de envío", example: "Premium", category: "Paquete" },
  { key: "peso", label: "Peso Total", description: "Peso en libras", example: "1.8 lbs", category: "Paquete" },
  { key: "monto", label: "Monto", description: "Total a pagar", example: "L105", category: "Paquete" },
  { key: "trackings", label: "Trackings", description: "Lista de códigos", example: "1ZXY921A, 92374823US", category: "Paquete" },
  
  // Variables de sistema
  { key: "fecha", label: "Fecha", description: "Fecha actual", example: "2024-01-15", category: "Sistema" },
  { key: "link_pago", label: "Link de Pago", description: "URL formas de pago", example: "https://keyboxhn.com/pago", category: "Sistema" },
  { key: "domicilio_info", label: "Info Domicilio", description: "Información de entrega", example: "TGU desde L70", category: "Sistema" },
];

const VariableSelector = ({ isOpen, onClose, onSelectVariable, position }: VariableSelectorProps) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredVariables = variables.filter(variable =>
    variable.label.toLowerCase().includes(search.toLowerCase()) ||
    variable.key.toLowerCase().includes(search.toLowerCase()) ||
    variable.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredVariables.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredVariables[selectedIndex]) {
            onSelectVariable(`{${filteredVariables[selectedIndex].key}}`);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredVariables, onSelectVariable, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleVariableClick = (variable: Variable) => {
    onSelectVariable(`{${variable.key}}`);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Cliente': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Paquete': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Sistema': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Selector */}
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="fixed z-50 w-96"
          style={{
            left: Math.min(position.x, window.innerWidth - 400),
            top: Math.min(position.y, window.innerHeight - 400),
          }}
        >
          <Card className="glass-card border-white/20 shadow-floating">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-keybox-yellow/20 rounded-lg flex items-center justify-center">
                  <Hash className="w-4 h-4 text-keybox-yellow" />
                </div>
                <h3 className="font-semibold text-white">Variables Disponibles</h3>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <Input
                  ref={inputRef}
                  placeholder="Buscar variables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {/* Variables List */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {filteredVariables.map((variable, index) => (
                  <motion.div
                    key={variable.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleVariableClick(variable)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      index === selectedIndex
                        ? 'bg-keybox-blue/20 border border-keybox-blue/40'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getCategoryColor(variable.category)}`}>
                          {variable.category}
                        </Badge>
                        <span className="font-mono text-sm text-white font-medium">
                          {variable.key}
                        </span>
                      </div>
                      <Zap className="w-3 h-3 text-keybox-yellow" />
                    </div>
                    <h4 className="font-medium text-white text-sm mb-1">{variable.label}</h4>
                    <p className="text-xs text-white/60 mb-2">{variable.description}</p>
                    <div className="bg-black/20 rounded-lg p-2">
                      <code className="text-xs text-keybox-yellow">{variable.example}</code>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredVariables.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-white/30 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">No se encontraron variables</p>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-xs text-white/50 text-center">
                  ↑↓ navegar • Enter seleccionar • Esc cerrar
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default VariableSelector;