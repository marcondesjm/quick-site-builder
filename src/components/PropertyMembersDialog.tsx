import { useState } from "react";
import { Users, UserPlus, Trash2, Copy, Check, Clock, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  usePropertyMembers,
  useCreateInviteCode,
  useInviteCodes,
  useRemoveMember,
} from "@/hooks/usePropertyMembers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PropertyMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
}

export const PropertyMembersDialog = ({
  open,
  onOpenChange,
  propertyId,
  propertyName,
}: PropertyMembersDialogProps) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: members, isLoading: membersLoading } = usePropertyMembers(propertyId);
  const { data: inviteCodes, isLoading: codesLoading } = useInviteCodes(propertyId);
  const createInviteCode = useCreateInviteCode();
  const removeMember = useRemoveMember();

  // Fetch member profiles to get names
  const { data: memberProfiles } = useQuery({
    queryKey: ["member-profiles", members?.map((m) => m.user_id)],
    queryFn: async () => {
      if (!members || members.length === 0) return [];
      
      const userIds = members.map((m) => m.user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);

      if (error) throw error;
      return data;
    },
    enabled: !!members && members.length > 0,
  });

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      await createInviteCode.mutateAsync({
        propertyId,
        expiresInHours: 48,
        maxUses: 5,
      });
      toast({
        title: "Código gerado!",
        description: "Compartilhe o código com o morador",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Código copiado!",
        description: "Envie o código para o morador se cadastrar",
      });
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      await removeMember.mutateAsync({ memberId, propertyId });
      toast({
        title: "Morador removido",
        description: `${memberName} foi removido da propriedade`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover morador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getMemberName = (userId: string) => {
    const profile = memberProfiles?.find((p) => p.user_id === userId);
    return profile?.full_name || "Morador";
  };

  const getMemberPhone = (userId: string) => {
    const profile = memberProfiles?.find((p) => p.user_id === userId);
    return profile?.phone || null;
  };

  const activeInviteCodes = inviteCodes?.filter((code: any) => {
    const isExpired = new Date(code.expires_at) < new Date();
    const isMaxUsed = code.max_uses && code.uses_count >= code.max_uses;
    return !isExpired && !isMaxUsed;
  }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Moradores - {propertyName}
          </DialogTitle>
          <DialogDescription>
            Gerencie os moradores que podem receber entregas nesta propriedade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate Invite Code Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Convidar morador</Label>
              <Button
                size="sm"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Gerar código
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Gere um código de convite para o morador se cadastrar no app e receber entregas.
            </p>

            {/* Active Invite Codes */}
            {activeInviteCodes.length > 0 && (
              <div className="space-y-2">
                {activeInviteCodes.map((code: any) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg tracking-wider">
                          {code.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCode(code.code)}
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Expira em {format(new Date(code.expires_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        <span className="mx-1">•</span>
                        {code.uses_count}/{code.max_uses || "∞"} usos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Members List */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Moradores cadastrados ({members?.length || 0})
            </Label>

            {membersLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Carregando moradores...
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {getMemberName(member.user_id)}
                        </p>
                        {getMemberPhone(member.user_id) && (
                          <p className="text-xs text-muted-foreground">
                            {getMemberPhone(member.user_id)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {member.role === "admin" ? "Administrador" : "Morador"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Desde {format(new Date(member.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveMember(member.id, getMemberName(member.user_id))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum morador cadastrado</p>
                <p className="text-xs mt-1">
                  Gere um código de convite para adicionar moradores
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
