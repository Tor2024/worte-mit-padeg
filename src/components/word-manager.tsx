"use client";

import { useState, useEffect } from 'react';
import type { Word, WordType } from '@/lib/types';
import { LearningSession } from '@/components/learning-session';
import { QuizSession } from '@/components/quiz-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BookMarked, Sparkles, Loader2, PlusCircle, Trash2, BookOpen, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWordDetails } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const getPartOfSpeechRussian = (pos: WordType) => {
    switch (pos) {
      case 'noun': return 'существительное';
      case 'verb': return 'глагол';
      case 'adjective': return 'прилагательное';
      case 'adverb': return 'наречие';
      case 'preposition': return 'предлог';
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
  const [session, setSession] = useState<{type: 'learning' | 'quiz', words: Word[]} | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<WordType | 'all'>('all');
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

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
    const wordToAdd = inputValue.trim();
    if (!wordToAdd) {
      toast({ title: "Пустой ввод", description: "Пожалуйста, введите слово для добавления.", variant: "destructive" });
      return;
    }
    if (dictionary.some(word => word.text.toLowerCase() === wordToAdd.toLowerCase())) {
        toast({ title: "Слово уже в словаре", description: `Слово "${wordToAdd}" уже есть в вашем словаре.`, variant: "default" });
        return;
    }
    
    startTransition(true);
    fetchWordDetails(wordToAdd).then(result => {
        if (result.success) {
            const newWord: Word = { text: wordToAdd, details: result.data };
            const newDictionary = [...dictionary, newWord];
            saveDictionary(newDictionary);
            setInputValue('');
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
  
  const handleStartLearningSession = (words: Word[]) => {
    if (words.length > 0) {
      setSession({ type: 'learning', words });
    } else {
        toast({ title: "Нет слов для изучения", description: "Добавьте слова в эту категорию, чтобы начать изучение.", variant: "default" });
    }
  };
  
  const handleStartQuizSession = (words: Word[]) => {
    const quizWords = words.filter(w => w.details.partOfSpeech === 'noun');
    if (quizWords.length > 0) {
      setSession({ type: 'quiz', words: quizWords });
    } else {
      toast({ title: "Нет слов для викторины", description: "Для викторины по артиклям нужны существительные. Добавьте их в эту категорию.", variant: "default" });
    }
  };

  const filteredDictionary = filter === 'all' 
    ? dictionary 
    : dictionary.filter(word => word.details.partOfSpeech === filter);

  if (session?.type === 'learning') {
    return <LearningSession words={session.words} onEndSession={() => setSession(null)} />;
  }
  if (session?.type === 'quiz') {
    return <QuizSession words={session.words} onEndSession={() => setSession(null)} />;
  }

  return (
    <div className="w-full max-w-3xl animate-in fade-in-50 space-y-8">
      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <PlusCircle className="h-6 w-6 text-primary" />
                  Добавить новое слово
              </CardTitle>
              <CardDescription>
                  Введите немецкое слово или фразу, чтобы добавить его в свой словарь для изучения.
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
              </CardTitle>
              <CardDescription>
                Здесь хранятся все ваши слова. Выберите режим, чтобы начать.
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
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
               <Button variant="outline" onClick={() => handleStartLearningSession(filteredDictionary)}>
                 <BookOpen className="mr-2 h-4 w-4" />
                 Карточки
               </Button>
               <Button onClick={() => handleStartQuizSession(filteredDictionary)}>
                 <Lightbulb className="mr-2 h-4 w-4" />
                 Викторина
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
  );
}
