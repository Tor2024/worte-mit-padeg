"use client";

import { useState, useEffect } from 'react';
import { Word, WordType } from '@/lib/types';
import { UnifiedSession } from '@/components/unified-session';
import { AdjectiveTrainer } from '@/components/adjective-trainer';
import { CaseTrainer } from '@/components/case-trainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BookMarked, Sparkles, Loader2, PlusCircle, Trash2, BrainCircuit, WandSparkles, CaseSensitive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWordDetails } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const getPartOfSpeechRussian = (pos: WordType) => {
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

const renderArticle = (article?: string) => {
    if (!article) return null;
    let colorClass = '';
    if (article === 'der') colorClass = 'text-chart-1';
    if (article === 'die') colorClass = 'text-chart-5';
    if (article === 'das') colorClass = 'text-chart-2';
    return <span className={`font-semibold ${colorClass}`}>{article}</span>;
};


export function WordManager() {
  const [dictionary, setDictionary] = useState<Word[]>([]);
  const [session, setSession] = useState<{words: Word[]} | null>(null);
  const [adjectiveTrainerActive, setAdjectiveTrainerActive] = useState(false);
  const [caseTrainerActive, setCaseTrainerActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<WordType | 'all'>('all');
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);
  const [earlySessionDialogOpen, setEarlySessionDialogOpen] = useState(false);
  const [wordTypeHint, setWordTypeHint] = useState<WordType | undefined>(undefined);

  useEffect(() => {
    try {
      const savedDictionary = localStorage.getItem('german-dictionary');
      if (savedDictionary) {
        setDictionary(JSON.parse(savedDictionary));
      }
    } catch (error) {
      console.error("Failed to load dictionary from localStorage", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить ваш словарь.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const saveDictionary = (newDictionary: Word[]) => {
    try {
      localStorage.setItem('german-dictionary', JSON.stringify(newDictionary));
      setDictionary(newDictionary);
    } catch (error) {
        console.error("Failed to save dictionary to localStorage", error);
        toast({
            title: "Ошибка сохранения",
            description: "Не удалось сохранить ваш словарь.",
            variant: "destructive",
        });
    }
  };

  const handleAddWord = () => {
    let wordToAdd = inputValue.trim();
    if (!wordToAdd) {
      toast({ title: "Пустой ввод", description: "Пожалуйста, введите слово для добавления.", variant: "destructive" });
      return;
    }
    if (dictionary.some(word => word.text.toLowerCase() === wordToAdd.toLowerCase())) {
        toast({ title: "Слово уже в словаре", description: `Слово "${wordToAdd}" уже есть в вашем словаре.`, variant: "default" });
        return;
    }
    
    startTransition(true);
    fetchWordDetails(wordToAdd, wordTypeHint).then(result => {
        if (result.success) {
            // Apply automatic capitalization based on fetched part of speech
            if (result.data.partOfSpeech === 'noun') {
                wordToAdd = wordToAdd.charAt(0).toUpperCase() + wordToAdd.slice(1);
            } else {
                wordToAdd = wordToAdd.toLowerCase();
            }

            const newWord: Word = { 
              text: wordToAdd, 
              details: result.data,
              // SRS fields
              nextReview: new Date().toISOString(),
              interval: 0,
              easeFactor: 2.5,
              repetitions: 0,
              lastReviewed: null
            };
            const newDictionary = [newWord, ...dictionary];
            saveDictionary(newDictionary);
            setInputValue('');
            setWordTypeHint(undefined);
            toast({ title: "Слово добавлено!", description: `"${wordToAdd}" успешно добавлен в ваш словарь.` });
        } else {
            toast({ title: "Ошибка ИИ", description: result.error, variant: "destructive" });
        }
    }).finally(() => {
        startTransition(false);
    });
  };

  const handleDeleteWord = (wordText: string) => {
    const newDictionary = dictionary.filter(word => word.text !== wordText);
    saveDictionary(newDictionary);
    toast({ title: "Слово удалено", description: `"${wordText}" удалено из вашего словаря.` });
  };
  
  const handleUpdateWord = (updatedWord: Word) => {
    const newDictionary = dictionary.map(word => 
      word.text === updatedWord.text ? updatedWord : word
    );
    saveDictionary(newDictionary);
  };

  const startSessionWithWords = (words: Word[]) => {
    if (words.length === 0) {
      toast({ title: "Нет слов для сессии", description: "В выбранном фильтре нет слов для начала сессии.", variant: "default" });
      return;
    }
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    setSession({ words: shuffledWords });
  };
  
  const handleStartSession = (words: Word[]) => {
    const wordsForReview = words.filter(word => new Date(word.nextReview) <= new Date());
    
    if (wordsForReview.length > 0) {
      startSessionWithWords(wordsForReview);
    } else {
        if (words.length > 0) {
            setEarlySessionDialogOpen(true);
        } else {
            toast({ title: "Словарь пуст", description: "Добавьте слова в словарь, чтобы начать обучение.", variant: "default" });
        }
    }
  };

  const handleStartAdjectiveTrainer = () => {
    const nouns = dictionary.filter(w => w.details.partOfSpeech === 'noun');
    const adjectives = dictionary.filter(w => w.details.partOfSpeech === 'adjective');
    if (nouns.length > 0 && adjectives.length > 0) {
      setAdjectiveTrainerActive(true);
    } else {
      toast({ title: "Недостаточно слов", description: "Для тренажера прилагательных нужен хотя бы 1 существительное и 1 прилагательное в словаре.", variant: "default", duration: 5000 });
    }
  };

  const handleStartCaseTrainer = () => {
    const nouns = dictionary.filter(w => w.details.partOfSpeech === 'noun');
    const prepositions = dictionary.filter(w => w.details.partOfSpeech === 'preposition');
    if (nouns.length > 0 && prepositions.length > 0) {
      setCaseTrainerActive(true);
    } else {
      toast({ title: "Недостаточно слов", description: "Для тренажера падежей нужен хотя бы 1 существительное и 1 предлог в словаре.", variant: "default", duration: 5000 });
    }
  };


  const filteredDictionary = filter === 'all' 
    ? dictionary 
    : dictionary.filter(word => word.details.partOfSpeech === filter);

  if (session) {
    return <UnifiedSession 
      words={session.words} 
      onEndSession={() => setSession(null)}
      onWordUpdate={handleUpdateWord}
    />;
  }

  if (adjectiveTrainerActive) {
    return <AdjectiveTrainer 
      dictionary={dictionary} 
      onEndSession={() => setAdjectiveTrainerActive(false)}
    />;
  }

  if (caseTrainerActive) {
    return <CaseTrainer 
      dictionary={dictionary} 
      onEndSession={() => setCaseTrainerActive(false)}
    />;
  }

  return (
    <>
    <div className="w-full max-w-3xl animate-in fade-in-50 space-y-8">
      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <PlusCircle className="h-6 w-6 text-primary" />
                  Добавить новое слово
              </CardTitle>
              <CardDescription>
                  Введите немецкое слово или фразу. Для омонимов (как 'See') можно указать часть речи.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleAddWord(); }} className="flex items-end gap-4">
                  <div className="flex-grow space-y-2">
                      <Label htmlFor="word-input">Слово / Фраза</Label>
                      <Input 
                          id="word-input" 
                          placeholder="например, Haus, gehen, schön" 
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                      />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="word-type-hint">Часть речи (опц.)</Label>
                       <Select value={wordTypeHint} onValueChange={(value) => setWordTypeHint(value as any)}>
                          <SelectTrigger id="word-type-hint" className="w-[180px]">
                            <SelectValue placeholder="Уточнить" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noun">Существительное</SelectItem>
                            <SelectItem value="verb">Глагол</SelectItem>
                            <SelectItem value="adjective">Прилагательное</SelectItem>
                            <SelectItem value="preposition">Предлог</SelectItem>
                             <SelectItem value="conjunction">Союз</SelectItem>
                          </SelectContent>
                        </Select>
                   </div>
                  <Button 
                      type="submit" 
                      disabled={!inputValue.trim() || isPending}
                  >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Добавить'}
                      {isPending || <Sparkles className="ml-2 h-4 w-4" />}
                  </Button>
              </form>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-primary" />
                Мой словарь
                {dictionary.length > 0 && (
                    <Badge variant="secondary">{dictionary.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Здесь хранятся все ваши слова. Начните сессию, чтобы повторить то, что пора.
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
              <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Фильтр по части речи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все части речи</SelectItem>
                  <SelectItem value="noun">Существительные</SelectItem>
                  <SelectItem value="verb">Глаголы</SelectItem>
                  <SelectItem value="adjective">Прилагательные</SelectItem>
                  <SelectItem value="adverb">Наречия</SelectItem>
                  <SelectItem value="preposition">Предлоги</SelectItem>
                  <SelectItem value="conjunction">Союзы</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
               <Button onClick={() => handleStartSession(filteredDictionary)} disabled={dictionary.length === 0}>
                 <BrainCircuit className="mr-2 h-4 w-4" />
                 Начать обучение
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Button onClick={handleStartAdjectiveTrainer} variant="outline" className="w-full">
              <WandSparkles className="mr-2 h-4 w-4 text-accent"/>
              Тренажер прилагательных
            </Button>
            <Button onClick={handleStartCaseTrainer} variant="outline" className="w-full">
                <CaseSensitive className="mr-2 h-4 w-4 text-accent"/>
                Тренажер падежей
            </Button>
          </div>
          {dictionary.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>Ваш словарь пока пуст.</p>
              <p className="text-sm">Добавьте свое первое слово, чтобы начать обучение!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDictionary.map(word => (
                <div key={word.text} className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">
                            {renderArticle(word.details.nounDetails?.article)}{' '}{word.text}
                        </span>
                        <Badge variant="outline">{getPartOfSpeechRussian(word.details.partOfSpeech)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{word.details.translation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                         <p className="text-xs font-medium text-muted-foreground">Повторить:</p>
                         <p className="text-xs">{new Date(word.nextReview).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteWord(word.text)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Удалить</span>
                    </Button>
                  </div>
                </div>
              ))}
              {filteredDictionary.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <p>В этой категории слов нет.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={earlySessionDialogOpen} onOpenChange={setEarlySessionDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Все выучено на сегодня!</AlertDialogTitle>
                <AlertDialogDescription>
                    По расписанию у вас нет слов для повторения. Хотите начать сессию со всеми словами из текущего фильтра?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Нет, спасибо</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    startSessionWithWords(filteredDictionary);
                    setEarlySessionDialogOpen(false);
                }}>
                    Да, начать
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
