import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/useProperties";
import { useAccessCodes } from "@/hooks/useAccessCodes";
import { useDoorbellListener } from "@/hooks/useDoorbellListener";
import { IncomingCall } from "@/components/IncomingCall";
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
  Pencil,
  Sparkles
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import nfcStickerImage from "@/assets/nfc-doorbell-sticker.png";
import doorviiLogoWhite from "@/assets/doorvii-logo-white.png";

const NFCDoorbellPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { propertyId: urlPropertyId } = useParams<{ propertyId: string }>();
  
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: accessCodes } = useAccessCodes();
  const { doorbellState, dismissDoorbell } = useDoorbellListener();
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [customPropertyName, setCustomPropertyName] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const selectedProperty = properties?.find(p => p.id === selectedPropertyId) || properties?.[0];
  const propertyAccessCode = accessCodes?.find(code => code.property_id === selectedPropertyId);
  
  // Update custom property name when property changes
  useEffect(() => {
    if (selectedProperty?.name) {
      setCustomPropertyName(selectedProperty.name);
    }
  }, [selectedProperty?.name]);
  
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
    ? `${window.location.origin}/call/${encodeURIComponent(propertyAccessCode.code)}?property=${encodeURIComponent(selectedProperty?.name || 'Propriedade')}&source=nfc`
    : `${window.location.origin}/call/demo?property=Demo&source=nfc`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(visitorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link NFC foi copiado para a área de transferência.",
    });
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Campainha NFC - ${selectedProperty?.name || 'Propriedade'}`,
          text: `Toque seu celular para chamar`,
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
        description: "A tag foi programada com sucesso. Visitantes podem tocar para chamar.",
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
    const link = document.createElement('a');
    link.href = nfcStickerImage;
    link.download = `campainha-nfc-${selectedProperty?.name || 'doorvii'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Imagem baixada!",
      description: "Use esta imagem para criar seu adesivo NFC.",
    });
  };
  
  // Generate personalized sticker with property name
  const generatePersonalizedSticker = async () => {
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Load the base sticker image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = nfcStickerImage;
      });
      
      // Set canvas size (high resolution)
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Draw the base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add property name banner at the bottom
      const bannerHeight = 80 * scale;
      const bannerY = canvas.height - bannerHeight - 40 * scale;
      
      // Draw semi-transparent banner background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(20 * scale, bannerY, canvas.width - 40 * scale, bannerHeight, 16 * scale);
      ctx.fill();
      
      // Draw property name
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate font size to fit
      let fontSize = 32 * scale;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      
      const maxWidth = canvas.width - 80 * scale;
      while (ctx.measureText(customPropertyName).width > maxWidth && fontSize > 16 * scale) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      }
      
      // Add text shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4 * scale;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 2 * scale;
      
      ctx.fillText(customPropertyName, canvas.width / 2, bannerY + bannerHeight / 2);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Download the personalized sticker
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `campainha-nfc-${customPropertyName.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Adesivo personalizado criado!",
        description: `Adesivo com "${customPropertyName}" foi baixado.`,
      });
    } catch (error) {
      console.error('Error generating sticker:', error);
      toast({
        title: "Erro ao gerar adesivo",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Update preview canvas
  useEffect(() => {
    const updatePreview = async () => {
      const canvas = previewCanvasRef.current;
      if (!canvas || !customPropertyName) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Set canvas size for preview
        canvas.width = 256;
        canvas.height = (img.height / img.width) * 256;
        
        // Draw the base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Add property name banner at the bottom
        const bannerHeight = 32;
        const bannerY = canvas.height - bannerHeight - 16;
        
        // Draw semi-transparent banner background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(8, bannerY, canvas.width - 16, bannerHeight, 6);
        ctx.fill();
        
        // Draw property name
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate font size to fit
        let fontSize = 14;
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        
        const maxWidth = canvas.width - 32;
        while (ctx.measureText(customPropertyName).width > maxWidth && fontSize > 8) {
          fontSize -= 1;
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        }
        
        ctx.fillText(customPropertyName, canvas.width / 2, bannerY + bannerHeight / 2);
      };
      
      img.src = nfcStickerImage;
    };
    
    updatePreview();
  }, [customPropertyName]);

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600/20 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Nfc className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Campainha NFC
              </h1>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/qrcode")}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
        </div>
      </header>
      
      {/* Incoming Call Handler */}
      <AnimatePresence>
        {doorbellState.isRinging && (
          <IncomingCall
            callerName="Visitante"
            propertyName={doorbellState.propertyName}
            onAnswer={() => {
              dismissDoorbell();
              navigate(`/call/${doorbellState.roomName}?property=${encodeURIComponent(doorbellState.propertyName)}`);
            }}
            onDecline={dismissDoorbell}
          />
        )}
      </AnimatePresence>
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Property Selector */}
        <Card className="mb-6 border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Selecionar Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma propriedade" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* NFC Sticker Preview */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wifi className="h-5 w-5 text-blue-500 rotate-45" />
              Adesivo NFC
            </CardTitle>
            <CardDescription>
              Baixe o adesivo padrão ou crie um personalizado com o nome da propriedade
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-6"
            >
              <img
                src={nfcStickerImage}
                alt="Adesivo Campainha NFC"
                className="w-64 h-auto rounded-2xl shadow-2xl shadow-blue-500/30"
              />
              
              {/* Animated NFC waves */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-20 h-20 border-2 border-white/30 rounded-full"
                    animate={{
                      scale: [1, 2, 2.5],
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
            
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Button
                onClick={handleDownloadSticker}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Baixar Padrão
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
            
            {/* Personalized Sticker Section */}
            <div className="w-full border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg">Adesivo Personalizado</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customization Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyName" className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Nome da Propriedade
                    </Label>
                    <Input
                      id="propertyName"
                      value={customPropertyName}
                      onChange={(e) => setCustomPropertyName(e.target.value)}
                      placeholder="Ex: Casa da Praia"
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      O nome aparecerá no adesivo para identificar a propriedade
                    </p>
                  </div>
                  
                  <Button
                    onClick={generatePersonalizedSticker}
                    disabled={isGenerating || !customPropertyName.trim()}
                    className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Gerar Adesivo Personalizado
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Preview */}
                <div className="flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
                  <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-dashed border-muted">
                    <canvas
                      ref={previewCanvasRef}
                      className="w-48 h-auto"
                    />
                    {!customPropertyName && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                        <p className="text-sm text-muted-foreground text-center px-4">
                          Digite o nome da propriedade para ver a prévia
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hidden canvas for generation */}
            <canvas ref={canvasRef} className="hidden" />
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
              Grave o link da campainha em uma tag NFC vazia
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
                    Use o Chrome no Android para gravar tags NFC, ou copie o link abaixo e use um app de NFC.
                  </p>
                </div>
              </div>
            )}
            
            {nfcSupported && (
              <Button
                onClick={handleWriteNFC}
                disabled={nfcWriting}
                className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
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
                Link da Campainha NFC
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
            <CardTitle className="text-lg">Como Configurar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold shrink-0">
                  1
                </span>
                <div>
                  <p className="font-medium">Baixe o adesivo</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Baixar Adesivo" e imprima em papel adesivo
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold shrink-0">
                  2
                </span>
                <div>
                  <p className="font-medium">Compre uma tag NFC</p>
                  <p className="text-sm text-muted-foreground">
                    Tags NFC custam poucos reais e são encontradas facilmente online
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold shrink-0">
                  3
                </span>
                <div>
                  <p className="font-medium">Programe a tag</p>
                  <p className="text-sm text-muted-foreground">
                    Use o botão "Gravar Tag NFC" acima ou um app de NFC
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold shrink-0">
                  4
                </span>
                <div>
                  <p className="font-medium">Cole na sua porta</p>
                  <p className="text-sm text-muted-foreground">
                    Cole o adesivo sobre a tag NFC e pronto!
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NFCDoorbellPage;
