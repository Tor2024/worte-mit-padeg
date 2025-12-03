"use client";

import { useState, useTransition } from 'react';
import type { Word } from '@/lib/types';
import { getAiPractice } from '@/lib/actions';
import type { GenerateNewSentencesOutput } from '@/ai/flows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AiPracticeProps {
  word: Word;
}

export function AiPractice({ word }: AiPracticeProps) {
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState<GenerateNewSentencesOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await getAiPractice(word.text);
      if (result.success) {
        setContent(result.data);
      } else {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

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
        <CardTitle className="font-headline text-xl">KI-gestützte Übung</CardTitle>
        <CardDescription>
          Erstellen Sie neue Sätze und entdecken Sie verwandte Wörter, um Ihr Lernen zu vertiefen.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isPending && !content && (
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isPending && content && (
          <div className="space-y-6">
            <div className="space-y-3 rounded-md border bg-card p-4">
              <h3 className="font-semibold text-card-foreground">Neue Sätze</h3>
              <ul className="list-disc space-y-3 pl-5 text-card-foreground">
                {content.sentences.map((ex, i) => <li key={i}>{highlightWord(ex, word.text)}</li>)}
              </ul>
            </div>
            <div className="space-y-3 rounded-md border bg-card p-4">
              <h3 className="font-semibold text-card-foreground">Ähnliche Wörter</h3>
              <div className="flex flex-wrap gap-2">
                {content.relatedWords.map((rw, i) => (
                  <Badge key={i} variant="secondary">{rw}</Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Neue Übung generieren
            </Button>
          </div>
        )}
        {!content && !isPending && (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed h-64 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <p className="max-w-xs text-muted-foreground">Bereit für eine personalisierte Übung, die von KI unterstützt wird?</p>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Übung generieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
