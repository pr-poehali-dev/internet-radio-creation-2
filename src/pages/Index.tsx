import { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthModal, { AuthUser } from '@/components/AuthModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const COVERS = {
  neon: 'https://cdn.poehali.dev/projects/ffbf9524-524f-40ab-80dd-5955e7e68687/files/46580e4e-48de-4491-a6ca-16c2d144d835.jpg',
  synth: 'https://cdn.poehali.dev/projects/ffbf9524-524f-40ab-80dd-5955e7e68687/files/2bea58c6-62de-4817-84d0-a5ad4ed809e6.jpg',
  lofi: 'https://cdn.poehali.dev/projects/ffbf9524-524f-40ab-80dd-5955e7e68687/files/3c7864c8-83e0-4b1d-be0a-d3501586edea.jpg',
};

// Рабочий демо-поток. Замените на свой URL потока radiomitya.ru
const STREAM_URL = 'https://stream.radioparadise.com/aac-128';

const channels = [
  { id: 1, name: 'Радио Митя — Основной', genre: 'Хиты', listeners: '12.4K', cover: COVERS.neon, stream: STREAM_URL },
  { id: 2, name: 'Митя Ретро', genre: 'Ретро', listeners: '8.1K', cover: COVERS.synth, stream: STREAM_URL },
  { id: 3, name: 'Митя Лаунж', genre: 'Лаунж', listeners: '21.7K', cover: COVERS.lofi, stream: STREAM_URL },
  { id: 4, name: 'Митя Драйв', genre: 'Хиты', listeners: '5.3K', cover: COVERS.neon, stream: STREAM_URL },
  { id: 5, name: 'Митя 80-е', genre: 'Ретро', listeners: '9.8K', cover: COVERS.synth, stream: STREAM_URL },
  { id: 6, name: 'Митя Вечер', genre: 'Лаунж', listeners: '33.2K', cover: COVERS.lofi, stream: STREAM_URL },
];

const playlists = [
  { id: 1, name: 'Лучшее на Радио Митя', genre: 'Хиты', tracks: 48, cover: COVERS.neon },
  { id: 2, name: 'Ретро ночь', genre: 'Ретро', tracks: 32, cover: COVERS.synth },
  { id: 3, name: 'Спокойный вечер', genre: 'Лаунж', tracks: 64, cover: COVERS.lofi },
  { id: 4, name: 'Энергия утра', genre: 'Хиты', tracks: 27, cover: COVERS.neon },
];

const navItems = ['Главная', 'Плеер', 'Каналы', 'Плейлисты', 'О радио', 'Контакты'];

const socials = [
  { name: 'ВКонтакте', icon: 'Share2', url: '#' },
  { name: 'Одноклассники', icon: 'Circle', url: '#' },
  { name: 'Макс', icon: 'MessageCircle', url: '#' },
];

