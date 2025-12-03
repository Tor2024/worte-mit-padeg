"use client";

import { useState, useTransition } from 'react';
import type { Word } from '@/lib/types';
import { checkArticle } from '@/lib/actions';
import type { IntelligentErrorCorrectionOutput } from '@/ai/flows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArticleQuizProps {
    word: Word;
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
            const res = await checkArticle(word, selectedArticle);
            if (res.success) {
                setResult(res.data);
            } else {
                toast({
                    title: "Fehler",
                    description: res.error,
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
                    <CardTitle className="font-headline text-xl">Quiz Ergebnis</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <Alert variant={result.isCorrect ? 'default' : 'destructive'} className={result.isCorrect ? 'border-accent bg-accent/10' : ''}>
                        {result.isCorrect ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle className={result.isCorrect ? 'text-accent' : ''}>{result.isCorrect ? 'Richtig!' : 'Nicht ganz...'}</AlertTitle>
                        <AlertDescription className={result.isCorrect ? 'text-accent/90' : ''}>
                            {result.explanation}
                            {result.hint && <p className="mt-2 text-sm"><strong>Hinweis:</strong> {result.hint}</p>}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={handleReset} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Nochmal versuchen
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-transparent shadow-none border-none">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="font-headline text-xl">Welcher Artikel ist richtig?</CardTitle>
                <CardDescription>
                    Wählen Sie den korrekten Artikel für <strong className="text-primary">{word.text}</strong>.
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
