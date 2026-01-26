import { useState } from 'react';
import { Plus, Home, Car, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAddProperty } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';

type PropertyType = 'property' | 'car' | 'moto';

interface AddPropertyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

const typeConfig = {
  property: {
    icon: Home,
    title: 'Nova Propriedade',
    description: 'Adicione um novo endereço para gerenciar',
    namePlaceholder: 'Ex: Apartamento Centro',
    addressLabel: 'Endereço',
    addressPlaceholder: 'Ex: Av. Paulista, 1000 - Apto 42',
  },
  car: {
    icon: Car,
    title: 'Novo Carro',
    description: 'Adicione um carro para gerenciar',
    namePlaceholder: 'Ex: Honda Civic Preto',
    addressLabel: 'Placa',
    addressPlaceholder: 'Ex: ABC-1234',
  },
  moto: {
    icon: Bike,
    title: 'Nova Moto',
    description: 'Adicione uma moto para gerenciar',
    namePlaceholder: 'Ex: Honda CB 500',
    addressLabel: 'Placa',
    addressPlaceholder: 'Ex: XYZ-5678',
  },
};

export function AddPropertyDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  showTrigger = true 
}: AddPropertyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<PropertyType>('property');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const addProperty = useAddProperty();
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const config = typeConfig[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !address.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addProperty.mutateAsync({ name, address });
      const successMessage = type === 'property' ? 'Propriedade adicionada!' : 
                            type === 'car' ? 'Carro adicionado!' : 'Moto adicionada!';
      toast({
        title: successMessage,
        description: `${name} foi adicionado com sucesso`
      });
      setName('');
      setAddress('');
      setType('property');
      setOpen(false);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setType('property');
    setName('');
    setAddress('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="glass max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">{config.title}</DialogTitle>
          <DialogDescription className="text-xs">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Type Selector */}
        <div className="flex gap-2 mt-2">
          {(Object.keys(typeConfig) as PropertyType[]).map((t) => {
            const Icon = typeConfig[t].icon;
            const isSelected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${
                  isSelected 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-primary/50 text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium capitalize">
                  {t === 'property' ? 'Imóvel' : t === 'car' ? 'Carro' : 'Moto'}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="property-name" className="text-xs">Nome</Label>
            <Input
              id="property-name"
              placeholder={config.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="property-address" className="text-xs">{config.addressLabel}</Label>
            <Input
              id="property-address"
              placeholder={config.addressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={addProperty.isPending}>
              {addProperty.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
