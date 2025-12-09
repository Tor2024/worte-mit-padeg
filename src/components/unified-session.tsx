"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LearningView } from '@/components/learning-view';
import { fetchQuizQuestion, checkAnswer, checkRecallAnswer, fetchFillInTheBlank } from '@/lib/actions';
import type { GenerateQuizQuestionOutput, QuizQuestion, IntelligentErrorCorrectionOutput, CheckRecallOutput, GenerateFillInTheBlankOutput } from '@/ai/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getNextReviewDate } from '@/lib/srs';
import { useToast } from '@/hooks/use-toast';


interface UnifiedSessionProps {
  words: Word[];
  onEndSession: () => void;
  onWordUpdate: (word: Word) => void;
}

type SessionView = 'loading' | 'flashcard' | 'multiple-choice' | 'article-quiz' | 'verb-practice' | 'recall-quiz' | 'fill-in-the-blank';
type AnswerStatus = 'unanswered' | 'checking' | 'correct' | 'incorrect' | 'synonym';
type VerbPracticeType = 'perfect';

type FeedbackType = IntelligentErrorCorrectionOutput | CheckRecallOutput | null;

const formatCaseName = (caseName: string): string => {
    switch (caseName) {
        case 'Akkusativ': return 'Винительный падеж (Akkusativ)';
        case 'Dativ': return 'Дательный падеж (Dativ)';
        case 'Genitiv': return 'Родительный падеж (Genitiv)';
        case 'Wechselpräposition': return 'Предлог двойного управления (Wechselpräposition)';
        default: return caseName;
    }
};

const getPartOfSpeechRussian = (pos: string) => {
    switch (pos) {
      case 'noun': return 'существительное';
      case 'verb': return 'глагол';
      case 'adjective': return 'прилагательное';
      case 'adverb': return 'наречие';
      case 'preposition': return 'предлог';
      case 'conjunction': return 'союз';
      default: return 'другое';
    }
}

