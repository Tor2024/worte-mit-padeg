"use client";

import type { Word } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Lightbulb, Puzzle } from 'lucide-react';
import { UsageExamples } from './usage-examples';
import { ArticleQuiz } from './article-quiz';
import { AiPractice } from './ai-practice';

interface LearningViewProps {
  word: Word;
  onReset: () => void;
}

export function LearningView({ word, onReset }: LearningViewProps) {
  const renderArticle = (article?: string) => {
    if (!article) return null;
    let colorClass = '';
    if (article === 'der') colorClass = 'text-chart-1';
    if (article === 'die') colorClass = 'text-chart-5';
    if (article === 'das') colorClass = 'text-chart-2';
    return <span className={`font-semibold ${colorClass}`}>{article}</span>;
  };

  return (
    <div className="w-full max-w-3xl animate-in fade-in-50">
      <Button variant="ghost" onClick={onReset} className="mb-4 -ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Выучить другое слово
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">
            {renderArticle(word.article)}{' '}{word.text}
          </CardTitle>
          <CardDescription>
            Часть речи: <span className="font-semibold capitalize">{word.type}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="examples" className="w-full">
            <TabsList className={`grid w-full ${word.type === 'noun' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="examples">
                <BookOpen className="mr-2 h-4 w-4" /> Примеры
              </TabsTrigger>
              <TabsTrigger value="practice">
                <Lightbulb className="mr-2 h-4 w-4" /> Практика
              </TabsTrigger>
              {word.type === 'noun' && (
                <TabsTrigger value="quiz">
                  <Puzzle className="mr-2 h-4 w-4" /> Викторина по артиклям
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="examples" className="mt-6">
              <UsageExamples word={word} />
            </TabsContent>
            <TabsContent value="practice" className="mt-6">
              <AiPractice word={word} />
            </TabsContent>
            {word.type === 'noun' && (
              <TabsContent value="quiz" className="mt-6">
                <ArticleQuiz word={word} />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
