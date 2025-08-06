import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  FileSpreadsheet,
  MapPin,
  Eye,
  X,
  Check,
  AlertCircle
} from "lucide-react";

interface Plantilla {
  id: string;
  titulo: string;
  contenido_markdown: string;
  variables_usadas: string[];
}

interface BulkMessageModalProps {
  plantilla: Plantilla | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FileData {
  headers: string[];
  rows: any[][];
}

interface VariableMapping {
  variable: string;
  column: string;
}

interface GeneratedMessage {
  phone: string;
  message: string;
  whatsappLink: string;
  telegramLink: string;
}

const BulkMessageModal = ({ plantilla, isOpen, onClose }: BulkMessageModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'results'>('upload');
  const [phoneColumn, setPhoneColumn] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseFile(text, file.name);
    };
    reader.readAsText(file);
  };

  const parseFile = (content: string, fileName: string) => {
    try {
      if (fileName.endsWith('.csv')) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        
        setFileData({ headers, rows });
        setStep('mapping');
        
        // Initialize mappings
        if (plantilla) {
          const mappings = plantilla.variables_usadas.map(variable => ({
            variable,
            column: ""
          }));
          setVariableMappings(mappings);
        }
        
        toast({
          title: "Archivo cargado",
          description: `${rows.length} registros encontrados`,
        });
      } else {
        throw new Error("Formato no soportado");
      }
    } catch (error) {
      toast({
        title: "Error al procesar archivo",
        description: "Verifique el formato del archivo",
        variant: "destructive",
      });
    }
  };

  const updateMapping = (variable: string, column: string) => {
    setVariableMappings(prev => 
      prev.map(m => m.variable === variable ? { ...m, column } : m)
    );
  };

  const generatePreview = () => {
    if (!fileData || !plantilla || !phoneColumn) return;

    const phoneColumnIndex = fileData.headers.indexOf(phoneColumn);
    if (phoneColumnIndex === -1) {
      toast({
        title: "Error",
        description: "Columna de teléfono no encontrada",
        variant: "destructive",
      });
      return;
    }

    const preview = fileData.rows.slice(0, 5).map(row => {
      let message = plantilla.contenido_markdown;
      
      variableMappings.forEach(mapping => {
        if (mapping.column) {
          const columnIndex = fileData.headers.indexOf(mapping.column);
          if (columnIndex !== -1) {
            const value = row[columnIndex] || "";
            const regex = new RegExp(`\\{${mapping.variable}\\}`, 'g');
            message = message.replace(regex, value);
          }
        }
      });

      const phone = row[phoneColumnIndex];
      const cleanPhone = phone.replace(/\D/g, '');
      
      return {
        phone,
        message,
        whatsappLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
        telegramLink: `https://t.me/share/url?text=${encodeURIComponent(message)}`
      };
    });

    setGeneratedMessages(preview);
    setStep('preview');
  };

  const generateAllMessages = () => {
    if (!fileData || !plantilla || !phoneColumn) return;

    const phoneColumnIndex = fileData.headers.indexOf(phoneColumn);
    const allMessages = fileData.rows.map(row => {
      let message = plantilla.contenido_markdown;
      
      variableMappings.forEach(mapping => {
        if (mapping.column) {
          const columnIndex = fileData.headers.indexOf(mapping.column);
          if (columnIndex !== -1) {
            const value = row[columnIndex] || "";
            const regex = new RegExp(`\\{${mapping.variable}\\}`, 'g');
            message = message.replace(regex, value);
          }
        }
      });

      const phone = row[phoneColumnIndex];
      const cleanPhone = phone.replace(/\D/g, '');
      
      return {
        phone,
        message,
        whatsappLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
        telegramLink: `https://t.me/share/url?text=${encodeURIComponent(message)}`
      };
    });

    setGeneratedMessages(allMessages);
    setStep('results');

    toast({
      title: "Mensajes generados",
      description: `${allMessages.length} mensajes listos para envío`,
    });
  };

  const downloadCSV = () => {
    if (generatedMessages.length === 0) return;

    const headers = ['Teléfono', 'Mensaje', 'Link WhatsApp', 'Link Telegram'];
    const csvContent = [
      headers.join(','),
      ...generatedMessages.map(msg => [
        `"${msg.phone}"`,
        `"${msg.message.replace(/"/g, '""')}"`,
        `"${msg.whatsappLink}"`,
        `"${msg.telegramLink}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `mensajes_${plantilla?.titulo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetModal = () => {
    setFileData(null);
    setVariableMappings([]);
    setGeneratedMessages([]);
    setStep('upload');
    setPhoneColumn("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!plantilla) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto modern-card">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Envío Masivo</h2>
                <p className="text-sm text-muted-foreground">{plantilla.titulo}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { key: 'upload', label: 'Cargar Archivo', icon: Upload },
                { key: 'mapping', label: 'Mapear Variables', icon: MapPin },
                { key: 'preview', label: 'Vista Previa', icon: Eye },
                { key: 'results', label: 'Resultados', icon: Download }
              ].map((stepItem, index) => {
                const isActive = step === stepItem.key;
                const isCompleted = ['upload', 'mapping', 'preview', 'results'].indexOf(step) > index;
                
                return (
                  <div key={stepItem.key} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <stepItem.icon className="w-5 h-5" />}
                    </div>
                    <span className={`ml-2 text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {stepItem.label}
                    </span>
                    {index < 3 && <div className="w-8 h-px bg-border mx-4" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          {step === 'upload' && (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Cargar archivo CSV</h3>
              <p className="text-muted-foreground mb-6">
                Sube un archivo CSV con los datos para generar mensajes masivos
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="modern-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivo CSV
              </Button>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
                <h4 className="font-medium mb-2 text-foreground">Formato requerido:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Archivo CSV con headers en la primera fila</li>
                  <li>• Una columna debe contener números de teléfono</li>
                  <li>• Columnas adicionales para las variables de la plantilla</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'mapping' && fileData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4 text-foreground">Configuración</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="modern-label">Columna de Teléfono</Label>
                      <select
                        value={phoneColumn}
                        onChange={(e) => setPhoneColumn(e.target.value)}
                        className="modern-select w-full"
                      >
                        <option value="">Seleccionar columna...</option>
                        {fileData.headers.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-foreground">Variables de la Plantilla</h3>
                  
                  <div className="space-y-3">
                    {variableMappings.map((mapping, index) => (
                      <div key={mapping.variable} className="space-y-2">
                        <Label className="modern-label">
                          {mapping.variable}
                        </Label>
                        <select
                          value={mapping.column}
                          onChange={(e) => updateMapping(mapping.variable, e.target.value)}
                          className="modern-select w-full"
                        >
                          <option value="">Seleccionar columna...</option>
                          {fileData.headers.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                >
                  Volver
                </Button>
                <Button
                  onClick={generatePreview}
                  disabled={!phoneColumn || variableMappings.some(m => !m.column)}
                  className="modern-button"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Vista Previa (5 primeros registros)</h3>
                <Badge className="modern-badge">
                  {fileData?.rows.length} registros totales
                </Badge>
              </div>

              <div className="space-y-4">
                {generatedMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="professional-card"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-foreground">{msg.phone}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(msg.whatsappLink, '_blank')}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                    <div className="preview-box text-sm">
                      {msg.message}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('mapping')}
                >
                  Volver
                </Button>
                <Button
                  onClick={generateAllMessages}
                  className="modern-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generar Todos
                </Button>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Mensajes Generados</h3>
                <div className="flex gap-2">
                  <Badge className="modern-badge-accent">
                    {generatedMessages.length} mensajes
                  </Badge>
                  <Button
                    onClick={downloadCSV}
                    className="modern-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar CSV
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {generatedMessages.map((msg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{msg.phone}</span>
                      <p className="text-sm text-muted-foreground truncate">
                        {msg.message.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(msg.whatsappLink, '_blank')}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('preview')}
                >
                  Volver
                </Button>
                <Button
                  onClick={handleClose}
                  className="modern-button"
                >
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkMessageModal;