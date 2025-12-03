"use client";

import type { Word } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, GraduationCap, Puzzle, Info } from 'lucide-react';
import { ArticleQuiz } from './article-quiz';
import { Separator } from '@/components/ui/separator';

interface LearningViewProps {
  word: Word;
  onReset: () => void;
}

export function LearningView({ word, onReset }: LearningViewProps) {
  const { details } = word;
  const { partOfSpeech, nounDetails, verbDetails, translation, examples } = details;

  const renderArticle = (article?: string) => {
    if (!article) return null;
    let colorClass = '';
    if (article === 'der') colorClass = 'text-chart-1';
    if (article === 'die') colorClass = 'text-chart-5';
    if (article === 'das') colorClass = 'text-chart-2';
    return <span className={`font-semibold ${colorClass}`}>{article}</span>;
  };
  
  const getPartOfSpeechRussian = (pos: string) => {
    switch (pos) {
      case 'noun': return 'существительное';
      case 'verb': return 'глагол';
      case 'adjective': return 'прилагательное';
      case 'adverb': return 'наречие';
      default: return 'другое';
    }
  }

  return (
    <div className="w-full max-w-3xl animate-in fade-in-50">
      <Button variant="ghost" onClick={onReset} className="mb-4 -ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Выучить другое слово
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-4xl">
            {renderArticle(nounDetails?.article)}{' '}{word.text}
          </CardTitle>
          <CardDescription className="text-lg">
            {translation}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className={`grid w-full ${partOfSpeech === 'noun' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="info"><Info className="mr-2 h-4 w-4" />Информация</TabsTrigger>
              <TabsTrigger value="examples"><BookOpen className="mr-2 h-4 w-4" />Примеры</TabsTrigger>
              {partOfSpeech === 'noun' && (
                <TabsTrigger value="quiz"><Puzzle className="mr-2 h-4 w-4" />Викторина</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="info" className="mt-6">
                 <Card className="bg-transparent shadow-none border-none">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="font-headline text-xl flex items-center gap-2"><GraduationCap />Грамматика</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                            <span className="text-muted-foreground">Часть речи</span>
                            <span className="font-semibold capitalize">{getPartOfSpeechRussian(partOfSpeech)}</span>
                        </div>
                        {partOfSpeech === 'noun' && nounDetails && (
                            <>
                                <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                                    <span className="text-muted-foreground">Артикль</span>
                                    {renderArticle(nounDetails.article)}
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                                    <span className="text-muted-foreground">Множественное число</span>
                                    <span className="font-semibold">{nounDetails.plural}</span>
                                </div>
                            </>
                        )}
                        {partOfSpeech === 'verb' && verbDetails && (
                             <>
                                <div className="rounded-lg border bg-card p-3 space-y-2">
                                    <span className="text-muted-foreground">Спряжение (Präsens)</span>
                                    <p className="font-semibold whitespace-pre-wrap">{verbDetails.presentTense}</p>
                                </div>
                                <div className="rounded-lg border bg-card p-3 space-y-2">
                                    <span className="text-muted-foreground">Прошедшее время (Perfekt)</span>
                                    <p className="font-semibold">{verbDetails.perfect}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                 </Card>
            </TabsContent>

            <TabsContent value="examples" className="mt-6">
               <Card className="bg-transparent shadow-none border-none">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="font-headline text-xl">Примеры использования</CardTitle>
                        <CardDescription>Посмотрите, как слово используется в контексте.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                        {examples.map((ex, i) => (
                            <div key={i} className="rounded-lg border bg-card p-4">
                                <p className="font-semibold text-card-foreground">{ex.german}</p>
                                <p className="text-sm text-muted-foreground mt-1">{ex.russian}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
            
            {partOfSpeech === 'noun' && nounDetails && (
              <TabsContent value="quiz" className="mt-6">
                <ArticleQuiz word={{text: word.text, type: 'noun', article: nounDetails.article}} />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
