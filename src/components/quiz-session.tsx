"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkArticle } from '@/lib/actions';
import type { IntelligentErrorCorrectionOutput } from '@/ai/flows';

interface QuizSessionProps {
  words: Word[];
  onEndSession: () => void;
}

type AnswerState = {
    status: 'unanswered' | 'correct' | 'incorrect';
    feedback?: IntelligentErrorCorrectionOutput;
}

export function QuizSession({ words, onEndSession }: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<'der' | 'die' | 'das' | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});

  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);
  const currentAnswerState = useMemo(() => answerStates[currentWord.text] || { status: 'unanswered' }, [answerStates, currentWord.text]);
  const isAnswered = currentAnswerState.status !== 'unanswered';


  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedArticle(null);
    }
  }, [currentIndex, words.length]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedArticle(null);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onEndSession, 300);
  };
  
  const handleCheck = async () => {
      if (!selectedArticle || !currentWord) return;

      setIsChecking(true);
      const result = await checkArticle({
          word: currentWord.text,
          userInput: selectedArticle,
          wordType: 'noun'
      });

      if (result.success) {
          setAnswerStates(prev => ({
              ...prev,
              [currentWord.text]: {
                  status: result.data.isCorrect ? 'correct' : 'incorrect',
                  feedback: result.data
              }
          }));
      } else {
          // Handle error, maybe with a toast
          console.error(result.error);
      }
      setIsChecking(false);
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isAnswered && event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev, isAnswered]);

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 sm:h-auto h-screen">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl">Викторина по артиклям</DialogTitle>
          <DialogDescription>
            Выберите правильный артикль для каждого существительного.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0">
            <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                   <h2 className="font-headline text-5xl text-center">{currentWord.text}</h2>
                   <RadioGroup 
                        value={selectedArticle || undefined}
                        onValueChange={(value) => setSelectedArticle(value as any)}
                        className="flex gap-4"
                        disabled={isAnswered || isChecking}
                    >
                       <div className="flex items-center space-x-2">
                           <RadioGroupItem value="der" id="der" />
                           <Label htmlFor="der" className="text-xl font-bold text-chart-1 cursor-pointer">der</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                           <RadioGroupItem value="die" id="die" />
                           <Label htmlFor="die" className="text-xl font-bold text-chart-5 cursor-pointer">die</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                           <RadioGroupItem value="das" id="das" />
                           <Label htmlFor="das" className="text-xl font-bold text-chart-2 cursor-pointer">das</Label>
                       </div>
                   </RadioGroup>

                   {isChecking && <Loader2 className="h-6 w-6 animate-spin text-primary" />}

                   {isAnswered && currentAnswerState.feedback && (
                        <Alert variant={currentAnswerState.status === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50">
                            {currentAnswerState.status === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{currentAnswerState.status === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                {currentAnswerState.feedback.explanation}
                                {currentAnswerState.feedback.hint && <p className="mt-2 text-xs opacity-80"><strong>Подсказка:</strong> {currentAnswerState.feedback.hint}</p>}
                            </AlertDescription>
                        </Alert>
                   )}

                </CardContent>
            </Card>
        </div>

        <DialogFooter className="p-6 bg-muted/50 border-t flex-col sm:flex-col sm:space-x-0 items-center gap-4">
           <Progress value={progress} className="w-full h-2" />
           <div className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                <ArrowLeft className="h-4 w-4 mr-2"/>
                Назад
            </Button>
            <div className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {words.length}
            </div>
            {!isAnswered ? (
                <Button onClick={handleCheck} disabled={!selectedArticle || isChecking}>
                    {isChecking ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Проверить'}
                </Button>
            ) : (
                <Button onClick={handleNext} disabled={currentIndex === words.length - 1}>
                    Далее
                    <ArrowRight className="h-4 w-4 ml-2"/>
                </Button>
            )}
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
