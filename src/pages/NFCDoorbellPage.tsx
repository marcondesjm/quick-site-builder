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
  Sparkles,
  ShoppingCart,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Maximize2
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
  
  // Purchase links state
  interface PurchaseLink {
    id: string;
    name: string;
    url: string;
  }
  
  const defaultLinks: PurchaseLink[] = [
    {
      id: "shopee-default",
      name: "Shopee - Kit 10 a 50 Etiquetas NFC",
      url: "https://shopee.com.br/Kit-10-a-50-Etiqueta-Nfc-Ntag215-Leitura-13-56mhz-Tag-Regrav%C3%A1vel-i.1333477191.23694368772"
    }
  ];
  
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>(() => {
    const saved = localStorage.getItem("nfc-purchase-links");
    return saved ? JSON.parse(saved) : defaultLinks;
  });
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  
  // Preview dialog state
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("medium");
  
  const stickerSizes = [
    { id: "small", name: "Pequeno", dimensions: "5x5 cm (2x2\")", pixels: 200 },
    { id: "medium", name: "Médio", dimensions: "8x8 cm (3.1x3.1\")", pixels: 320 },
    { id: "large", name: "Grande", dimensions: "10x10 cm (3.9x3.9\")", pixels: 400 },
    { id: "xlarge", name: "Extra Grande", dimensions: "15x15 cm (5.9x5.9\")", pixels: 600 },
  ];
  
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
  
  // Purchase links management
  const handleAddPurchaseLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    // Validate URL
    try {
      new URL(newLinkUrl);
    } catch {
      toast({
        title: "URL inválida",
        description: "Digite uma URL válida começando com http:// ou https://",
        variant: "destructive",
      });
      return;
    }
    
    const newLink: PurchaseLink = {
      id: Date.now().toString(),
      name: newLinkName.trim(),
      url: newLinkUrl.trim(),
    };
    
    const updated = [...purchaseLinks, newLink];
    setPurchaseLinks(updated);
    localStorage.setItem("nfc-purchase-links", JSON.stringify(updated));
    
    setNewLinkName("");
    setNewLinkUrl("");
    setShowAddLink(false);
    
    toast({
      title: "Link adicionado!",
      description: "O link de compra foi salvo.",
    });
  };
  
  const handleRemovePurchaseLink = (id: string) => {
    const updated = purchaseLinks.filter(link => link.id !== id);
    setPurchaseLinks(updated);
    localStorage.setItem("nfc-purchase-links", JSON.stringify(updated));
    
    toast({
      title: "Link removido",
    });
  };
  
  const handleDownloadSticker = (customPixels?: number) => {
    const size = stickerSizes.find(s => s.id === selectedSize);
    const pixels = customPixels || size?.pixels || 320;
    
    // Create canvas to resize
    const canvas = document.createElement('canvas');
    canvas.width = pixels;
    canvas.height = pixels;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = nfcStickerImage;
      link.download = `campainha-nfc-${selectedProperty?.name || 'doorvii'}-${size?.dimensions || '8x8cm'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, pixels, pixels);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `campainha-nfc-${selectedProperty?.name || 'doorvii'}-${size?.dimensions || '8x8cm'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Imagem baixada!",
        description: `Adesivo ${size?.dimensions || ''} salvo com sucesso.`,
      });
      
      setShowPreviewDialog(false);
    };
    img.src = nfcStickerImage;
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
  
  // Update preview canvas - show sticker without property name banner by default
  useEffect(() => {
    const updatePreview = async () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Set canvas size for preview
        canvas.width = 256;
        canvas.height = (img.height / img.width) * 256;
        
        // Draw the base image without property name
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Only add property name banner if user has typed a custom name
        if (customPropertyName && customPropertyName !== selectedProperty?.name) {
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
        }
      };
      
      img.src = nfcStickerImage;
    };
    
    updatePreview();
  }, [customPropertyName, selectedProperty?.name]);

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
                onClick={() => setShowPreviewDialog(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
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
                    <Maximize2 className="h-5 w-5 text-blue-500" />
                    Preview do Adesivo
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
                        src={nfcStickerImage}
                        alt="Preview do Adesivo NFC"
                        style={{
                          width: stickerSizes.find(s => s.id === selectedSize)?.pixels 
                            ? Math.min(stickerSizes.find(s => s.id === selectedSize)!.pixels / 2, 200) 
                            : 160,
                          height: 'auto'
                        }}
                        className="rounded-xl shadow-lg border-2 border-dashed border-muted"
                      />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
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
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-border hover:border-blue-500/50'
                          }`}
                        >
                          <p className="font-medium">{size.name}</p>
                          <p className="text-xs text-muted-foreground">{size.dimensions}</p>
                          <p className="text-xs text-muted-foreground">{size.pixels}x{size.pixels}px</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <Button
                    onClick={() => handleDownloadSticker()}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    size="lg"
                  >
                    <Download className="h-5 w-5" />
                    Baixar Adesivo ({stickerSizes.find(s => s.id === selectedSize)?.dimensions})
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
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
        
        {/* Purchase Links Section */}
        <Card className="mb-6 border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  Onde Comprar Etiquetas NFC
                </CardTitle>
                <CardDescription>
                  Links para comprar etiquetas NFC compatíveis
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddLink(!showAddLink)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new link form */}
            <AnimatePresence>
              {showAddLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-dashed border-muted-foreground/30">
                    <div className="space-y-2">
                      <Label htmlFor="linkName">Nome da Loja / Produto</Label>
                      <Input
                        id="linkName"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        placeholder="Ex: AliExpress - Tags NFC 10 unidades"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">URL do Produto</Label>
                      <Input
                        id="linkUrl"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                        type="url"
                        maxLength={500}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddPurchaseLink}
                        size="sm"
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddLink(false);
                          setNewLinkName("");
                          setNewLinkUrl("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Purchase links list */}
            <div className="space-y-2">
              {purchaseLinks.map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:border-green-500/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(link.url, "_blank")}
                      className="h-8 w-8 hover:bg-green-500/10"
                    >
                      <ExternalLink className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePurchaseLink(link.id)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              
              {purchaseLinks.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum link cadastrado</p>
                  <p className="text-xs">Clique em "Adicionar Link" para começar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NFCDoorbellPage;
