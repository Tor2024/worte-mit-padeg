import { Logo } from '@/components/logo';

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
            Учим немецкие слова с Олегом
          </h1>
        </div>
        <div className="text-xs text-muted-foreground">
          Версия 11
        </div>
      </div>
    </header>
  );
}
