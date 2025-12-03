"use client";

import { useState, useTransition } from 'react';
import type { Word } from '@/lib/types';
import { LearningView } from '@/components/learning-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BookMarked, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWordDetails } from '@/lib/actions';

export function WordManager() {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleStartLearning = () => {
    if (!inputValue.trim()) {
      toast({
        title: "Пустой ввод",
        description: "Пожалуйста, введите слово для изучения.",
        variant: "destructive",
      });
      return;
    }
    
    startTransition(async () => {
      const result = await fetchWordDetails(inputValue.trim());
      if (result.success) {
        setCurrentWord({
          text: inputValue.trim(),
          details: result.data,
        });
      } else {
        toast({
          title: "Ошибка ИИ",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };
  
  const handleReset = () => {
    setCurrentWord(null);
    setInputValue('');
  };

  if (isPending) {
    return (
      <div className="w-full max-w-xl flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Анализируем слово...</p>
        <p className="text-sm text-muted-foreground">ИИ подбирает для вас лучшие материалы.</p>
      </div>
    );
  }

  if (currentWord) {
    return <LearningView word={currentWord} onReset={handleReset} />;
  }

  return (
    <div className="w-full max-w-xl">
        <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <BookMarked className="h-6 w-6 text-primary" />
                    Давайте выучим новое слово!
                </CardTitle>
                <CardDescription>
                    Введите немецкое слово или фразу, чтобы получить полную информацию для изучения.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleStartLearning(); }} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="word-input">Слово / Фраза</Label>
                        <Input 
                            id="word-input" 
                            placeholder="например, Haus, gehen, schön" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                    
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={!inputValue.trim() || isPending}
                    >
                        Начать обучение
                        <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
