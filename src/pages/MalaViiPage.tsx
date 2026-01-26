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
  Luggage,
  Shield,
  Phone,
  MapPin,
  ShoppingCart,
  Bike,
  Car,
  Plane,
  Tag
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
import nfcLuggageStickerImage from "@/assets/nfc-luggage-sticker.png";
import nfcLuggageStickerRoundImage from "@/assets/nfc-luggage-sticker-round.png";

const MalaViiPage = () => {
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
  const [selectedStickerType, setSelectedStickerType] = useState<"rectangular" | "round">("rectangular");
  
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
  
  const rectangularStickerSizes = [
    { id: "small", name: "Pequeno", dimensions: "6x3 cm (2.4x1.2\")", pixels: { w: 240, h: 135 } },
    { id: "medium", name: "Médio", dimensions: "10x5 cm (3.9x2\")", pixels: { w: 400, h: 225 } },
    { id: "large", name: "Grande", dimensions: "14x7 cm (5.5x2.8\")", pixels: { w: 560, h: 315 } },
    { id: "xlarge", name: "Extra Grande", dimensions: "20x10 cm (7.9x3.9\")", pixels: { w: 800, h: 450 } },
  ];
  
  const roundStickerSizes = [
    { id: "small", name: "Pequeno", dimensions: "5x5 cm (2x2\")", pixels: { w: 200, h: 200 } },
    { id: "medium", name: "Médio", dimensions: "8x8 cm (3.1x3.1\")", pixels: { w: 320, h: 320 } },
    { id: "large", name: "Grande", dimensions: "10x10 cm (3.9x3.9\")", pixels: { w: 400, h: 400 } },
    { id: "xlarge", name: "Extra Grande", dimensions: "15x15 cm (5.9x5.9\")", pixels: { w: 600, h: 600 } },
  ];
  
  const stickerSizes = selectedStickerType === "round" ? roundStickerSizes : rectangularStickerSizes;
  const currentStickerImage = selectedStickerType === "round" ? nfcLuggageStickerRoundImage : nfcLuggageStickerImage;
  
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
    ? `${window.location.origin}/call/${encodeURIComponent(propertyAccessCode.code)}?property=${encodeURIComponent(selectedProperty?.name || 'Bagagem')}&source=malavii`
    : `${window.location.origin}/call/demo?property=Bagagem&source=malavii`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(visitorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link MalaVii foi copiado para a área de transferência.",
    });
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MalaVii - ${selectedProperty?.name || 'Bagagem'}`,
          text: `Toque seu celular para ligar para o dono da bagagem`,
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
        description: "A tag foi programada com sucesso para sua bagagem.",
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
  
  const handleDownloadSticker = () => {
    const size = stickerSizes.find(s => s.id === selectedSize);
    const pixels = size?.pixels || { w: 400, h: 225 };
    const stickerTypeLabel = selectedStickerType === "round" ? "redondo" : "retangular";
    
    // Create canvas to resize
    const canvas = document.createElement('canvas');
    canvas.width = pixels.w;
    canvas.height = pixels.h;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = currentStickerImage;
      link.download = `malavii-${stickerTypeLabel}-${selectedProperty?.name || 'bagagem'}-${size?.dimensions || '10x5cm'}.png`;
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
      link.download = `malavii-${stickerTypeLabel}-${selectedProperty?.name || 'bagagem'}-${size?.dimensions || '10x5cm'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Imagem baixada!",
        description: `Adesivo MalaVii ${stickerTypeLabel} ${size?.dimensions || ''} salvo com sucesso.`,
      });
      
      setShowPreviewDialog(false);
    };
    img.src = currentStickerImage;
  };

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-600/20 via-background to-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-600/20 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-amber-500/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Luggage className="h-6 w-6 text-amber-500" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                MalaVii
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/motovii")}
              className="gap-2"
            >
              <Bike className="h-4 w-4" />
              MotoVii
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/carvii")}
              className="gap-2"
            >
              <Car className="h-4 w-4" />
              CarVii
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full mb-4">
            <Luggage className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Etiqueta NFC para Bagagens
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Proteja sua bagagem com MalaVii
          </h2>
          <p className="text-muted-foreground">
            Videochamadas seguras para localizar malas perdidas
          </p>
        </motion.div>
        
        {/* Benefits */}
        <Card className="mb-6 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-amber-500" />
              Por que usar MalaVii?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Plane className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Bagagem Extraviada</p>
                  <p className="text-sm text-muted-foreground">
                    Quem encontrar sua mala pode ligar para você imediatamente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Tag className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Identificação Rápida</p>
                  <p className="text-sm text-muted-foreground">
                    Basta aproximar o celular para identificar o dono
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
                    Seu número de celular e dados pessoais ficam protegidos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Funciona em Qualquer Lugar</p>
                  <p className="text-sm text-muted-foreground">
                    Aeroportos, rodoviárias, hotéis - onde houver internet
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
              <Label htmlFor="property">Selecione a Propriedade</Label>
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
              <Wifi className="h-5 w-5 text-amber-500 rotate-45" />
              Adesivo MalaVii
            </CardTitle>
            <CardDescription>
              Baixe o adesivo e cole na sua mala de viagem
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* Sticker Type Selector */}
            <div className="flex gap-2 mb-6 w-full max-w-xs">
              <button
                onClick={() => {
                  setSelectedStickerType("rectangular");
                  setSelectedSize("medium");
                }}
                className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                  selectedStickerType === "rectangular"
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-border hover:border-amber-500/50'
                }`}
              >
                <div className="w-12 h-6 mx-auto mb-1 bg-gradient-to-r from-blue-900 to-amber-500 rounded" />
                <p className="text-xs font-medium">Retangular</p>
              </button>
              <button
                onClick={() => {
                  setSelectedStickerType("round");
                  setSelectedSize("medium");
                }}
                className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                  selectedStickerType === "round"
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-border hover:border-amber-500/50'
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-blue-900 to-amber-500 rounded-full" />
                <p className="text-xs font-medium">Redondo</p>
              </button>
            </div>
            
            <motion.div
              key={selectedStickerType}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative group cursor-pointer mb-6"
              onClick={() => setShowPreviewDialog(true)}
            >
              <img
                src={currentStickerImage}
                alt="MalaVii Sticker"
                className={`shadow-2xl transition-transform group-hover:scale-105 ${
                  selectedStickerType === "round" 
                    ? "w-48 h-48 rounded-full object-cover" 
                    : "w-64 rounded-xl"
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                <div className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">Visualizar</span>
                </div>
              </div>
            </motion.div>
            
            {/* Size Selector */}
            <div className="w-full max-w-xs mb-4">
              <Label>Tamanho do Adesivo</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stickerSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} - {size.dimensions}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleDownloadSticker}
              className="w-full max-w-xs gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Download className="h-4 w-4" />
              Baixar Adesivo
            </Button>
          </CardContent>
        </Card>
        
        {/* NFC Programming Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Nfc className="h-5 w-5 text-amber-500" />
              Programar Tag NFC
            </CardTitle>
            <CardDescription>
              Grave o link diretamente em uma etiqueta NFC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nfcSupported === false && (
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    NFC não suportado neste dispositivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use o adesivo com QR Code ou copie o link abaixo
                  </p>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleWriteNFC}
              disabled={nfcWriting || nfcSupported === false}
              className="w-full gap-2"
              variant={nfcSupported ? "default" : "secondary"}
            >
              {nfcWriting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Aproxime a tag NFC...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  Gravar Tag NFC
                </>
              )}
            </Button>
            
            {/* Link Section */}
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Link da Bagagem</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={visitorUrl}
                  readOnly
                  className="text-xs"
                />
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Purchase Links Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
              Onde Comprar Tags NFC
            </CardTitle>
            <CardDescription>
              Links para comprar etiquetas NFC compatíveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchaseLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm font-medium hover:text-amber-500 transition-colors truncate"
                >
                  {link.name}
                </a>
                {link.id !== "shopee-default" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemovePurchaseLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            
            <AnimatePresence>
              {showAddLink ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-3 border-t"
                >
                  <div>
                    <Label>Nome do Link</Label>
                    <Input
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                      placeholder="Ex: Amazon - Tags NFC"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddPurchaseLink}
                      className="flex-1"
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddLink(false);
                        setNewLinkName("");
                        setNewLinkUrl("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowAddLink(true)}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Link de Compra
                </Button>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
      
      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Maximize2 className="h-5 w-5" />
              Prévia do Adesivo MalaVii
            </DialogTitle>
            <DialogDescription>
              Visualize o adesivo antes de baixar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <img
              src={currentStickerImage}
              alt="MalaVii Sticker Preview"
              className={`shadow-2xl mb-4 ${
                selectedStickerType === "round" 
                  ? "w-64 h-64 rounded-full object-cover" 
                  : "w-full max-w-md rounded-xl"
              }`}
            />
            <div className="w-full max-w-xs">
              <Label>Tamanho para Download</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stickerSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} - {size.dimensions}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleDownloadSticker}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Download className="h-4 w-4" />
            Baixar Adesivo
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MalaViiPage;
