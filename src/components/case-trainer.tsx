'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowRight, Loader2, Check, X, CaseSensitive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchCaseQuiz, checkAnswer } from '@/lib/actions';
import type { GenerateCaseQuizOutput, IntelligentErrorCorrectionOutput } from '@/ai/schemas';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CaseTrainerProps {
  dictionary: Word[];
  onEndSession: () => void;
}

type Task = {
  id: string;
  preposition: string;
  noun: string;
  quiz: GenerateCaseQuizOutput;
};

type AnswerStatus = 'unanswered' | 'checking' | 'correct' | 'incorrect';

// Helper function to generate a task
const generateRandomTask = (dictionary: Word[]): { noun: string; preposition: string } | null => {
  const nouns = dictionary.filter(w => w.details.partOfSpeech === 'noun' && w.details.nounDetails);
  const prepositions = dictionary.filter(w => w.details.partOfSpeech === 'preposition' && w.details.prepositionDetails);

  if (nouns.length === 0 || prepositions.length === 0) {
    return null;
  }

  const nounWord = nouns[Math.floor(Math.random() * nouns.length)];
  const prepWord = prepositions[Math.floor(Math.random() * prepositions.length)];

  return {
    noun: nounWord.text,
    preposition: prepWord.text,
  };
};

const caseOptions: GenerateCaseQuizOutput['correctCase'][] = ["Nominativ", "Akkusativ", "Dativ", "Genitiv"];

export function CaseTrainer({ dictionary, onEndSession }: CaseTrainerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | undefined>(undefined);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [feedback, setFeedback] = useState<IntelligentErrorCorrectionOutput | null>(null);

  const loadNextTask = useCallback(async () => {
    setIsLoading(true);
    setTask(null);
    setInputValue('');
    setSelectedCase(undefined);
    setAnswerStatus('unanswered');
    setFeedback(null);

    const taskParams = generateRandomTask(dictionary);
    if (!taskParams) {
      setIsLoading(false);
      return;
    }

    const result = await fetchCaseQuiz(taskParams);
    if (result.success) {
      setTask({
        id: uuidv4(),
        noun: taskParams.noun,
        preposition: taskParams.preposition,
        quiz: result.data,
      });
    } else {
      console.error("Failed to generate task, trying again.");
      // Optionally show a toast and retry
      setTimeout(loadNextTask, 1000); // Retry after a second
    }
    setIsLoading(false);
  }, [dictionary]);

  useEffect(() => {
    loadNextTask();
  }, [loadNextTask]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onEndSession, 300);
  };

  const handleCheck = async () => {
    if (!task || !inputValue || !selectedCase) return;

    setAnswerStatus('checking');
    setFeedback(null);

    const result = await checkAnswer({
      word: task.noun,
      userInput: inputValue.trim(),
      wordType: 'preposition',
      practiceType: 'case-quiz',
      sentenceContext: task.quiz.sentence,
      expectedAnswer: task.quiz.correctAnswer,
      correctCase: task.quiz.correctCase,
      userCaseSelection: selectedCase,
    });

    if (result.success) {
      setFeedback(result.data);
      setAnswerStatus(result.data.isCorrect ? 'correct' : 'incorrect');
    } else {
      console.error(result.error);
      setAnswerStatus('unanswered');
      // You might want to show a toast here
    }
  };
  
  const isButtonDisabled = () => {
      if (answerStatus === 'unanswered') {
          return !inputValue.trim() || !selectedCase;
      }
      return false;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6 flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Генерируем задание...</p>
        </div>
      );
    }

    if (!task) {
      return (
        <div className="space-y-6 flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground text-center">
            Для этого упражнения вам нужны как минимум одно существительное и один предлог в словаре.
          </p>
          <Button onClick={handleClose}>Вернуться</Button>
        </div>
      );
    }

    return (
      <Card className="border-none shadow-none">
        <CardContent className="p-0 flex flex-col items-center gap-6">
          <div className="text-center w-full">
            <p className="text-muted-foreground">Заполните пропуск и выберите правильный падеж:</p>
            <h2 className="font-serif text-2xl my-2 bg-muted p-4 rounded-md">
              {task.quiz.sentence.split('____').map((part, index, arr) => 
                index === arr.length - 1 ? part : <>{part}<span className="font-bold text-primary">____</span></>
              )}
            </h2>
             <p className="text-sm text-muted-foreground">"{task.quiz.russianTranslation}"</p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (answerStatus === 'unanswered') {
                handleCheck();
              } else {
                loadNextTask();
              }
            }}
            className="w-full space-y-6"
          >
            <div>
                <Label className='text-muted-foreground ml-1 mb-2 block'>1. Выберите падеж</Label>
                <RadioGroup
                    value={selectedCase}
                    onValueChange={setSelectedCase}
                    className="grid grid-cols-2 gap-4"
                    disabled={answerStatus !== 'unanswered'}
                >
                    {caseOptions.map(caseName => (
                        <div key={caseName}>
                        <RadioGroupItem value={caseName} id={caseName} className="peer sr-only" />
                        <Label
                            htmlFor={caseName}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            {caseName}
                        </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
             <div>
                <Label className='text-muted-foreground ml-1 mb-2 block'>2. Впишите недостающее слово</Label>
                <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="der / dem / den..."
                    disabled={answerStatus !== 'unanswered'}
                    className="text-center text-lg h-12"
                    autoFocus
                />
            </div>
          </form>

          {answerStatus === 'checking' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

          {answerStatus !== 'unanswered' && answerStatus !== 'checking' && feedback && (
            <Alert
              variant={answerStatus === 'correct' ? 'default' : 'destructive'}
              className="animate-in fade-in-50 w-full"
            >
              {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Есть ошибка'}</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  <strong>Правильный ответ:</strong> <span className="font-mono p-1 bg-muted rounded-md">{task.quiz.correctAnswer}</span> (Падеж: <span className='font-semibold'>{task.quiz.correctCase}</span>)
                </p>
                <p className="font-bold mt-2">Объяснение:</p>
                <p>{feedback.explanation}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl flex flex-col p-0 gap-0 h-auto max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <CaseSensitive className="h-6 w-6 text-primary" />
            Тренажер падежей
          </DialogTitle>
          <DialogDescription>
            Практикуйтесь в определении правильного падежа после предлогов.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">{renderContent()}</div>

        <DialogFooter className="p-6 bg-muted/50 border-t flex-row justify-between items-center w-full">
            <Button variant="ghost" onClick={handleClose}>
                Завершить
            </Button>
            {answerStatus === 'unanswered' ? (
                <Button onClick={handleCheck} disabled={isButtonDisabled()}>
                    {answerStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Проверить
                </Button>
            ) : (
                <Button onClick={loadNextTask}>
                    Далее
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
