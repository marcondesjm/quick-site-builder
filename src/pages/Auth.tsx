import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PhoneInput } from '@/components/PhoneInput';
import doorviiLogo from '@/assets/doorvii-logo-new.png';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');
const phoneSchema = z.string().min(1, 'WhatsApp é obrigatório').regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'WhatsApp inválido. Use o formato (XX) XXXXX-XXXX');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; phone?: string; terms?: string }>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
      
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }

      if (!acceptedTerms) {
        newErrors.terms = 'Você deve aceitar os Termos de Uso e Privacidade';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Erro de login',
              description: 'Email ou senha incorretos',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Erro',
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          // Check if user account is active
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user?.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_active')
              .eq('user_id', session.session.user.id)
              .single();
            
            if (profile && profile.is_active === false) {
              // Sign out if account is inactive
              await supabase.auth.signOut();
              toast({
                title: 'Conta desativada',
                description: 'Sua conta foi desativada. Entre em contato com o administrador.',
                variant: 'destructive'
              });
              return;
            }
          }
          
          toast({
            title: 'Bem-vindo!',
            description: 'Login realizado com sucesso'
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Email já cadastrado',
              description: 'Tente fazer login ou use outro email',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Erro',
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Você já pode usar o app'
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2b4a 0%, #243b5e 50%, #1a2b4a 100%)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a2b4a 0%, #243b5e 50%, #1a2b4a 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <img 
              src={doorviiLogo} 
              alt="DoorVii" 
              className="h-20 sm:h-24 mx-auto mb-4 object-contain drop-shadow-[0_0_25px_rgba(0,200,255,0.6)] animate-pulse-soft"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(0, 200, 255, 0.5)) drop-shadow(0 0 40px rgba(0, 150, 255, 0.3))',
              }}
            />
            <span className="absolute -top-1 -right-4 text-white/80 text-xs font-medium">®</span>
          </div>
          <p className="text-lg text-white/80">Portaria Digital Inteligente</p>
          <p className="text-sm text-white/60 mt-3">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta grátis'}
          </p>
        </motion.div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp <span className="text-destructive">*</span></Label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    error={errors.phone}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    Eu concordo com os{' '}
                    <a href="/termos" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e{' '}
                    <a href="/privacidade" target="_blank" className="text-primary hover:underline">
                      Privacidade
                    </a>.
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive">{errors.terms}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary-foreground"></div>
              ) : (
                isLogin ? 'Entrar' : 'Criar conta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>Não tem conta? <span className="text-primary font-medium">Cadastre-se</span></>
              ) : (
                <>Já tem conta? <span className="text-primary font-medium">Entre</span></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
