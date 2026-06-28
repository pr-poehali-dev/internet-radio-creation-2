import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const AUTH_URL = 'https://functions.poehali.dev/1a26f46c-499a-473c-883a-b7b9ea9ee033';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAuth: (user: AuthUser, token: string) => void;
}

const AuthModal = ({ open, onOpenChange, onAuth }: Props) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка');
      } else {
        onAuth(data.user, data.token);
        onOpenChange(false);
        setName(''); setEmail(''); setPassword('');
      }
    } catch {
      setError('Не удалось соединиться с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-3xl max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Icon name="Radio" className="text-primary-foreground" size={24} />
          </div>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'login' ? 'Войди в свой аккаунт Радио Митя' : 'Создай аккаунт и собирай избранное'}
          </p>
        </div>

        <div className="space-y-3">
          {mode === 'register' && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className="h-12 rounded-xl bg-background border-border"
            />
          )}
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-12 rounded-xl bg-background border-border"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Пароль"
            className="h-12 rounded-xl bg-background border-border"
          />

          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <Icon name="TriangleAlert" size={16} /> {error}
            </p>
          )}

          <Button
            onClick={submit}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
          >
            {loading ? <Icon name="Loader" size={20} className="animate-spin" /> : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </div>

        <div className="text-center mt-5 text-sm text-muted-foreground">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;