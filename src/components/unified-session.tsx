"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LearningView } from '@/components/learning-view';
import { fetchQuizQuestion, checkArticle } from '@/lib/actions';
import type { GenerateQuizQuestionOutput, IntelligentErrorCorrectionOutput } from '@/ai/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getNextReviewDate } from '@/lib/srs';


interface UnifiedSessionProps {
  words: Word[];
  onEndSession: () => void;
  onWordUpdate: (word: Word) => void;
}

type SessionView = 'loading' | 'flashcard' | 'multiple-choice' | 'article-quiz' | 'verb-practice';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
type VerbPracticeType = 'perfect' | 'prateritum';

const formatCaseName = (caseName: string): string => {
    switch (caseName) {
        case 'Akkusativ': return 'Винительный падеж (Akkusativ)';
        case 'Dativ': return 'Дательный падеж (Dativ)';
        case 'Genitiv': return 'Родительный падеж (Genitiv)';
        case 'Wechselpräposition': return 'Предлог двойного управления (Wechselpräposition)';
        default: return caseName;
    }
};

export function UnifiedSession({ words, onEndSession, onWordUpdate }: UnifiedSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [view, setView] = useState<SessionView>('loading');
  const [quizData, setQuizData] = useState<GenerateQuizQuestionOutput | IntelligentErrorCorrectionOutput | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // For radio/multiple choice
  const [inputValue, setInputValue] = useState(''); // For verb practice input
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [verbPracticeType, setVerbPracticeType] = useState<VerbPracticeType>('perfect');
  
  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);

  const determineNextView = useCallback((word: Word): SessionView => {
    if (word.repetitions < 1) {
      return 'flashcard';
    }
    
    if (word.details.partOfSpeech === 'noun' && word.easeFactor < 2.8 && Math.random() > 0.4) {
      return 'article-quiz';
    }
    
    if (word.details.partOfSpeech === 'verb' && word.easeFactor < 3.0 && Math.random() > 0.3) {
        return 'verb-practice';
    }

    return 'multiple-choice';
  }, []);

  const loadView = useCallback(async (word: Word) => {
    setView('loading');
    setAnswerStatus('unanswered');
    setSelectedOption(null);
    setInputValue('');
    setQuizData(null);
    
    const nextView = determineNextView(word);

    if (nextView === 'flashcard') {
      setView('flashcard');
    } else if (nextView === 'multiple-choice') {
      const result = await fetchQuizQuestion({ word: word.text, details: word.details });
      if (result.success && result.data.options.length > 0) {
        setQuizData(result.data);
        setView('multiple-choice');
      } else {
        if (!result.success) {
          console.error(result.error);
        }
        setView('flashcard'); // Fallback to flashcard on error or empty options
      }
    } else if (nextView === 'article-quiz') {
      setView('article-quiz');
    } else if (nextView === 'verb-practice') {
      // Randomly pick which verb form to practice
      setVerbPracticeType(Math.random() > 0.5 ? 'perfect' : 'prateritum');
      setView('verb-practice');
    }
  }, [determineNextView]);

  useEffect(() => {
    if (currentWord) {
      loadView(currentWord);
    }
  }, [currentWord, loadView]);
  
  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
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
  
  const handleCheck = async () => {
      if (!currentWord || (view !== 'verb-practice' && !selectedOption) || (view === 'verb-practice' && !inputValue)) return;

      let isCorrect = false;
      
      if (view === 'multiple-choice' && selectedOption) {
          const question = quizData as GenerateQuizQuestionOutput;
          isCorrect = selectedOption === question.correctAnswer;
          setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
      } else if (view === 'article-quiz' && selectedOption) {
          const result = await checkArticle({
              word: currentWord.text,
              userInput: selectedOption,
              wordType: 'noun',
              expectedArticle: currentWord.details.nounDetails?.article
          });
          if (result.success) {
              setQuizData(result.data);
              isCorrect = result.data.isCorrect;
              setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
          } else {
              console.error(result.error);
              setAnswerStatus('incorrect');
          }
      } else if (view === 'verb-practice' && inputValue) {
          const expectedAnswer = verbPracticeType === 'perfect' 
              ? currentWord.details.verbDetails?.perfect 
              : currentWord.details.verbDetails?.prateritum;

          const result = await checkArticle({ // re-using the same action, it's now more generic
              word: currentWord.text,
              userInput: inputValue.trim(),
              wordType: 'verb',
              practiceType: verbPracticeType,
              expectedAnswer: expectedAnswer,
          });

          if (result.success) {
              setQuizData(result.data);
              isCorrect = result.data.isCorrect;
              setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
          } else {
              console.error(result.error);
              setAnswerStatus('incorrect');
          }
      }
      
      const quality = isCorrect ? 5 : 2; // 5 for correct, 2 for incorrect
      const newSrsData = getNextReviewDate(currentWord, quality);
      onWordUpdate({ ...currentWord, ...newSrsData });
  }

  const progress = ((currentIndex + 1) / words.length) * 100;
  
  const renderContent = () => {
    if (view === 'loading' || !currentWord) {
      return (
          <div className="space-y-6 flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Подбираем задание...</p>
          </div>
      )
    }
    
    if (view === 'flashcard') {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                    <LearningView word={currentWord} />
                </div>
                <div className="mt-4 pt-4 border-t flex justify-around">
                    <Button size="lg" variant="destructive" onClick={() => {
                        const newSrsData = getNextReviewDate(currentWord, 1);
                        onWordUpdate({ ...currentWord, ...newSrsData });
                        handleNext();
                    }}>Не помню</Button>
                    <Button size="lg" variant="secondary" onClick={() => {
                        const newSrsData = getNextReviewDate(currentWord, 3);
                        onWordUpdate({ ...currentWord, ...newSrsData });
                        handleNext();
                    }}>Помню</Button>
                    <Button size="lg" onClick={() => {
                        const newSrsData = getNextReviewDate(currentWord, 5);
                        onWordUpdate({ ...currentWord, ...newSrsData });
                        handleNext();
                    }}>Легко!</Button>
                </div>
            </div>
        )
    }
    
    if (view === 'article-quiz') {
        const feedback = quizData as IntelligentErrorCorrectionOutput;
        return (
            <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                   <h2 className="font-headline text-5xl text-center">{currentWord.text}</h2>
                   <RadioGroup 
                        value={selectedOption || undefined}
                        onValueChange={(value) => setSelectedOption(value as any)}
                        className="flex gap-4"
                        disabled={answerStatus !== 'unanswered'}
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

                   {answerStatus !== 'unanswered' && feedback && (
                        <Alert variant={answerStatus === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                {feedback.explanation}
                                {feedback.hint && <p className="mt-2 text-sm"><strong>Подсказка:</strong> {feedback.hint}</p>}
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }

    if (view === 'verb-practice') {
        const feedback = quizData as IntelligentErrorCorrectionOutput;
        const practiceTypeText = verbPracticeType === 'perfect' ? 'Perfekt' : 'Präteritum';
        return (
             <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                    <h2 className="font-headline text-2xl text-center">
                        Напишите форму <strong>{practiceTypeText}</strong> для глагола <strong className="text-primary">{currentWord.text}</strong>
                    </h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleCheck(); }} className="w-full">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`например, ${verbPracticeType === 'perfect' ? 'hat gemacht' : 'machte'}`}
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            autoFocus
                        />
                    </form>

                     {answerStatus !== 'unanswered' && feedback && (
                        <Alert variant={answerStatus === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                {feedback.explanation}
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }
    
    if (view === 'multiple-choice') {
        const question = quizData as GenerateQuizQuestionOutput;
        if (!question) {
            return (
                <div className="space-y-6 flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Создаем вопрос...</p>
                </div>
            )
        }
        
        const isCaseQuestion = question.questionType === 'case';
        
        return (
             <Card className="border-none shadow-none">
              <CardContent className="p-0 flex flex-col items-center gap-6">
                <h2 className="font-headline text-2xl text-center">{question.question}</h2>
                <RadioGroup 
                  value={selectedOption || undefined}
                  onValueChange={setSelectedOption}
                  className="flex flex-col gap-3 w-full"
                  disabled={answerStatus !== 'unanswered'}
                >
                  {question.options.map((option, index) => (
                    <Label 
                      key={index}
                      htmlFor={`option-${index}`}
                      className={`flex items-center space-x-3 rounded-md border p-4 transition-colors cursor-pointer ${answerStatus !== 'unanswered' ? 'cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}
                        ${answerStatus === 'correct' && option === question.correctAnswer ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : ''}
                        ${answerStatus === 'incorrect' && option === selectedOption ? 'border-destructive bg-red-100 dark:bg-red-900/30' : ''}
                        ${answerStatus === 'incorrect' && option === question.correctAnswer ? 'border-green-500' : ''}
                      `}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <span className="font-medium">{isCaseQuestion ? formatCaseName(option) : option}</span>
                    </Label>
                  ))}
                </RadioGroup>

                {answerStatus === 'incorrect' && (
                  <Alert variant="destructive" className="animate-in fade-in-50 w-full">
                    <X className="h-4 w-4" />
                    <AlertTitle>Неправильно</AlertTitle>
                    <AlertDescription>
                      Правильный ответ: <strong>{isCaseQuestion ? formatCaseName(question.correctAnswer) : question.correctAnswer}</strong>
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
        )
    }

    return null;
  }

  const isQuiz = view === 'multiple-choice' || view === 'article-quiz' || view === 'verb-practice';
  const showNextButton = !isQuiz || (isQuiz && answerStatus !== 'unanswered');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 h-[640px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl">Сессия обучения</DialogTitle>
          <DialogDescription>
            {currentWord?.text ? `Слово: ${currentWord.text}`: 'Загрузка...'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0">
          {renderContent()}
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

            {!showNextButton && (
                <Button onClick={handleCheck} disabled={view !== 'verb-practice' ? !selectedOption : !inputValue}>
                    Проверить
                </Button>
            )}

            {showNextButton && (
                <Button onClick={handleNext}>
                    {currentIndex === words.length - 1 ? 'Завершить' : 'Далее'}
                    <ArrowRight className="h-4 w-4 ml-2"/>
                </Button>
            )}
        </div>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
}
