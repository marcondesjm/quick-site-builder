import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  GripVertical,
  MessageSquare,
  Tag,
  ToggleLeft,
  ToggleRight,
  Download,
  Upload
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useAssistantResponses,
  useAddAssistantResponse,
  useUpdateAssistantResponse,
  useDeleteAssistantResponse,
  AssistantResponse
} from "@/hooks/useAssistantResponses";

interface EditingResponse {
  id?: string;
  keywords: string;
  response: string;
}

export function AssistantSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditingResponse>({ keywords: "", response: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: responses, isLoading, refetch } = useAssistantResponses();
  const addResponse = useAddAssistantResponse();
  const updateResponse = useUpdateAssistantResponse();
  const deleteResponse = useDeleteAssistantResponse();
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!formData.keywords.trim() || !formData.response.trim()) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const keywords = formData.keywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k);
    
    try {
      await addResponse.mutateAsync({
        keywords,
        response: formData.response.trim(),
        display_order: (responses?.length || 0) + 1
      });
      toast({ title: "Resposta adicionada!" });
      setIsAdding(false);
      setFormData({ keywords: "", response: "" });
    } catch (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.keywords.trim() || !formData.response.trim()) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const keywords = formData.keywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k);
    
    try {
      await updateResponse.mutateAsync({
        id: editingId,
        keywords,
        response: formData.response.trim()
      });
      toast({ title: "Resposta atualizada!" });
      setEditingId(null);
      setFormData({ keywords: "", response: "" });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleToggle = async (item: AssistantResponse) => {
    try {
      await updateResponse.mutateAsync({
        id: item.id,
        is_enabled: !item.is_enabled
      });
      toast({ 
        title: item.is_enabled ? "Resposta desativada" : "Resposta ativada" 
      });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteResponse.mutateAsync(deleteId);
      toast({ title: "Resposta excluída!" });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const startEdit = (item: AssistantResponse) => {
    setEditingId(item.id);
    setFormData({
      keywords: item.keywords.join(", "),
      response: item.response
    });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ keywords: "", response: "" });
  };

  // Export to CSV
  const handleExport = () => {
    if (!responses || responses.length === 0) {
      toast({
        title: "Nenhuma resposta para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Palavras-chave", "Resposta", "Ativo"];
    const rows = responses.map(r => [
      r.keywords.join(", "),
      r.response,
      r.is_enabled ? "Sim" : "Não"
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `respostas_assistente_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: `${responses.length} respostas exportadas`,
    });
  };

  // Import from CSV
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
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

        // Parse CSV (skip header)
        let imported = 0;
        let errors = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Parse CSV with semicolon separator
          const matches = line.match(/(?:^|;)("(?:[^"]*(?:""[^"]*)*)"|[^;]*)/g);
          
          if (!matches || matches.length < 2) {
            errors++;
            continue;
          }

          // Clean up the values
          const cleanValue = (val: string) => {
            return val
              .replace(/^;?"|"$/g, '') // Remove leading semicolon/quote and trailing quote
              .replace(/""/g, '"')     // Unescape double quotes
              .trim();
          };

          const keywordsStr = cleanValue(matches[0]);
          const response = cleanValue(matches[1]);

          if (!keywordsStr || !response) {
            errors++;
            continue;
          }

          const keywords = keywordsStr.split(",").map(k => k.trim().toLowerCase()).filter(k => k);

          if (keywords.length === 0) {
            errors++;
            continue;
          }

          try {
            await addResponse.mutateAsync({
              keywords,
              response,
              display_order: (responses?.length || 0) + imported + 1
            });
            imported++;
          } catch {
            errors++;
          }
        }

        await refetch();

        if (imported > 0) {
          toast({
            title: "Importação concluída!",
            description: `${imported} respostas importadas${errors > 0 ? `, ${errors} erros` : ''}`,
          });
        } else {
          toast({
            title: "Nenhuma resposta importada",
            description: "Verifique o formato do arquivo CSV",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao importar",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bot className="w-4 h-4" />
          Configurar Assistente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Configurar Respostas do Assistente
          </DialogTitle>
          <DialogDescription>
            Personalize as respostas automáticas do assistente para visitantes.
            As respostas são baseadas em palavras-chave.
          </DialogDescription>
        </DialogHeader>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isAdding && !editingId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setIsAdding(true);
                setFormData({ keywords: "", response: "" });
              }}
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={!responses || responses.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
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
            Importar CSV
          </Button>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 border rounded-xl bg-secondary/20"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Palavras-chave (separadas por vírgula)
              </Label>
              <Input
                placeholder="entrega, pacote, correios, encomenda"
                value={formData.keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Quando o visitante usar uma dessas palavras, a resposta será enviada.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Resposta do Assistente
              </Label>
              <Textarea
                placeholder="Olá! Entendi que você tem uma entrega. Por favor, aguarde enquanto notifico o morador..."
                value={formData.response}
                onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={addResponse.isPending || updateResponse.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </motion.div>
        )}

        <ScrollArea className="h-[45vh] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : responses && responses.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {responses.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl border transition-colors ${
                      item.is_enabled 
                        ? "bg-secondary/30 border-border/50" 
                        : "bg-muted/30 border-muted opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.keywords.map((keyword, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Response preview */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.response}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggle(item)}
                          title={item.is_enabled ? "Desativar" : "Ativar"}
                        >
                          {item.is_enabled ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">
                Nenhuma resposta personalizada configurada
              </p>
              <p className="text-xs text-muted-foreground">
                O assistente usará as respostas padrão do sistema.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Dica: Suas respostas personalizadas têm prioridade sobre as respostas padrão.
          </p>
        </div>
      </DialogContent>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A resposta será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
