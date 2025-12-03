'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowRight, Loader2, Check, X, WandSparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { checkAdjectiveDeclension } from '@/lib/actions';
import type { AdjectivePracticeOutput } from '@/ai/schemas';

interface AdjectiveTrainerProps {
  dictionary: Word[];
  onEndSession: () => void;
}

type Task = {
  adjective: string;
  noun: string;
  nounArticle: 'der' | 'die' | 'das';
  targetCase: 'Nominativ' | 'Akkusativ' | 'Dativ' | 'Genitiv';
  articleType: 'definite' | 'indefinite';
  nominativeForm: string;
};

type AnswerStatus = 'unanswered' | 'checking' | 'correct' | 'incorrect';

// Helper function to generate a task
const generateTask = (dictionary: Word[]): Task | null => {
  const nouns = dictionary.filter(w => w.details.partOfSpeech === 'noun' && w.details.nounDetails);
  const adjectives = dictionary.filter(w => w.details.partOfSpeech === 'adjective');

  if (nouns.length === 0 || adjectives.length === 0) {
    return null;
  }

  const nounWord = nouns[Math.floor(Math.random() * nouns.length)];
  const adjWord = adjectives[Math.floor(Math.random() * adjectives.length)];
  const cases: Task['targetCase'][] = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'];
  const articleTypes: Task['articleType'][] = ['definite', 'indefinite'];

  const targetCase = cases[Math.floor(Math.random() * cases.length)];
  const articleType = articleTypes[Math.floor(Math.random() * articleTypes.length)];
  const nounDetails = nounWord.details.nounDetails!;

  return {
    adjective: adjWord.text,
    noun: nounWord.text,
    nounArticle: nounDetails.article,
    targetCase,
    articleType,
    nominativeForm: `${nounDetails.article} ${adjWord.text} ${nounWord.text}`,
  };
};

export function AdjectiveTrainer({ dictionary, onEndSession }: AdjectiveTrainerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [feedback, setFeedback] = useState<AdjectivePracticeOutput | null>(null);

  const loadNextTask = useCallback(() => {
    setTask(generateTask(dictionary));
    setInputValue('');
    setAnswerStatus('unanswered');
    setFeedback(null);
  }, [dictionary]);

  useEffect(() => {
    loadNextTask();
  }, [loadNextTask]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onEndSession, 300);
  };

  const handleCheck = async () => {
    if (!task || !inputValue) return;

    setAnswerStatus('checking');
    setFeedback(null);

    const result = await checkAdjectiveDeclension({
      ...task,
      userInput: inputValue.trim(),
    });

    if (result.success) {
      setFeedback(result.data);
      setAnswerStatus(result.data.isCorrect ? 'correct' : 'incorrect');
    } else {
      console.error(result.error);
      // You might want to show a toast here
      setAnswerStatus('unanswered');
    }
  };

  const renderContent = () => {
    if (!task) {
      return (
        <div className="space-y-6 flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground text-center">
            Для этого упражнения вам нужны как минимум одно существительное и одно прилагательное в словаре.
          </p>
          <Button onClick={handleClose}>Вернуться</Button>
        </div>
      );
    }

    return (
      <Card className="border-none shadow-none">
        <CardContent className="p-0 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-muted-foreground">Поставьте фразу в нужную форму:</p>
            <h2 className="font-headline text-2xl my-2">
              <span className="font-normal text-muted-foreground">({task.nominativeForm})</span>
            </h2>
            <p className="font-semibold text-lg">
              Падеж: <span className="text-primary">{task.targetCase}</span>, Артикль: <span className="text-primary">{task.articleType === 'definite' ? 'Определенный' : 'Неопределенный'}</span>
            </p>
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
            className="w-full"
          >
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Введите ответ..."
              disabled={answerStatus !== 'unanswered'}
              className="text-center text-lg h-12"
              autoFocus
            />
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
                  <strong>Правильный ответ:</strong> <span className="font-mono p-1 bg-muted rounded-md">{feedback.correctAnswer}</span>
                </p>
                <p className="font-bold mt-2">Объяснение:</p>
                <p>{feedback.explanation}</p>
                {feedback.examples && feedback.examples.length > 0 && (
                  <div className="pt-2">
                    <p className="font-bold">Примеры:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {feedback.examples.map((ex, i) => (
                        <li key={i}>
                          <p className="text-sm">{ex.sentence}</p>
                          <p className="text-xs text-muted-foreground">{ex.translation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
            <WandSparkles className="h-6 w-6 text-primary" />
            Тренажер прилагательных
          </DialogTitle>
          <DialogDescription>
            Практикуйте склонение прилагательных в разных падежах.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">{renderContent()}</div>

        <DialogFooter className="p-6 bg-muted/50 border-t flex-row justify-between items-center w-full">
            <Button variant="ghost" onClick={handleClose}>
                Завершить
            </Button>
            {answerStatus === 'unanswered' ? (
                <Button onClick={handleCheck} disabled={!inputValue || answerStatus === 'checking'}>
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
