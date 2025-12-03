import { Header } from '@/components/header';
import { WordManager } from '@/components/word-manager';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
        <WordManager />
      </main>
    </div>
  );
}
