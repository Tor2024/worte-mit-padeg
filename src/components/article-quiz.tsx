"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { provideIntelligentErrorCorrection } from '@/ai/flows/provide-intelligent-error-correction';
import type { IntelligentErrorCorrectionOutput } from '@/ai/flows/provide-intelligent-error-correction';

interface ArticleQuizProps {
    word: {
      text: string;
      type: 'noun';
      article: 'der' | 'die' | 'das';
    };
}

type QuizResult = IntelligentErrorCorrectionOutput;

export function ArticleQuiz({ word }: ArticleQuizProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<QuizResult | null>(null);
    const { toast } = useToast();
    const articles: Array<'der' | 'die' | 'das'> = ['der', 'die', 'das'];
    const [selected, setSelected] = useState<'der' | 'die' | 'das' | null>(null);

    const handleCheck = (selectedArticle: 'der' | 'die' | 'das') => {
        setSelected(selectedArticle);
        startTransition(async () => {
          try {
            const res = await provideIntelligentErrorCorrection({
              word: word.text,
              userInput: selectedArticle,
              wordType: 'noun',
              expectedArticle: word.article,
            });
            setResult(res);
          } catch (error) {
            console.error(error);
            toast({
                title: "Ошибка",
                description: "Не удалось проверить артикль.",
                variant: "destructive"
            })
          }
        });
    };
    
    const handleReset = () => {
        setResult(null);
        setSelected(null);
    };

    const getArticleColor = (article: 'der' | 'die' | 'das') => {
        if (article === 'der') return 'border-chart-1 hover:bg-chart-1/10 text-chart-1';
        if (article === 'die') return 'border-chart-5 hover:bg-chart-5/10 text-chart-5';
        if (article === 'das') return 'border-chart-2 hover:bg-chart-2/10 text-chart-2';
    };

    if (result) {
        return (
            <Card className="bg-transparent shadow-none border-none">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="font-headline text-xl">Результат викторины</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <Alert variant={result.isCorrect ? 'default' : 'destructive'} className={result.isCorrect ? 'border-accent bg-accent/10' : ''}>
                        {result.isCorrect ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle className={result.isCorrect ? 'text-accent' : ''}>{result.isCorrect ? 'Правильно!' : 'Не совсем...'}</AlertTitle>
                        <AlertDescription className={result.isCorrect ? 'text-accent/90' : ''}>
                            {result.explanation}
                            {result.hint && <p className="mt-2 text-sm"><strong>Подсказка:</strong> {result.hint}</p>}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={handleReset} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Попробовать еще раз
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-transparent shadow-none border-none">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="font-headline text-xl">Какой артикль правильный?</CardTitle>
                <CardDescription>
                    Выберите правильный артикль для <strong className="text-primary">{word.text}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {articles.map((article) => (
                        <Button
                            key={article}
                            size="lg"
                            variant="outline"
                            className={`w-full sm:w-28 h-16 text-xl font-bold transition-all duration-300 ${getArticleColor(article)}`}
                            onClick={() => handleCheck(article)}
                            disabled={isPending}
                        >
                            {isPending && selected === article ? <Loader2 className="h-6 w-6 animate-spin" /> : article}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
