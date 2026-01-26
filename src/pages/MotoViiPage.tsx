import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/useProperties";
import { useAccessCodes } from "@/hooks/useAccessCodes";
import { 
  Smartphone, 
  Wifi, 
  ArrowLeft, 
  Copy, 
  Download, 
  Share2,
  Check,
  AlertCircle,
  Nfc,
  QrCode,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Maximize2,
  Bike,
  Car,
  Shield,
  Phone,
  MapPin
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import nfcMotoStickerImage from "@/assets/nfc-moto-sticker.png";

const MotoViiPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { propertyId: urlPropertyId } = useParams<{ propertyId: string }>();
  
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: accessCodes } = useAccessCodes();
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcWriting, setNfcWriting] = useState(false);
  
  // Preview dialog state
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("medium");
  
  const stickerSizes = [
    { id: "small", name: "Pequeno", dimensions: "6x3 cm (2.4x1.2\")", pixels: { w: 240, h: 135 } },
    { id: "medium", name: "Médio", dimensions: "10x5 cm (3.9x2\")", pixels: { w: 400, h: 225 } },
    { id: "large", name: "Grande", dimensions: "14x7 cm (5.5x2.8\")", pixels: { w: 560, h: 315 } },
    { id: "xlarge", name: "Extra Grande", dimensions: "20x10 cm (7.9x3.9\")", pixels: { w: 800, h: 450 } },
  ];
  
  const selectedProperty = properties?.find(p => p.id === selectedPropertyId) || properties?.[0];
  const propertyAccessCode = accessCodes?.find(code => code.property_id === selectedPropertyId);
  
  // Check NFC support
  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    } else {
      setNfcSupported(false);
    }
  }, []);
  
  // Set property from URL parameter or default to first property
  useEffect(() => {
    if (properties && properties.length > 0) {
      if (urlPropertyId && properties.some(p => p.id === urlPropertyId)) {
        setSelectedPropertyId(urlPropertyId);
      } else if (!selectedPropertyId) {
        setSelectedPropertyId(properties[0].id);
      }
    }
  }, [properties, selectedPropertyId, urlPropertyId]);
  
  // Generate the visitor URL for NFC
  const visitorUrl = propertyAccessCode 
    ? `${window.location.origin}/call/${encodeURIComponent(propertyAccessCode.code)}?property=${encodeURIComponent(selectedProperty?.name || 'Veículo')}&source=motovii`
    : `${window.location.origin}/call/demo?property=Veículo&source=motovii`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(visitorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link MotoVii foi copiado para a área de transferência.",
    });
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MotoVii - ${selectedProperty?.name || 'Veículo'}`,
          text: `Toque seu celular para ligar para o motorista`,
          url: visitorUrl,
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };
  
  const handleWriteNFC = async () => {
    if (!('NDEFReader' in window)) {
      toast({
        title: "NFC não suportado",
        description: "Seu dispositivo não suporta escrita NFC. Use o link ou QR Code.",
        variant: "destructive",
      });
      return;
    }
    
    setNfcWriting(true);
    
    try {
      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: visitorUrl,
          },
        ],
      });
      
      toast({
        title: "Tag NFC gravada!",
        description: "A tag foi programada com sucesso para o seu veículo.",
      });
    } catch (error: any) {
      console.error("NFC write error:", error);
      
      if (error.name === "NotAllowedError") {
        toast({
          title: "Permissão negada",
          description: "Permita o acesso ao NFC nas configurações do navegador.",
          variant: "destructive",
        });
      } else if (error.name === "NotSupportedError") {
        toast({
          title: "NFC não disponível",
          description: "Ative o NFC nas configurações do seu dispositivo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao gravar",
          description: "Aproxime uma tag NFC vazia e tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setNfcWriting(false);
    }
  };
  
  const handleDownloadSticker = () => {
    const size = stickerSizes.find(s => s.id === selectedSize);
    const pixels = size?.pixels || { w: 400, h: 225 };
    
    // Create canvas to resize
    const canvas = document.createElement('canvas');
    canvas.width = pixels.w;
    canvas.height = pixels.h;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = nfcMotoStickerImage;
      link.download = `motovii-${selectedProperty?.name || 'veiculo'}-${size?.dimensions || '10x5cm'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, pixels.w, pixels.h);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `motovii-${selectedProperty?.name || 'veiculo'}-${size?.dimensions || '10x5cm'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Imagem baixada!",
        description: `Adesivo MotoVii ${size?.dimensions || ''} salvo com sucesso.`,
      });
      
      setShowPreviewDialog(false);
    };
    img.src = nfcMotoStickerImage;
  };

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600/20 via-background to-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600/20 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-teal-500/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bike className="h-6 w-6 text-teal-500" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                MotoVii
              </h1>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/nfc")}
            className="gap-2"
          >
            <Nfc className="h-4 w-4" />
            Campainha NFC
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 rounded-full mb-4">
            <Bike className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
              Etiqueta NFC para Veículos
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Proteja seu veículo com MotoVii
          </h2>
          <p className="text-muted-foreground">
            Videochamadas seguras para contato em emergências
          </p>
        </motion.div>
        
        {/* Benefits */}
        <Card className="mb-6 border-teal-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-teal-500" />
              Por que usar MotoVii?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-teal-500" />
                </div>
                <div>
                  <p className="font-medium">Estacionamento Irregular</p>
                  <p className="text-sm text-muted-foreground">
                    Receba uma chamada se seu veículo estiver atrapalhando
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Acidentes ou Batidas</p>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado imediatamente se algo acontecer
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Phone className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Privacidade Total</p>
                  <p className="text-sm text-muted-foreground">
                    Seu número de celular permanece em segurança
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Property Selector */}
        {properties && properties.length > 1 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Label htmlFor="property">Selecione o Veículo/Propriedade</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
        
        {/* Sticker Section */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wifi className="h-5 w-5 text-teal-500 rotate-45" />
              Adesivo MotoVii
            </CardTitle>
            <CardDescription>
              Baixe o adesivo e cole no seu veículo (moto, carro, bicicleta)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-6"
            >
              <img
                src={nfcMotoStickerImage}
                alt="Adesivo MotoVii NFC"
                className="w-80 h-auto rounded-2xl shadow-2xl shadow-teal-500/30"
              />
              
              {/* Animated NFC waves */}
              <motion.div
                className="absolute left-12 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-12 h-12 border-2 border-white/30 rounded-full"
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => setShowPreviewDialog(true)}
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                <Eye className="h-4 w-4" />
                Preview e Download
              </Button>
              
              <Button
                variant="outline"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
            
            {/* Preview Dialog */}
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Maximize2 className="h-5 w-5 text-teal-500" />
                    Preview do Adesivo MotoVii
                  </DialogTitle>
                  <DialogDescription>
                    Escolha o tamanho desejado para impressão
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Size Preview */}
                  <div className="flex justify-center">
                    <motion.div
                      key={selectedSize}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative"
                    >
                      <img
                        src={nfcMotoStickerImage}
                        alt="Preview do Adesivo MotoVii"
                        style={{
                          width: Math.min((stickerSizes.find(s => s.id === selectedSize)?.pixels.w || 400) / 2, 280),
                          height: 'auto'
                        }}
                        className="rounded-xl shadow-lg border-2 border-dashed border-muted"
                      />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        {stickerSizes.find(s => s.id === selectedSize)?.dimensions}
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Size Selector */}
                  <div className="space-y-2">
                    <Label>Tamanho do Adesivo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {stickerSizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            selectedSize === size.id
                              ? 'border-teal-500 bg-teal-500/10'
                              : 'border-border hover:border-teal-500/50'
                          }`}
                        >
                          <p className="font-medium">{size.name}</p>
                          <p className="text-xs text-muted-foreground">{size.dimensions}</p>
                          <p className="text-xs text-muted-foreground">{size.pixels.w}x{size.pixels.h}px</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <Button
                    onClick={handleDownloadSticker}
                    className="w-full gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    size="lg"
                  >
                    <Download className="h-5 w-5" />
                    Baixar Adesivo ({stickerSizes.find(s => s.id === selectedSize)?.dimensions})
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        {/* NFC Programming Section */}
        <Card className="mb-6 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Nfc className="h-5 w-5 text-cyan-500" />
              Programar Tag NFC
            </CardTitle>
            <CardDescription>
              Grave o link MotoVii em uma tag NFC para colar no veículo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nfcSupported === false && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    NFC não suportado neste navegador
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use o Chrome no Android para gravar tags NFC.
                  </p>
                </div>
              </div>
            )}
            
            {nfcSupported && (
              <Button
                onClick={handleWriteNFC}
                disabled={nfcWriting}
                className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                size="lg"
              >
                {nfcWriting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Nfc className="h-5 w-5" />
                    </motion.div>
                    Aproxime a tag NFC...
                  </>
                ) : (
                  <>
                    <Nfc className="h-5 w-5" />
                    Gravar Tag NFC
                  </>
                )}
              </Button>
            )}
            
            {/* Link Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Link MotoVii
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted/50 rounded-lg text-sm font-mono break-all border">
                  {visitorUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Instructions */}
        <Card className="bg-gradient-to-br from-muted/30 to-muted/10">
          <CardHeader>
            <CardTitle className="text-lg">Como Usar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Baixe o adesivo MotoVii no tamanho desejado</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Imprima em adesivo resistente à água</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Cole uma etiqueta NFC programada atrás do adesivo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>Aplique no seu veículo (tanque, guidão, painel)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>Pessoas podem tocar o celular para ligar para você!</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MotoViiPage;
