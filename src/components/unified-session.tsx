"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LearningView } from '@/components/learning-view';
import { fetchQuizQuestion, checkAnswer, checkRecallAnswer, fetchFillInTheBlank } from '@/lib/actions';
import type { GenerateQuizQuestionOutput, IntelligentErrorCorrectionOutput, CheckRecallOutput, GenerateFillInTheBlankOutput } from '@/ai/schemas';
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

type SessionView = 'loading' | 'flashcard' | 'multiple-choice' | 'article-quiz' | 'verb-practice' | 'recall-quiz' | 'fill-in-the-blank';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect' | 'synonym';
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
  const [quizData, setQuizData] = useState<GenerateQuizQuestionOutput | IntelligentErrorCorrectionOutput | CheckRecallOutput | GenerateFillInTheBlankOutput | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // For radio/multiple choice
  const [inputValue, setInputValue] = useState(''); // For verb practice and recall
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [verbPracticeType, setVerbPracticeType] = useState<VerbPracticeType>('perfect');
  
  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);

  const determineNextView = useCallback((word: Word): SessionView => {
    // First time seeing the word? Always flashcard.
    if (word.repetitions < 1 && word.interval < 1) {
      return 'flashcard';
    }

    const availableViews: SessionView[] = ['multiple-choice'];
    const weights: { [key in SessionView]?: number } = {
        'multiple-choice': 0.3,
        'recall-quiz': 0.3,
        'fill-in-the-blank': 0.4,
    };
    
    if (word.details.partOfSpeech === 'noun' && word.easeFactor < 2.8) {
        availableViews.push('article-quiz');
        weights['article-quiz'] = 0.3;
    }
    
    if (word.details.partOfSpeech === 'verb' && word.easeFactor < 3.0) {
        availableViews.push('verb-practice');
        weights['verb-practice'] = 0.35;
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

    // Fallback to flashcard if something goes wrong
    return 'flashcard';
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
        if (!result.success) console.error(result.error);
        setView('flashcard'); // Fallback to flashcard
      }
    } else if (nextView === 'article-quiz') {
      setView('article-quiz');
    } else if (nextView === 'verb-practice') {
      setVerbPracticeType(Math.random() > 0.5 ? 'perfect' : 'prateritum');
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
            if (!result.success) console.error(result.error);
            setView('flashcard'); // Fallback to flashcard
        }
    }
  }, [determineNextView]);

  useEffect(() => {
    if (currentWord) {
      loadView(currentWord);
    }
  }, [currentWord, loadView]);
  
  const handleNext = useCallback((quality?: number) => {
    // Update SRS if quality is provided (for flashcards)
    if (quality !== undefined) {
      const newSrsData = getNextReviewDate(currentWord, quality);
      onWordUpdate({ ...currentWord, ...newSrsData });
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentIndex, words.length, currentWord, onWordUpdate]);
  
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
      if (!currentWord || (isInputBased && !inputValue) || (!isInputBased && !selectedOption)) return;

      let isCorrect = false;
      let isSynonym = false;
      
      let result;
      switch(view) {
        case 'multiple-choice':
          const question = quizData as GenerateQuizQuestionOutput;
          isCorrect = selectedOption === question.correctAnswer;
          setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
          break;

        case 'article-quiz':
          result = await checkAnswer({
              word: currentWord.text,
              userInput: selectedOption!,
              wordType: 'noun',
              expectedArticle: currentWord.details.nounDetails?.article
          });
          if (result.success) {
              setQuizData(result.data);
              isCorrect = result.data.isCorrect;
              setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
          } else {
              console.error(result.error); setAnswerStatus('incorrect');
          }
          break;
        
        case 'verb-practice':
            const expectedAnswer = verbPracticeType === 'perfect' 
                ? currentWord.details.verbDetails?.perfect 
                : currentWord.details.verbDetails?.prateritum;
            result = await checkAnswer({
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
                console.error(result.error); setAnswerStatus('incorrect');
            }
            break;

        case 'recall-quiz':
            result = await checkRecallAnswer({
                russianWord: currentWord.details.translation,
                germanWord: currentWord.text,
                partOfSpeech: currentWord.details.partOfSpeech,
                article: currentWord.details.nounDetails?.article,
                userInput: inputValue.trim(),
            });
            if (result.success) {
                setQuizData(result.data);
                isCorrect = result.data.isCorrect;
                isSynonym = result.data.isSynonym;
                setAnswerStatus(isSynonym ? 'synonym' : (isCorrect ? 'correct' : 'incorrect'));
            } else {
                console.error(result.error); setAnswerStatus('incorrect');
            }
            break;
        
        case 'fill-in-the-blank':
            const blankQuiz = quizData as GenerateFillInTheBlankOutput;
            result = await checkAnswer({
                word: currentWord.text,
                userInput: inputValue.trim(),
                wordType: currentWord.details.partOfSpeech,
                practiceType: 'fill-in-the-blank',
                expectedAnswer: blankQuiz.correctAnswer,
                sentenceContext: blankQuiz.sentenceWithBlank,
            });
            if (result.success) {
                setQuizData(result.data);
                isCorrect = result.data.isCorrect;
                setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
            } else {
                console.error(result.error); setAnswerStatus('incorrect');
            }
            break;
      }
      
      const quality = isSynonym ? 4 : (isCorrect ? 5 : 2); // 5 for correct, 4 for synonym, 2 for incorrect
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
        const isFirstEverReview = currentWord.repetitions === 0 && currentWord.interval < 1;
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                    <LearningView word={currentWord} />
                </div>
                <div className="mt-4 pt-4 border-t flex justify-around">
                    {isFirstEverReview ? (
                        <>
                            <Button size="lg" variant="destructive" onClick={() => handleNext(1)}>Не помню</Button>
                            <Button size="lg" variant="secondary" onClick={() => handleNext(3)}>Помню</Button>
                            <Button size="lg" onClick={() => handleNext(5)}>Легко!</Button>
                        </>
                    ) : (
                       <Button size="lg" onClick={() => handleNext()} className="w-full">
                            Понятно
                            <ArrowRight className="h-4 w-4 ml-2"/>
                        </Button>
                    )}
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
                    <form onSubmit={(e) => { e.preventDefault(); answerStatus === 'unanswered' ? handleCheck() : handleNext() }} className="w-full">
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

     if (view === 'recall-quiz') {
        const feedback = quizData as CheckRecallOutput;
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
                    <form onSubmit={(e) => { e.preventDefault(); answerStatus === 'unanswered' ? handleCheck() : handleNext() }} className="w-full">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={currentWord.details.partOfSpeech === 'noun' ? 'der/die/das + cуществительное' : 'Введите перевод...'}
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            autoFocus
                        />
                    </form>

                     {answerStatus !== 'unanswered' && feedback && (
                        <Alert variant={answerStatus === 'incorrect' ? 'destructive' : 'default'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : (answerStatus === 'synonym' ? <RefreshCw className="h-4 w-4"/> : <X className="h-4 w-4" />) }
                            <AlertTitle>
                              {answerStatus === 'correct' && 'Правильно!'}
                              {answerStatus === 'incorrect' && 'Не совсем'}
                              {answerStatus === 'synonym' && 'Тоже верно!'}
                            </AlertTitle>
                            <AlertDescription>
                                <p>{feedback.explanation}</p>
                            </AlertDescription>
                        </Alert>
                   )}
                </CardContent>
            </Card>
        )
    }

    if (view === 'fill-in-the-blank') {
        const blankQuiz = quizData as GenerateFillInTheBlankOutput;
        const feedback = quizData as IntelligentErrorCorrectionOutput;

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
                    
                    <form onSubmit={(e) => { e.preventDefault(); answerStatus === 'unanswered' ? handleCheck() : handleNext() }} className="w-full">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Введите пропущенное слово"
                            disabled={answerStatus !== 'unanswered'}
                            className="text-center text-lg h-12"
                            autoFocus
                        />
                    </form>

                     {answerStatus !== 'unanswered' && feedback.explanation && (
                        <Alert variant={answerStatus === 'correct' ? 'default' : 'destructive'} className="animate-in fade-in-50 w-full">
                            {answerStatus === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            <AlertTitle>{answerStatus === 'correct' ? 'Правильно!' : 'Не совсем'}</AlertTitle>
                            <AlertDescription>
                                <p>{feedback.explanation}</p>
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

  const isQuiz = ['multiple-choice', 'article-quiz', 'verb-practice', 'recall-quiz', 'fill-in-the-blank'].includes(view);
  const showNextButton = !isQuiz || (isQuiz && answerStatus !== 'unanswered');
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
            <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                <ArrowLeft className="h-4 w-4 mr-2"/>
                Назад
            </Button>
            <div className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {words.length}
            </div>

            {!showNextButton && (
                <Button onClick={handleCheck} disabled={!canCheck}>
                    Проверить
                </Button>
            )}

            {showNextButton && (
                <Button onClick={() => handleNext()}>
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
