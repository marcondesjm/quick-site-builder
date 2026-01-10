import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Search, 
  Calendar, 
  Clock, 
  Video, 
  Mic, 
  MessageSquare, 
  ExternalLink,
  Phone,
  PhoneOff,
  Home,
  Copy,
  Check,
  Download,
  Upload,
  Trash2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCallHistory, CallHistoryItem, useDeleteCall, useDeleteAllCalls } from "@/hooks/useCallHistory";
import { useToast } from "@/hooks/use-toast";

interface GroupedCalls {
  [date: string]: CallHistoryItem[];
}

// Helper function to detect if URL is a video file
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const hasVideoExtension = lowerUrl.endsWith('.webm') || 
                            lowerUrl.endsWith('.mp4') || 
                            lowerUrl.endsWith('.mov') ||
                            lowerUrl.endsWith('.avi');
  const hasVideoMarker = lowerUrl.includes('visitor_video') || 
                         lowerUrl.includes('/video/') ||
                         lowerUrl.includes('video%2f');
  return hasVideoExtension || hasVideoMarker;
};

export function CallHistoryDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: calls, isLoading, refetch } = useCallHistory();
  const deleteCall = useDeleteCall();
  const deleteAllCalls = useDeleteAllCalls();
  const { toast } = useToast();

  // Filter calls based on search term
  const filteredCalls = calls?.filter(call => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      call.protocol_number?.toLowerCase().includes(term) ||
      call.property_name?.toLowerCase().includes(term) ||
      call.visitor_text_message?.toLowerCase().includes(term)
    );
  });

  // Group calls by date
  const groupedCalls: GroupedCalls = {};
  filteredCalls?.forEach((call) => {
    const date = format(parseISO(call.created_at), "yyyy-MM-dd");
    if (!groupedCalls[date]) {
      groupedCalls[date] = [];
    }
    groupedCalls[date].push(call);
  });

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Hoje";
    } else if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Ontem";
    }
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const formatCallTime = (dateStr: string) => {
    return format(parseISO(dateStr), "HH:mm", { locale: ptBR });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ended':
      case 'answered':
        return { label: 'Atendida', color: 'bg-green-500/10 text-green-600', icon: Phone };
      case 'missed':
        return { label: 'Perdida', color: 'bg-destructive/10 text-destructive', icon: PhoneOff };
      case 'visitor_audio_response':
        return { label: 'Mensagem recebida', color: 'bg-primary/10 text-primary', icon: Mic };
      case 'visitor_text_message':
        return { label: 'Texto recebido', color: 'bg-blue-500/10 text-blue-600', icon: MessageSquare };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground', icon: Phone };
    }
  };

  const copyProtocol = async (protocol: string) => {
    try {
      await navigator.clipboard.writeText(protocol);
      setCopiedProtocol(protocol);
      toast({
        title: "Protocolo copiado!",
        description: protocol,
      });
      setTimeout(() => setCopiedProtocol(null), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        variant: "destructive",
      });
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (!calls || calls.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Protocolo",
      "Propriedade",
      "Status",
      "Data/Hora",
      "Mensagem do Visitante",
      "URL Áudio Visitante",
      "URL Áudio Proprietário"
    ];

    const rows = calls.map(call => [
      call.protocol_number || "",
      call.property_name || "",
      call.status || "",
      call.created_at ? format(parseISO(call.created_at), "dd/MM/yyyy HH:mm:ss") : "",
      call.visitor_text_message || "",
      call.visitor_audio_url || "",
      call.audio_message_url || ""
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico_chamadas_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: `${calls.length} registros exportados`,
    });
  };

  // Import from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length <= 1) {
          toast({
            title: "Arquivo vazio ou inválido",
            variant: "destructive",
          });
          return;
        }

        // For now, just show a preview of imported data
        const recordCount = lines.length - 1; // minus header
        toast({
          title: "Arquivo lido com sucesso!",
          description: `${recordCount} registros encontrados. Importação de dados externos não é suportada por questões de segurança.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao ler arquivo",
          description: "Verifique se o arquivo está no formato correto",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete single call
  const handleDelete = async (id: string) => {
    try {
      await deleteCall.mutateAsync(id);
      toast({
        title: "Registro excluído",
        description: "O registro foi removido do histórico",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        variant: "destructive",
      });
    }
    setDeleteId(null);
  };

  // Delete all calls
  const handleDeleteAll = async () => {
    try {
      await deleteAllCalls.mutateAsync();
      toast({
        title: "Histórico limpo",
        description: "Todos os registros foram excluídos",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        variant: "destructive",
      });
    }
    setShowDeleteAllConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="w-4 h-4" />
          Histórico de Protocolos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Chamadas e Protocolos
          </DialogTitle>
        </DialogHeader>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={!calls || calls.length === 0}
          >
            <Download className="w-4 h-4" />
            Baixar CSV
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Importar
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={!calls || calls.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Excluir tudo
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por protocolo, propriedade ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredCalls && filteredCalls.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedCalls)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, dayCalls]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">
                        {formatDateHeader(date)}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {dayCalls.map((call) => {
                          const statusInfo = getStatusInfo(call.status);
                          const StatusIcon = statusInfo.icon;
                          const hasVisitorMedia = call.visitor_audio_url;
                          const hasOwnerAudio = call.audio_message_url;
                          const isVideo = hasVisitorMedia && isVideoUrl(call.visitor_audio_url!);
                          
                          return (
                            <motion.div
                              key={call.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50"
                            >
                              {/* Header with protocol and status */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-semibold text-sm">
                                        {call.protocol_number}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyProtocol(call.protocol_number!)}
                                      >
                                        {copiedProtocol === call.protocol_number ? (
                                          <Check className="w-3 h-3 text-green-500" />
                                        ) : (
                                          <Copy className="w-3 h-3 text-muted-foreground" />
                                        )}
                                      </Button>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Home className="w-3 h-3" />
                                      {call.property_name}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="secondary" className={statusInfo.color}>
                                    {statusInfo.label}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                                    <Clock className="w-3 h-3" />
                                    {formatCallTime(call.created_at)}
                                  </div>
                                </div>
                              </div>

                              {/* Visitor text message */}
                              {call.visitor_text_message && (
                                <div className="mb-3 p-3 rounded-lg bg-background/50 border border-border/30">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <MessageSquare className="w-3 h-3" />
                                    Mensagem do visitante
                                  </div>
                                  <p className="text-sm">{call.visitor_text_message}</p>
                                </div>
                              )}

                              {/* Media section */}
                              <div className="space-y-2">
                                {/* Visitor media (audio/video) */}
                                {hasVisitorMedia && (
                                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                      {isVideo ? (
                                        <Video className="w-3 h-3" />
                                      ) : (
                                        <Mic className="w-3 h-3" />
                                      )}
                                      {isVideo ? 'Vídeo do visitante' : 'Áudio do visitante'}
                                    </div>
                                    {isVideo ? (
                                      <video
                                        src={call.visitor_audio_url!}
                                        controls
                                        className="w-full max-h-48 rounded-lg"
                                        preload="metadata"
                                      />
                                    ) : (
                                      <audio
                                        src={call.visitor_audio_url!}
                                        controls
                                        className="w-full h-8"
                                        preload="metadata"
                                      />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1 h-6 text-xs text-muted-foreground hover:text-foreground"
                                      onClick={() => window.open(call.visitor_audio_url!, '_blank')}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Abrir em nova aba
                                    </Button>
                                  </div>
                                )}

                                {/* Owner audio message */}
                                {hasOwnerAudio && (
                                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                      <Mic className="w-3 h-3" />
                                      Mensagem enviada ao visitante
                                    </div>
                                    <audio
                                      src={call.audio_message_url!}
                                      controls
                                      className="w-full h-8"
                                      preload="metadata"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Delete button */}
                              <div className="mt-3 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteId(call.id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Nenhum protocolo encontrado com essa busca" 
                  : "Nenhum histórico de chamadas registrado"}
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Delete single confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será permanentemente removido do histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all confirmation */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todo o histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os registros de chamadas serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
