import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Shield, Zap, Play } from 'lucide-react';
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
  const [isDemoLoading, setIsDemoLoading] = useState(false);
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
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user?.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_active')
              .eq('user_id', session.session.user.id)
              .single();
            
            if (profile && profile.is_active === false) {
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

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const { error } = await signIn('demo@doorvii.com', 'demo123456');
      if (error) {
        toast({
          title: 'Conta demo não encontrada',
          description: 'A conta demo ainda não foi criada. Por favor, crie uma conta com: demo@doorvii.com e senha: demo123456',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Modo Demo',
          description: 'Bem-vindo ao modo demonstração!'
        });
      }
    } finally {
      setIsDemoLoading(false);
    }
  
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#1a2b4a] to-[#0f1f3a]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500/30 border-t-cyan-400"></div>
          <div className="absolute inset-0 rounded-full blur-xl bg-cyan-500/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#1a2b4a] to-[#0f1f3a]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div 
          className="absolute w-80 h-80 rounded-full bg-blue-600/10 blur-3xl"
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 60, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '10%', right: '10%' }}
        />
        <motion.div 
          className="absolute w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '50%', right: '20%' }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="relative inline-block">
            <motion.div
              className="absolute -inset-8 rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-2xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <img 
              src={doorviiLogo} 
              alt="DoorVII" 
              className="h-32 sm:h-40 mx-auto mb-4 object-contain relative z-10"
              style={{ 
                filter: 'drop-shadow(0 0 30px rgba(0, 212, 255, 0.6)) drop-shadow(0 0 60px rgba(0, 150, 255, 0.4))',
              }}
            />
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-light tracking-wide bg-gradient-to-r from-cyan-300 via-blue-300 to-white bg-clip-text text-transparent"
          >
            Portaria Digital Inteligente
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/50 mt-3"
          >
            {isLogin ? 'Bem-vindo de volta! Entre na sua conta' : 'Comece agora! Crie sua conta grátis'}
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75" />
          
          <div 
            className="relative rounded-3xl p-8 backdrop-blur-xl border border-white/10"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80 text-sm font-medium">
                      Nome completo <span className="text-cyan-400">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/80 text-sm font-medium">
                      WhatsApp <span className="text-cyan-400">*</span>
                    </Label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      error={errors.phone}
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                  Email <span className="text-cyan-400">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                  Senha <span className="text-cyan-400">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 mt-0.5"
                    />
                    <label 
                      htmlFor="terms" 
                      className="text-sm text-white/50 leading-tight cursor-pointer"
                    >
                      Eu concordo com os{' '}
                      <a href="/termos" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                        Termos de Uso
                      </a>{' '}
                      e{' '}
                      <a href="/privacidade" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                        Privacidade
                      </a>.
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-400">{errors.terms}</p>
                  )}
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 50%, #0066ff 100%)',
                    boxShadow: '0 10px 30px -10px rgba(0, 212, 255, 0.5)'
                  }}
                  disabled={isLoading}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isLogin ? 'Entrar' : 'Criar conta'}
                      <Sparkles className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Demo Login Button */}
            {isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4"
              >
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative px-4 text-xs text-white/40 bg-transparent">ou</div>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full h-11 text-sm font-medium rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
                    disabled={isDemoLoading || isLoading}
                  >
                    {isDemoLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-400/30 border-t-amber-400"></div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Entrar como Demo
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {isLogin ? (
                  <>Não tem conta? <span className="text-cyan-400 font-medium">Cadastre-se grátis</span></>
                ) : (
                  <>Já tem conta? <span className="text-cyan-400 font-medium">Entre agora</span></>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Features badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-6 mt-8"
        >
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Shield className="w-4 h-4 text-cyan-500/60" />
            <span>Seguro</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Zap className="w-4 h-4 text-cyan-500/60" />
            <span>Rápido</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Sparkles className="w-4 h-4 text-cyan-500/60" />
            <span>Inteligente</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}