const Equalizer = ({ active }: { active: boolean }) => (
  <div className="flex items-end gap-[3px] h-8">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <span
        key={i}
        className="w-1 rounded-full gradient-radio"
        style={{
          height: active ? undefined : '20%',
          animation: active ? `equalize ${0.6 + (i % 3) * 0.25}s ease-in-out infinite` : 'none',
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
);

const Index = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [current, setCurrent] = useState(channels[0]);
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('Все');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const genres = ['Все', 'Хиты', 'Ретро', 'Лаунж'];

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const saved = localStorage.getItem('mitya_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    const favs = localStorage.getItem('mitya_favorites');
    if (favs) {
      try { setFavorites(JSON.parse(favs)); } catch { /* ignore */ }
    }
  }, []);

  const handleAuth = (u: AuthUser, token: string) => {
    setUser(u);
    localStorage.setItem('mitya_user', JSON.stringify(u));
    localStorage.setItem('mitya_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mitya_user');
    localStorage.removeItem('mitya_token');
  };

  const toggleFavorite = (id: number) => {
    if (!user) { setAuthOpen(true); return; }
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('mitya_favorites', JSON.stringify(next));
      return next;
    });
  };

  const playChannel = (ch: typeof channels[0]) => {
    setCurrent(ch);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = ch.stream;
    setLoading(true);
    audio.play().then(() => { setPlaying(true); setLoading(false); }).catch(() => { setPlaying(false); setLoading(false); });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      if (!audio.src) audio.src = current.stream;
      setLoading(true);
      audio.play().then(() => { setPlaying(true); setLoading(false); }).catch(() => { setPlaying(false); setLoading(false); });
    }
  };

  const filteredChannels = useMemo(
    () =>
      channels.filter(
        (c) =>
          (activeGenre === 'Все' || c.genre === activeGenre) &&
          (c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.genre.toLowerCase().includes(query.toLowerCase()))
      ),
    [query, activeGenre]
  );

  const filteredPlaylists = useMemo(
    () =>
      playlists.filter(
        (p) =>
          (activeGenre === 'Все' || p.genre === activeGenre) &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.genre.toLowerCase().includes(query.toLowerCase()))
      ),
    [query, activeGenre]
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <audio ref={audioRef} preload="none" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onWaiting={() => setLoading(true)} onPlay={() => setLoading(true)} />

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-float-bg" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[120px] animate-float-bg" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/20 blur-[120px] animate-float-bg" style={{ animationDelay: '8s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <nav className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-radio flex items-center justify-center box-glow">
              <Icon name="Radio" className="text-white" size={24} />
            </div>
            <span className="font-display text-2xl font-bold tracking-wide">РАДИО <span className="gradient-text">МИТЯ</span></span>
          </div>
          <ul className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item}>
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors story-link">
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 glass rounded-full pl-1.5 pr-4 py-1.5 hover:border-primary/50 transition-all">
                    <span className="w-8 h-8 rounded-full gradient-radio flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                    <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-primary/30 rounded-2xl w-56">
                  <DropdownMenuLabel className="font-display">
                    {user.name}
                    <p className="text-xs text-muted-foreground font-body font-normal">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Icon name="Heart" size={16} /> Избранное ({favorites.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive">
                    <Icon name="LogOut" size={16} /> Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setAuthOpen(true)} variant="ghost" className="rounded-full font-medium hover:bg-muted hidden sm:flex">
                <Icon name="User" size={18} className="mr-2" />
                Войти
              </Button>
            )}
            <Button onClick={togglePlay} className="gradient-radio border-0 rounded-full font-semibold hover-scale">
              <Icon name={playing ? 'Pause' : 'Headphones'} size={18} className="mr-2" />
              {playing ? 'В эфире' : 'Слушать'}
            </Button>
          </div>
        </nav>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} onAuth={handleAuth} />

      {/* Hero */}
      <section className="relative z-10 container mx-auto pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-sm text-muted-foreground">radiomitya.ru · В эфире 24/7</span>
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-bold leading-none mb-6 animate-fade-in">
          РАДИО МИТЯ<br />
          <span className="gradient-text text-glow-pink">ЗВУЧИТ ДЛЯ ТЕБЯ</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
          Любимые хиты, ретро и лаунж без остановки. Включай эфир и слушай где угодно.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto animate-scale-in">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск каналов и плейлистов по названию или жанру..."
              className="h-14 pl-14 pr-5 rounded-full glass border-primary/30 text-base focus-visible:ring-primary"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeGenre === g
                    ? 'gradient-radio text-white box-glow'
                    : 'glass text-muted-foreground hover:text-foreground'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {!user && (
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 glass rounded-2xl px-5 py-3 animate-fade-in">
            <span className="text-sm text-muted-foreground">Зарегистрируйся и собирай любимые каналы в избранное</span>
            <Button onClick={() => setAuthOpen(true)} size="sm" className="rounded-full gradient-radio border-0 font-semibold">
              <Icon name="UserPlus" size={16} className="mr-1.5" /> Регистрация
            </Button>
          </div>
        )}
      </section>

      {/* Now Playing Player */}
      <section className="relative z-10 container mx-auto py-12">
        <div className="glass rounded-3xl p-6 md:p-8 box-glow max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <img
                src={current.cover}
                alt={current.name}
                className={`w-40 h-40 rounded-full object-cover ${playing ? 'animate-spin-slow' : ''}`}
              />
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-background flex items-center justify-center">
                <div className="w-4 h-4 rounded-full gradient-radio" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <p className="text-sm text-secondary font-medium mb-1">{current.genre} · {loading ? 'ЗАГРУЗКА…' : playing ? 'В ЭФИРЕ' : 'ПАУЗА'}</p>
              <h3 className="font-display text-3xl font-bold mb-4">{current.name}</h3>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-5">
                <Equalizer active={playing} />
                <span className="text-sm text-muted-foreground">
                  <Icon name="Users" size={14} className="inline mr-1" />
                  {current.listeners}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <Button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full gradient-radio border-0 box-glow hover-scale"
                >
                  <Icon name={loading ? 'Loader' : playing ? 'Pause' : 'Play'} size={28} className={`text-white ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <div className="flex items-center gap-2 ml-2 w-40">
                  <Icon name={volume === 0 ? 'VolumeX' : 'Volume2'} size={20} className="text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="relative z-10 container mx-auto py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl font-bold mb-1">КАНАЛЫ</h2>
            <p className="text-muted-foreground">Прямые эфиры на любой вкус</p>
          </div>
          <span className="text-sm text-secondary font-medium">{filteredChannels.length} найдено</span>
        </div>

        {filteredChannels.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-50" />
            Ничего не найдено по запросу «{query}»
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChannels.map((ch, i) => (
              <div
                key={ch.id}
                onClick={() => playChannel(ch)}
                className="group glass rounded-3xl p-5 cursor-pointer hover-scale transition-all hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="relative mb-4 overflow-hidden rounded-2xl">
                  <img src={ch.cover} alt={ch.name} className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span className="text-xs font-semibold">LIVE</span>
                  </div>
                  <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full gradient-radio flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity box-glow">
                    <Icon name="Play" size={20} className="text-white" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(ch.id); }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Icon
                      name="Heart"
                      size={18}
                      className={favorites.includes(ch.id) ? 'text-primary fill-primary' : 'text-white'}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold">{ch.name}</h3>
                    <p className="text-sm text-muted-foreground">{ch.genre}</p>
                  </div>
                  <span className="text-sm text-secondary flex items-center gap-1">
                    <Icon name="Users" size={14} />
                    {ch.listeners}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Playlists */}
      <section className="relative z-10 container mx-auto py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl font-bold mb-1">ПЛЕЙЛИСТЫ</h2>
            <p className="text-muted-foreground">Готовые подборки треков</p>
          </div>
          <span className="text-sm text-secondary font-medium">{filteredPlaylists.length} найдено</span>
        </div>

        {filteredPlaylists.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-50" />
            Ничего не найдено по запросу «{query}»
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlaylists.map((pl, i) => (
              <div
                key={pl.id}
                className="group glass rounded-3xl p-4 cursor-pointer hover-scale transition-all hover:border-secondary/50 animate-fade-in"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="relative mb-3 overflow-hidden rounded-2xl">
                  <img src={pl.cover} alt={pl.name} className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full gradient-radio flex items-center justify-center box-glow">
                      <Icon name="Play" size={24} className="text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold leading-tight">{pl.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Icon name="Music" size={13} />
                  {pl.tracks} треков · {pl.genre}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section className="relative z-10 container mx-auto py-16">
        <div className="glass rounded-3xl p-8 md:p-14 text-center max-w-4xl mx-auto box-glow">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-5">О РАДИО <span className="gradient-text">МИТЯ</span></h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Радио Митя — это музыка, которая всегда с тобой. Живые эфиры, любимые хиты и тёплая атмосфера круглые сутки на radiomitya.ru.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: '6', l: 'каналов' },
              { n: '47K', l: 'слушателей' },
              { n: '24/7', l: 'в эфире' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-4xl md:text-5xl font-bold gradient-text">{s.n}</div>
                <div className="text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts / Footer */}
      <footer className="relative z-10 container mx-auto py-12 border-t border-border mt-8">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-radio flex items-center justify-center">
                <Icon name="Radio" className="text-white" size={20} />
              </div>
              <span className="font-display text-xl font-bold">РАДИО <span className="gradient-text">МИТЯ</span></span>
            </div>
            <p className="text-muted-foreground text-sm">radiomitya.ru — твоё радио без границ. Слушай где угодно.</p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold mb-4">КОНТАКТЫ</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-center gap-2"><Icon name="Mail" size={16} /> hello@radiomitya.ru</li>
              <li className="flex items-center gap-2"><Icon name="Phone" size={16} /> +7 (999) 123-45-67</li>
              <li className="flex items-center gap-2"><Icon name="Globe" size={16} /> radiomitya.ru</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold mb-4">МЫ В СЕТИ</h4>
            <div className="flex flex-col gap-3">
              {socials.map((s) => (
                <a key={s.name} href={s.url} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                  <span className="w-10 h-10 rounded-full glass flex items-center justify-center group-hover:gradient-radio transition-all">
                    <Icon name={s.icon} size={18} />
                  </span>
                  <span className="text-sm">{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center text-muted-foreground text-sm">
          © 2026 Радио Митя · radiomitya.ru
        </div>
      </footer>
    </div>
  );
};

export default Index;