export function UnifiedSession({ words, onEndSession, onWordUpdate }: UnifiedSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [view, setView] = useState<SessionView>('loading');
  const [quizData, setQuizData] = useState<GenerateFillInTheBlankOutput | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [verbPracticeType, setVerbPracticeType] = useState<VerbPracticeType>('perfect');
  const { toast } = useToast();
  
  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);

  const determineNextView = useCallback((word: Word): SessionView => {
    // First time seeing the word? Always flashcard.
    if (word.repetitions === 0 && word.interval < 1) {
      return 'flashcard';
    }

    const availableViews: SessionView[] = [];
    const weights: { [key in SessionView]?: number } = {};
    
    // Recall is a good default for learned words
    availableViews.push('recall-quiz');
    weights['recall-quiz'] = 0.4;

    // Fill in the blank is also a great option
    availableViews.push('fill-in-the-blank');
    weights['fill-in-the-blank'] = 0.4;
    
    // Multiple choice is less effective but good for variety
    availableViews.push('multiple-choice');
    weights['multiple-choice'] = 0.2;

    if (word.details.partOfSpeech === 'noun') {
        availableViews.push('article-quiz');
        weights['article-quiz'] = 0.3; // Give article quiz a decent chance
    }
    
    if (word.details.partOfSpeech === 'verb' && word.details.verbDetails?.perfect) {
        availableViews.push('verb-practice');
        weights['verb-practice'] = 0.35; // And perfect tense practice
    }

    // Weighted random selection
    const totalWeight = availableViews.reduce((sum, view) => sum + (weights[view] || 0), 0);
    let random = Math.random() * totalWeight;

    for (const view of availableViews) {
        random -= (weights[view] || 0);
        if (random <= 0) {
            return view;
        }
    }

    // Fallback if something goes wrong
    return 'recall-quiz';
  }, []);

  const loadView = useCallback(async (word: Word) => {
    setView('loading');
    setAnswerStatus('unanswered');
    setSelectedOption(null);
    setInputValue('');
    setQuizData(null);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setFeedback(null);
    
    const nextView = determineNextView(word);

    try {
        if (nextView === 'flashcard') {
            setView('flashcard');
        } else if (nextView === 'multiple-choice') {
            const result = await fetchQuizQuestion({ word: word.text, details: word.details });
            if (result.success && result.data.length > 0) {
                setQuizQuestions(result.data);
                setView('multiple-choice');
            } else {
                throw new Error(result.success === false ? result.error : "AI failed to generate questions.");
            }
        } else if (nextView === 'article-quiz') {
            setView('article-quiz');
        } else if (nextView === 'verb-practice') {
            setVerbPracticeType('perfect');
            setView('verb-practice');
        } else if (nextView === 'recall-quiz') {
            setView('recall-quiz');
        } else if (nextView === 'fill-in-the-blank') {
            const example = word.details.examples[Math.floor(Math.random() * word.details.examples.length)];
            const result = await fetchFillInTheBlank({ word: word.text, partOfSpeech: word.details.partOfSpeech, example });
            if (result.success) {
                setQuizData(result.data);
                setView('fill-in-the-blank');
            } else {
                throw new Error(result.success === false ? result.error : "AI failed to generate a sentence.");
            }
        }
    } catch (error: any) {
        console.error("Error loading view:", error);
        toast({
            title: "Ошибка загрузки задания",
            description: error.message || "Не удалось создать упражнение. Показываю обычную карточку.",
            variant: "destructive"
        });
        setView('flashcard'); // Fallback to flashcard on any error
    }
  }, [determineNextView, toast]);

  useEffect(() => {
    if (currentWord) {
      loadView(currentWord);
    }
  }, [currentWord, loadView]);
  
  const handleNext = (quality: number) => {
    const newSrsData = getNextReviewDate(currentWord, quality);

    let newLearningStatus = currentWord.details.learningStatus;
    if (quality >= 4) {
      newLearningStatus = 'learned';
    } else if (quality >= 2) {
      newLearningStatus = 'in_progress';
    }

    const updatedWord = {
      ...currentWord,
      ...newSrsData,
      details: {
        ...currentWord.details,
        learningStatus: newLearningStatus,
      },
    };

    onWordUpdate(updatedWord);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };
  
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
    const isInputBased = ['verb-practice', 'recall-quiz', 'fill-in-the-blank'].includes(view);
    if (answerStatus === 'checking' || !currentWord || (isInputBased && !inputValue) || (!isInputBased && !selectedOption)) return;

    setAnswerStatus('checking');
    setFeedback(null);

    let result;
    try {
        if (view === 'multiple-choice') {
            const question = quizQuestions[currentQuestionIndex];
            if (!question) return;
            const isCorrect = selectedOption === question.correctAnswer;
            setFeedback({
                isCorrect: isCorrect,
                explanation: isCorrect ? "Все верно!" : `Правильный ответ: ${question.correctAnswer}`
            } as IntelligentErrorCorrectionOutput);
            setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
            return;
        } else if (view === 'article-quiz') {
            result = await checkAnswer({
                word: currentWord.text,
                userInput: selectedOption!,
                practiceType: 'article',
                expectedAnswer: currentWord.details.nounDetails?.article
            });
            if (result.success) {
                setFeedback(result.data);
                setAnswerStatus(result.data.isCorrect ? 'correct' : 'incorrect');
            } else { throw new Error(result.error); }
        } else if (view === 'verb-practice') {
            const expectedAnswer = currentWord.details.verbDetails?.perfect;
            result = await checkAnswer({
                word: currentWord.text,
                userInput: inputValue.trim(),
                practiceType: verbPracticeType,
                expectedAnswer: expectedAnswer,
            });
            if (result.success) {
                setFeedback(result.data);
                setAnswerStatus(result.data.isCorrect ? 'correct' : 'incorrect');
            } else { throw new Error(result.error); }
        } else if (view === 'recall-quiz') {
            result = await checkRecallAnswer({
                russianWord: currentWord.details.translation,
                germanWord: currentWord.text,
                partOfSpeech: currentWord.details.partOfSpeech,
                article: currentWord.details.nounDetails?.article,
                userInput: inputValue.trim(),
            });
             if (result.success) {
                setFeedback(result.data);
                setAnswerStatus(result.data.isSynonym ? 'synonym' : (result.data.isCorrect ? 'correct' : 'incorrect'));
            } else { throw new Error(result.error); }
        } else if (view === 'fill-in-the-blank') {
            const blankQuiz = quizData as GenerateFillInTheBlankOutput;
            result = await checkAnswer({
                word: currentWord.text,
                userInput: inputValue.trim(),
                practiceType: 'fill-in-the-blank',
                expectedAnswer: blankQuiz.correctAnswer,
                sentenceContext: blankQuiz.sentenceWithBlank,
            });
            if (result.success) {
                setFeedback(result.data);
                setAnswerStatus(result.data.isCorrect ? 'correct' : 'incorrect');
            } else { throw new Error(result.error); }
        }

    } catch (error: any) {
        console.error("Error during check:", error);
        toast({
            title: "Ошибка проверки",
            description: error.message || "Не удалось проверить ответ. Возможно, вы превысили лимит запросов к AI. Попробуйте через минуту.",
            variant: "destructive"
        });
        setAnswerStatus('unanswered'); // Re-enable check button on error
    }
}

  const progress = ((currentIndex) / words.length) * 100;
  
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
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-3">
                    <Button size="lg" variant="destructive" onClick={() => handleNext(1)}>Не помню</Button>
                    <Button size="lg" variant="secondary" onClick={() => handleNext(3)}>Помню</Button>
                    <Button size="lg" onClick={() => handleNext(5)}>Легко!</Button>
                </div>
            </div>
        )
    }
    
    if (view === 'article-quiz') {
        const currentFeedback = feedback as IntelligentErrorCorrectionOutput | null;
        return (
            <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                   <h3 className="text-lg text-muted-foreground">Какой артикль у слова:</h3>
                   <h2 className="font-headline text-5xl text-center">{currentWord.text}</h2>
                   <RadioGroup 
                        value={selectedOption || undefined}
                        onValueChange={setSelectedOption}
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

                   {answerStatus === 'checking' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

                   {answerStatus !== 'unanswered' && answerStatus !== 'checking' && currentFeedback && (
                        <Alert variant={answerStatus === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                {currentFeedback.explanation}
                                {currentFeedback.hint && <p className="mt-2 text-sm"><strong>Подсказка:</strong> {currentFeedback.hint}</p>}
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }

    if (view === 'verb-practice') {
        const currentFeedback = feedback as IntelligentErrorCorrectionOutput | null;
        const practiceTypeText = verbPracticeType === 'perfect' ? 'Perfekt' : 'Präteritum';
        return (
             <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                    <h2 className="font-headline text-2xl text-center">
                        Напишите форму <strong>{practiceTypeText}</strong> для глагола <strong className="text-primary">{currentWord.text}</strong>
                    </h2>
                    <form onSubmit={(e) => { e.preventDefault(); if (answerStatus === 'unanswered') handleCheck(); }} className="w-full">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`например, ${verbPracticeType === 'perfect' ? 'hat gemacht' : 'machte'}`}
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            autoFocus
                        />
                    </form>

                    {answerStatus === 'checking' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

                     {answerStatus !== 'unanswered' && answerStatus !== 'checking' && currentFeedback && (
                        <Alert variant={answerStatus === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                {currentFeedback.explanation}
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }

     if (view === 'recall-quiz') {
        const currentFeedback = feedback as CheckRecallOutput | null;
        return (
             <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                    <h2 className="font-headline text-2xl text-center">
                        Как по-немецки будет...
                    </h2>
                    <h3 className="font-headline text-4xl text-primary text-center">
                        {currentWord.details.translation}
                    </h3>
                     <p className="text-sm text-muted-foreground">({getPartOfSpeechRussian(currentWord.details.partOfSpeech)})</p>
                    <form onSubmit={(e) => { e.preventDefault(); if (answerStatus === 'unanswered') handleCheck(); }} className="w-full">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={currentWord.details.partOfSpeech === 'noun' ? 'der/die/das + cуществительное' : 'Введите перевод...'}
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            autoFocus
                        />
                    </form>
                    
                    {answerStatus === 'checking' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

                     {answerStatus !== 'unanswered' && answerStatus !== 'checking' && currentFeedback && (
                        <Alert variant={answerStatus === 'incorrect' ? 'destructive' : 'default'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : (answerStatus === 'synonym' ? <RefreshCw className="h-4 w-4"/> : <X className="h-4 w-4" />) }
                            <AlertTitle>
                              {answerStatus === 'correct' && 'Правильно!'}
                              {answerStatus === 'incorrect' && 'Не совсем'}
                              {answerStatus === 'synonym' && 'Тоже верно!'}
                            </AlertTitle>
                            <AlertDescription>
                                <p>{currentFeedback.explanation}</p>
                                {answerStatus !== 'incorrect' && (
                                    <p className="text-xs mt-2">Основной ответ: <strong>{currentFeedback.correctAnswer}</strong></p>
                                )}
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }

    if (view === 'fill-in-the-blank') {
        const blankQuiz = quizData as GenerateFillInTheBlankOutput;
        const currentFeedback = feedback as IntelligentErrorCorrectionOutput | null;

        if (!blankQuiz?.sentenceWithBlank) {
            return (
                <div className="space-y-6 flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Создаем упражнение...</p>
                </div>
            )
        }

        return (
            <Card className="border-none shadow-none">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                    <h2 className="font-headline text-2xl text-center">Заполните пропуск:</h2>
                    <p className="text-xl text-center font-serif bg-muted p-4 rounded-md w-full">
                        {blankQuiz.sentenceWithBlank.split('______').map((part, index, arr) => 
                            index === arr.length - 1 ? part : <>{part}<span className="font-bold text-primary">______</span></>
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground text-center">"{blankQuiz.russianTranslation}"</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); if (answerStatus === 'unanswered') handleCheck(); }} className="w-full">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Введите пропущенное слово"
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            autoFocus
                        />
                    </form>

                    {answerStatus === 'checking' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

                     {answerStatus !== 'unanswered' && answerStatus !== 'checking' && currentFeedback && (
                        <Alert variant={answerStatus === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                <p>{currentFeedback.explanation}</p>
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }
    
    if (view === 'multiple-choice') {
        const question = quizQuestions[currentQuestionIndex];
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
                        ${answerStatus !== 'unanswered' && option === question.correctAnswer ? 'border-green-500' : ''}
                      `}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <span className="font-medium">{isCaseQuestion ? formatCaseName(option) : option}</span>
                    </Label>
                  ))}
                </RadioGroup>

                {answerStatus === 'checking' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

              </CardContent>
            </Card>
        )
    }

    return null;
  }

  const handleFooterButton = () => {
      if (answerStatus === 'unanswered') {
          handleCheck();
      } else {
          if (view === 'multiple-choice' && currentQuestionIndex < quizQuestions.length - 1) {
              // Move to the next question in the same word's quiz
              setCurrentQuestionIndex(prev => prev + 1);
              setAnswerStatus('unanswered');
              setSelectedOption(null);
              setFeedback(null);
          } else {
              // Last question or not a quiz, move to the next word
              let quality: number;
              if (view === 'multiple-choice') {
                  const question = quizQuestions[currentQuestionIndex];
                  quality = selectedOption === question?.correctAnswer ? 5 : 1;
              } else if (answerStatus === 'correct') {
                  quality = 5;
              } else if (answerStatus === 'synonym') {
                  quality = 4;
              } else {
                  quality = 1;
              }
              handleNext(quality);
          }
      }
  }

  const isQuiz = ['multiple-choice', 'article-quiz', 'verb-practice', 'recall-quiz', 'fill-in-the-blank'].includes(view);
  const isFlashcard = view === 'flashcard';
  const showCheckButton = isQuiz && answerStatus === 'unanswered';
  const showNextButton = isQuiz && answerStatus !== 'unanswered';
  const canCheck = (view === 'multiple-choice' || view === 'article-quiz') ? !!selectedOption : !!inputValue.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 h-[640px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl">Сессия обучения</DialogTitle>
          <DialogDescription>
            {currentWord?.text ? `Слово: ${currentWord.text}`: 'Загрузка...'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">
          {renderContent()}
        </div>

        
        <DialogFooter className="p-6 bg-muted/50 border-t flex-col sm:flex-col sm:space-x-0 items-center gap-4">
        <Progress value={progress} className="w-full h-2" />
        <div className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0 || isFlashcard}>
                <ArrowLeft className="h-4 w-4 mr-2"/>
                Назад
            </Button>
            <div className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {words.length}
            </div>

            {showCheckButton && (
                <Button onClick={handleFooterButton} disabled={!canCheck || answerStatus === 'checking'}>
                    {answerStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Проверить
                </Button>
            )}

            {showNextButton && (
                <Button onClick={handleFooterButton}>
                    {currentIndex === words.length - 1 ? 'Завершить' : 'Далее'}
                    <ArrowRight className="h-4 w-4 ml-2"/>
                </Button>
            )}

            {!isQuiz && (
                 <Button variant="ghost" disabled={true} className="w-[106px]">
                 </Button>
            )}
        </div>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
}
