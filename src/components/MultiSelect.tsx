import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxDisplayed?: number;
}

const MultiSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar opciones...",
  maxDisplayed = 3 
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const getDisplayedOptions = () => {
    const selected = options.filter(option => value.includes(option.value));
    if (selected.length <= maxDisplayed) {
      return selected;
    }
    return selected.slice(0, maxDisplayed);
  };

  const getRemainingCount = () => {
    const selected = options.filter(option => value.includes(option.value));
    return Math.max(0, selected.length - maxDisplayed);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between modern-dropdown min-h-12"
      >
        <div className="flex items-center gap-2 flex-wrap flex-1">
           {value.length === 0 ? (
             <span className="text-muted-foreground">{placeholder}</span>
           ) : (
            <>
              {getDisplayedOptions().map((option) => (
                 <Badge
                   key={option.value}
                   variant="outline"
                   className="modern-badge gap-1"
                 >
                  {option.icon}
                  {option.label}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                  />
                </Badge>
              ))}
               {getRemainingCount() > 0 && (
                 <Badge
                   variant="outline"
                   className="modern-badge"
                 >
                   +{getRemainingCount()} más
                 </Badge>
               )}
            </>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="modern-dropdown-content">
              <CardContent className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                {options.map((option, index) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleOption(option.value)}
                       className={`
                         flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                         ${isSelected 
                           ? 'bg-primary/10 border border-primary/30 text-primary' 
                           : 'hover:bg-muted/50 text-foreground'
                         }
                       `}
                    >
                       <div className={`
                         w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                         ${isSelected 
                           ? 'bg-primary border-primary' 
                           : 'border-muted-foreground/30'
                         }
                       `}>
                         {isSelected && (
                           <Check className="w-3 h-3 text-primary-foreground" />
                         )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1">
                         {option.icon && (
                           <div className="w-5 h-5 text-muted-foreground">
                             {option.icon}
                           </div>
                         )}
                         <div>
                           <div className="font-medium">{option.label}</div>
                           {option.description && (
                             <div className="text-xs text-muted-foreground">{option.description}</div>
                           )}
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect;