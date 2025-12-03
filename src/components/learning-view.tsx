"use client";

import { useState } from 'react';
import type { Word } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LearningViewProps {
  word: Word;
}

export function LearningView({ word }: LearningViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { details } = word;
  const { partOfSpeech, nounDetails, verbDetails, prepositionDetails, translation, examples } = details;

  const renderArticle = (article?: string) => {
    if (!article) return null;
    let colorClass = '';
    if (article === 'der') colorClass = 'text-chart-1';
    if (article === 'die') colorClass = 'text-chart-5';
    if (article === 'das') colorClass = 'text-chart-2';
    return <span className={`font-bold ${colorClass}`}>{article}</span>;
  };

  const getPartOfSpeechRussian = (pos: string) => {
    switch (pos) {
      case 'noun': return 'существительное';
      case 'verb': return 'глагол';
      case 'adjective': return 'прилагательное';
      case 'adverb': return 'наречие';
      case 'preposition': return 'предлог';
      default: return 'другое';
    }
  };

  return (
    <div 
        className="w-full h-full cursor-pointer perspective-1000" 
        onClick={() => setIsFlipped(!isFlipped)}
    >
      <Card 
        className={`w-full h-full relative transform-style-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full backface-hidden flex flex-col justify-between p-6">
          <div>
            <div className="flex justify-between items-start">
              <h2 className="font-headline text-4xl mb-2">
                {renderArticle(nounDetails?.article)}{' '}{word.text}
              </h2>
              <Badge variant="outline">{getPartOfSpeechRussian(partOfSpeech)}</Badge>
            </div>

            <div className="space-y-4 text-sm mt-4">
              {partOfSpeech === 'noun' && nounDetails && (
                <>
                  <p><span className="font-semibold text-muted-foreground">Мн. число:</span> {nounDetails.plural}</p>
                </>
              )}
              {partOfSpeech === 'verb' && verbDetails && (
                <>
                  <p><span className="font-semibold text-muted-foreground">Perfekt:</span> {verbDetails.perfect}</p>
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">Präsens:</p>
                    <p className="whitespace-pre-wrap font-mono text-xs">{verbDetails.presentTense}</p>
                  </div>
                </>
              )}
               {partOfSpeech === 'preposition' && prepositionDetails && (
                <p><span className="font-semibold text-muted-foreground">Падеж:</span> {prepositionDetails.case}</p>
              )}
            </div>
          </div>
          <div className="text-center text-muted-foreground text-sm">
            <RefreshCw className="inline-block mr-2 h-4 w-4" />
            Нажмите, чтобы перевернуть
          </div>
        </div>
        
        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col justify-between p-6 bg-secondary">
          <div>
              <h2 className="font-headline text-4xl mb-4 text-secondary-foreground">{translation}</h2>
              <div className="space-y-3">
                  <h3 className="font-semibold text-secondary-foreground">Примеры:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                      {examples.map((ex, i) => (
                          <li key={i}>
                              <p className="text-secondary-foreground">{ex.german}</p>
                              <p className="text-muted-foreground">{ex.russian}</p>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
           <div className="text-center text-muted-foreground text-sm">
             <RefreshCw className="inline-block mr-2 h-4 w-4" />
            Нажмите, чтобы перевернуть
          </div>
        </div>
      </Card>
    </div>
  );
}