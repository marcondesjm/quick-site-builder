import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Search, Power, PowerOff, ArrowLeft, RefreshCw, Trash2, Crown, User, Clock, CalendarPlus, CalendarX, RotateCcw, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useAllUsers, useToggleUserActive, useDeleteUser, useSetUserRole, useUpdateTrial } from '@/hooks/useAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SystemChecklist } from '@/components/SystemChecklist';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading, refetch } = useAllUsers();
  const toggleUserActive = useToggleUserActive();
  const deleteUser = useDeleteUser();
  const setUserRole = useSetUserRole();
  const updateTrial = useUpdateTrial();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

  // Scroll to checklist if hash is present
  useEffect(() => {
    if (location.hash === '#checklist') {
      const element = document.getElementById('system-checklist');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  // Show loading while checking auth and admin status
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users?.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.phone?.toLowerCase().includes(searchLower) ||
      u.user_id.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActive.mutateAsync({ userId, isActive: !currentStatus });
      toast({
        title: currentStatus ? 'Usuário desativado' : 'Usuário ativado',
        description: currentStatus 
          ? 'O usuário foi desativado com sucesso.'
          : 'O usuário foi ativado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser.mutateAsync(userToDelete.id);
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido permanentemente.',
      });
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleSetRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await setUserRole.mutateAsync({ userId, role });
      toast({
        title: role === 'admin' ? 'Administrador definido' : 'Usuário normal definido',
        description: role === 'admin' 
          ? 'O usuário agora é um administrador.'
          : 'O usuário agora é um usuário normal.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível alterar o papel do usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTrial = async (userId: string, action: 'extend' | 'remove' | 'reset', days?: number) => {
    try {
      await updateTrial.mutateAsync({ userId, action, days });
      const messages = {
        extend: `Período de teste estendido em ${days || 7} dias.`,
        remove: 'Trial removido. Usuário agora tem plano ativo.',
        reset: 'Período de teste resetado para 7 dias.',
      };
      toast({
        title: 'Trial atualizado',
        description: messages[action],
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível atualizar o trial.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={usersLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* System Checklist */}
        <motion.div
          id="system-checklist"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SystemChecklist />
        </motion.div>

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription>
                    Ative ou desative contas de usuários
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Período de Teste</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((profile) => {
                        const isCurrentUser = profile.user_id === user?.id;
                        const isPending = toggleUserActive.isPending || deleteUser.isPending || setUserRole.isPending || updateTrial.isPending;
                        
                        // Calculate trial status
                        const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
                        const now = new Date();
                        const isInTrial = trialEndsAt && trialEndsAt > now;
                        const trialExpired = trialEndsAt && trialEndsAt <= now;
                        const daysRemaining = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        
                        return (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">
                              {profile.full_name || 'Sem nome'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {profile.email || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {profile.phone || '-'}
                            </TableCell>
                            <TableCell>
                              {format(new Date(profile.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={profile.is_active ? 'default' : 'destructive'}>
                                {profile.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {profile.is_admin || isCurrentUser ? (
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {isInTrial ? (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                                    </Badge>
                                  ) : trialExpired ? (
                                    <Badge variant="destructive" className="bg-red-100 text-red-600 border-red-200">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Expirado
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-600 border-green-200">
                                      Plano Ativo
                                    </Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isPending}>
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Gerenciar Trial</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateTrial(profile.user_id, 'extend', 7)}>
                                        <CalendarPlus className="w-4 h-4 mr-2" />
                                        Estender +7 dias
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateTrial(profile.user_id, 'extend', 30)}>
                                        <CalendarPlus className="w-4 h-4 mr-2" />
                                        Estender +30 dias
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateTrial(profile.user_id, 'reset')}>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Resetar (7 dias)
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleUpdateTrial(profile.user_id, 'remove')}
                                        className="text-green-600"
                                      >
                                        <CalendarX className="w-4 h-4 mr-2" />
                                        Remover Trial (Ativar Plano)
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isCurrentUser ? (
                                <Badge variant="outline" className="border-primary text-primary">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Você (Admin)
                                </Badge>
                              ) : profile.is_admin ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-primary text-primary">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetRole(profile.user_id, 'user')}
                                    disabled={isPending}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <User className="w-3 h-3 mr-1" />
                                    Tornar Usuário
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    <User className="w-3 h-3 mr-1" />
                                    Usuário
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSetRole(profile.user_id, 'admin')}
                                    disabled={isPending}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Crown className="w-3 h-3 mr-1" />
                                    Tornar Admin
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isCurrentUser ? (
                                <span className="text-xs text-muted-foreground">Protegido</span>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant={profile.is_active ? 'destructive' : 'default'}
                                    size="sm"
                                    onClick={() => handleToggleActive(profile.user_id, profile.is_active)}
                                    disabled={isPending}
                                  >
                                    {profile.is_active ? (
                                      <>
                                        <PowerOff className="w-4 h-4 mr-1" />
                                        Desativar
                                      </>
                                    ) : (
                                      <>
                                        <Power className="w-4 h-4 mr-1" />
                                        Ativar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUserToDelete({ id: profile.user_id, email: profile.email || 'Usuário' })}
                                    disabled={isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover permanentemente o usuário <strong>{userToDelete?.email}</strong>? 
              Esta ação não pode ser desfeita e todos os dados do usuário serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
