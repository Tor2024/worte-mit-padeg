'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ArrowRight, Loader2, Check, X, CaseSensitive, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchCaseQuiz, checkAnswer } from '@/lib/actions';
import type { GenerateCaseQuizOutput, IntelligentErrorCorrectionOutput } from '@/ai/schemas';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
type CaseName = 'Nominativ' | 'Akkusativ' | 'Dativ' | 'Genitiv';
type CaseStats = Record<CaseName, { correct: number; incorrect: number }>;

const CASE_STATS_KEY = 'german-case-stats';
const INITIAL_STATS: CaseStats = {
  Nominativ: { correct: 0, incorrect: 0 },
  Akkusativ: { correct: 0, incorrect: 0 },
  Dativ: { correct: 0, incorrect: 0 },
  Genitiv: { correct: 0, incorrect: 0 },
};

// Helper function to get stats from local storage
const getCaseStats = (): CaseStats => {
  try {
    const stats = localStorage.getItem(CASE_STATS_KEY);
    return stats ? JSON.parse(stats) : INITIAL_STATS;
  } catch (e) {
    return INITIAL_STATS;
  }
};

// Helper function to save stats to local storage
const saveCaseStats = (stats: CaseStats) => {
  try {
    localStorage.setItem(CASE_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save case stats", e);
  }
};

// This function is now outside the component to prevent it from being recreated on every render.
const generateAdaptiveTask = (dictionary: Word[], currentStats: CaseStats): { noun: string; preposition: string } | null => {
    const nouns = dictionary.filter(w => w.details.partOfSpeech === 'noun' && w.details.nounDetails);
    const prepositions = dictionary.filter(w => w.details.partOfSpeech === 'preposition' && w.details.prepositionDetails);

    if (nouns.length === 0 || prepositions.length === 0) {
      return null;
    }
    
    // Determine weights for each case based on performance
    const caseWeights: Record<CaseName, number> = {
        Nominativ: 1, // Lowest priority as it's less common in preposition quizzes
        Akkusativ: 5,
        Dativ: 5,
        Genitiv: 5,
    };

    let totalAttempts = 0;
    for (const caseName of Object.keys(currentStats) as CaseName[]) {
        const stats = currentStats[caseName];
        const attempts = stats.correct + stats.incorrect;
        totalAttempts += attempts;
        if (attempts > 0) {
            const errorRate = stats.incorrect / attempts;
            // Increase weight for cases with higher error rates. Max weight multiplier is 3 (for 100% error rate).
            caseWeights[caseName] *= (1 + 2 * errorRate);
        }
    }

    // If there are few attempts, increase randomness
    if (totalAttempts < 20) {
        Object.keys(caseWeights).forEach(c => caseWeights[c as CaseName] *= (Math.random() + 1));
    }


    // Select a case based on weights
    const totalWeight = Object.values(caseWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let targetCase: CaseName | null = null;
    for (const caseName of Object.keys(caseWeights) as CaseName[]) {
        random -= caseWeights[caseName];
        if (random <= 0) {
            targetCase = caseName;
            break;
        }
    }
    
    if (!targetCase) targetCase = 'Akkusativ'; // Fallback
    
    // Find a preposition that matches the target case
    let filteredPrepositions = prepositions.filter(p => {
        const pCase = p.details.prepositionDetails?.case;
        return pCase === targetCase || pCase === 'Wechselpräposition';
    });

    if (filteredPrepositions.length === 0) {
        // Fallback if no matching prepositions are found
        filteredPrepositions = prepositions;
    }

    const nounWord = nouns[Math.floor(Math.random() * nouns.length)];
    const prepWord = filteredPrepositions[Math.floor(Math.random() * filteredPrepositions.length)];

    return {
      noun: nounWord.text,
      preposition: prepWord.text,
    };
};

export function CaseTrainer({ dictionary, onEndSession }: CaseTrainerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | undefined>(undefined);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [feedback, setFeedback] = useState<IntelligentErrorCorrectionOutput | null>(null);
  const [caseStats, setCaseStats] = useState<CaseStats>(INITIAL_STATS);
  const { toast } = useToast();

  useEffect(() => {
      setCaseStats(getCaseStats());
  }, []);

  const updateCaseStats = (caseName: CaseName, isCorrect: boolean) => {
    setCaseStats(prevStats => {
        const newStats = { ...prevStats };
        if (isCorrect) {
          newStats[caseName].correct++;
        } else {
          newStats[caseName].incorrect++;
        }
        saveCaseStats(newStats);
        return newStats;
    });
  };
  
  const loadNextTask = useCallback(async () => {
    setIsLoading(true);
    setGenerationError(null);
    setTask(null);
    setInputValue('');
    setSelectedCase(undefined);
    setAnswerStatus('unanswered');
    setFeedback(null);

    // Read the latest stats directly instead of relying on state in dependencies
    const currentStats = getCaseStats();
    const taskParams = generateAdaptiveTask(dictionary, currentStats);

    if (!taskParams) {
      setGenerationError("Для этого упражнения вам нужны как минимум одно существительное и один предлог в словаре.");
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
      console.error("Failed to generate task:", result.error);
      setGenerationError("Не удалось создать задание. AI не смог составить корректное предложение. Попробуем еще раз.");
    }
    setIsLoading(false);
  }, [dictionary]);

  useEffect(() => {
    // This effect now runs only once when the component mounts
    loadNextTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const isCorrect = result.data.isCorrect;
      setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
      // Update stats based on whether the CASE was identified correctly
      updateCaseStats(task.quiz.correctCase, selectedCase === task.quiz.correctCase);
    } else {
      console.error(result.error);
      setAnswerStatus('unanswered');
      toast({
        title: "Ошибка проверки",
        description: "Не удалось проверить ваш ответ. Попробуйте снова.",
        variant: "destructive",
      });
    }
  };
  
  const isButtonDisabled = () => {
      if (generationError) return false;
      if (answerStatus === 'unanswered') {
          return !inputValue.trim() || !selectedCase;
      }
      return false;
  }

  const caseOptions: GenerateCaseQuizOutput['correctCase'][] = ["Nominativ", "Akkusativ", "Dativ", "Genitiv"];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6 flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Подбираем задание...</p>
        </div>
      );
    }

    if (generationError) {
      return (
        <div className="space-y-6 flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{generationError}</p>
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
              {task.quiz.sentence.split('____').map((part, index, arr) => (
                <span key={index}>{index === arr.length - 1 ? part : <>{part}<span className="font-bold text-primary">____</span></>}</span>
              ))}
            </h2>
             <p className="text-sm text-muted-foreground">"{task.quiz.russianTranslation}"</p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (answerStatus === 'unanswered' && !generationError) {
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

  const handleFooterButtonClick = () => {
    if (generationError) {
        loadNextTask();
        return;
    }

    if (answerStatus === 'unanswered') {
        handleCheck();
    } else {
        loadNextTask();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl flex flex-col p-0 gap-0 h-auto max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <CaseSensitive className="h-6 w-6 text-primary" />
            Тренажер падежей
          </DialogTitle>
          <DialogDescription>
            Практикуйтесь в определении правильного падежа после предлогов. Система адаптируется к вашим ошибкам.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">{renderContent()}</div>

        <DialogFooter className="p-6 bg-muted/50 border-t flex-row justify-between items-center w-full">
            <Button variant="ghost" onClick={handleClose}>
                Завершить
            </Button>
            <Button onClick={handleFooterButtonClick} disabled={answerStatus === 'checking' || (answerStatus === 'unanswered' && !generationError && (!inputValue.trim() || !selectedCase))}>
                {answerStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                {answerStatus === 'unanswered' && !generationError ? 'Проверить' : 'Далее'}
                {answerStatus !== 'unanswered' || generationError ? <ArrowRight className="h-4 w-4 ml-2" /> : null}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
