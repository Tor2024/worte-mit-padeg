"use client";

import { useState, useEffect, useCallback, useMemo }from 'react';
import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchQuizQuestion } from '@/lib/actions';
import type { GenerateQuizQuestionOutput } from '@/ai/flows';
import { Skeleton } from './ui/skeleton';

interface MultipleChoiceQuizSessionProps {
  words: Word[];
  onEndSession: () => void;
}

type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

export function MultipleChoiceQuizSession({ words, onEndSession }: MultipleChoiceQuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<GenerateQuizQuestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  
  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);

  const loadQuestion = useCallback(async (word: Word) => {
    setIsLoading(true);
    setAnswerStatus('unanswered');
    setSelectedOption(null);
    setCurrentQuestion(null);
    const result = await fetchQuizQuestion({ word: word.text, details: word.details });
    if (result.success) {
      setCurrentQuestion(result.data);
    } else {
      // Handle error, maybe show a message and skip the word
      console.error(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (currentWord) {
      loadQuestion(currentWord);
    }
  }, [currentWord, loadQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, words.length]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onEndSession, 300);
  };
  
  const handleCheck = () => {
      if (!selectedOption || !currentQuestion) return;
      if (selectedOption === currentQuestion.correctAnswer) {
          setAnswerStatus('correct');
      } else {
          setAnswerStatus('incorrect');
      }
  }

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 sm:h-auto h-screen">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl">Тест</DialogTitle>
          <DialogDescription>
            Выберите правильный вариант ответа.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0">
          {isLoading || !currentQuestion ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
            <Card className="border-none shadow-none">
              <CardContent className="p-0 flex flex-col items-center gap-6">
                <h2 className="font-headline text-2xl text-center">{currentQuestion.question}</h2>
                <RadioGroup 
                  value={selectedOption || undefined}
                  onValueChange={setSelectedOption}
                  className="flex flex-col gap-3 w-full"
                  disabled={answerStatus !== 'unanswered'}
                >
                  {currentQuestion.options.map((option, index) => (
                    <Label 
                      key={index}
                      htmlFor={`option-${index}`}
                      className={`flex items-center space-x-3 rounded-md border p-4 transition-colors cursor-pointer ${answerStatus !== 'unanswered' ? 'cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}
                        ${answerStatus === 'correct' && option === currentQuestion.correctAnswer ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : ''}
                        ${answerStatus === 'incorrect' && option === selectedOption ? 'border-destructive bg-red-100 dark:bg-red-900/30' : ''}
                        ${answerStatus === 'incorrect' && option === currentQuestion.correctAnswer ? 'border-green-500' : ''}
                      `}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <span className="font-medium">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>

                {answerStatus === 'incorrect' && (
                  <Alert variant="destructive" className="animate-in fade-in-50 w-full">
                    <X className="h-4 w-4" />
                    <AlertTitle>Неправильно</AlertTitle>
                    <AlertDescription>
                      Правильный ответ: <strong>{currentQuestion.correctAnswer}</strong>
                    </AlertDescription>
                  </Alert>
                )}
                 {answerStatus === 'correct' && (
                  <Alert className="animate-in fade-in-50 w-full border-green-500 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Отлично!</AlertTitle>
                    <AlertDescription>
                      Вы выбрали правильный ответ.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/50 border-t flex-col sm:flex-col sm:space-x-0 items-center gap-4">
           <Progress value={progress} className="w-full h-2" />
           <div className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0 || isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2"/>
                Назад
            </Button>
            <div className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {words.length}
            </div>
            {answerStatus === 'unanswered' ? (
                <Button onClick={handleCheck} disabled={!selectedOption || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Проверить'}
                </Button>
            ) : (
                <Button onClick={handleNext} disabled={currentIndex === words.length - 1 || isLoading}>
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
