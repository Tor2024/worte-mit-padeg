"use client";

import { useState, useTransition, useEffect } from 'react';
import type { Word } from '@/lib/types';
import { getUsageExamples } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UsageExamplesProps {
  word: Word;
}

export function UsageExamples({ word }: UsageExamplesProps) {
  const [isPending, startTransition] = useTransition();
  const [examples, setExamples] = useState<string[] | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await getUsageExamples(word.text);
      if (result.success) {
        setExamples(result.data);
      } else {
        toast({
            title: "Fehler",
            description: result.error,
            variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    handleGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.text]);

  const highlightWord = (sentence: string, wordToHighlight: string) => {
    const regex = new RegExp(`(\\b${wordToHighlight}\\b)`, 'gi');
    return sentence.split(regex).map((part, index) =>
      part.toLowerCase() === wordToHighlight.toLowerCase() ? (
        <strong key={index} className="text-accent-foreground bg-accent/20 px-1 py-0.5 rounded-md">{part}</strong>
      ) : (
        part
      )
    );
  };

  return (
    <Card className="bg-transparent shadow-none border-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="font-headline text-xl">Anwendungsbeispiele</CardTitle>
        <CardDescription>
          Sehen Sie, wie "{word.text}" in Sätzen verwendet wird, die von KI generiert wurden.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isPending && !examples && (
            <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )}
        {!isPending && examples && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-md border bg-card p-4">
              <ul className="list-disc space-y-3 pl-5 text-card-foreground">
                {examples.map((ex, i) => <li key={i}>{highlightWord(ex, word.text)}</li>)}
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Neue Beispiele generieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
