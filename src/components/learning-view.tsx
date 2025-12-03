"use client";

import { useState } from 'react';
import type { Word } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LearningViewProps {
  word: Word;
}

export function LearningView({ word }: LearningViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { details } = word;
  const { partOfSpeech, nounDetails, verbDetails, prepositionDetails, conjunctionDetails, adjectiveDetails, translation, alternativeTranslations, examples } = details;

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
      case 'conjunction': return 'союз';
      default: return 'другое';
    }
  };

  const getVerbPositionRussian = (pos?: 'secondPosition' | 'endOfSentence') => {
    if (!pos) return null;
    switch (pos) {
        case 'secondPosition': return 'глагол на 2-м месте';
        case 'endOfSentence': return 'глагол в конце';
        default: return null;
    }
  }

  const DetailItem = ({ label, value }: { label: string, value?: string | React.ReactNode | null }) => {
    if (!value) return null;
    return <p><span className="font-semibold text-muted-foreground">{label}:</span> {value}</p>;
  }
  
  const ConjugationTable = ({ label, data }: { label: string, data?: string }) => {
      if (!data) return null;
      return (
        <div>
            <p className="font-semibold text-muted-foreground mb-1">{label}:</p>
            <p className="whitespace-pre-wrap font-mono text-xs">{data}</p>
        </div>
      )
  }

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
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-headline text-4xl">
                {verbDetails?.isReflexive && <span className="text-muted-foreground">sich </span>}
                {renderArticle(nounDetails?.article)}{' '}{word.text}
              </h2>
              <Badge variant="outline">{getPartOfSpeechRussian(partOfSpeech)}</Badge>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-4 text-sm">
                {partOfSpeech === 'noun' && nounDetails && (
                  <DetailItem label="Мн. число" value={<>{renderArticle('die')} {nounDetails.plural}</>} />
                )}
                {partOfSpeech === 'verb' && verbDetails && (
                  <>
                    <DetailItem label="Управление" value={verbDetails.verbGovernment} />
                    <DetailItem label="Perfekt" value={verbDetails.perfect} />
                    <ConjugationTable label="Präsens" data={verbDetails.presentTense} />
                    <ConjugationTable label="Präteritum" data={verbDetails.prateritum} />
                    <ConjugationTable label="Futur I" data={verbDetails.futurI} />
                  </>
                )}
                {partOfSpeech === 'adjective' && adjectiveDetails && (
                    <>
                        <DetailItem label="Сравн. степень" value={adjectiveDetails.comparative} />
                        <DetailItem label="Прев. степень" value={adjectiveDetails.superlative} />
                        <DetailItem label="Антоним" value={adjectiveDetails.antonym} />
                    </>
                )}
                 {partOfSpeech === 'preposition' && prepositionDetails && (
                  <>
                    <DetailItem label="Падеж" value={prepositionDetails.case} />
                    <DetailItem label="Двойное управление" value={prepositionDetails.dualCaseExplanation} />
                    <DetailItem label="Частые слияния" value={prepositionDetails.commonContractions} />
                  </>
                )}
                {partOfSpeech === 'conjunction' && conjunctionDetails && (
                  <DetailItem label="Порядок слов" value={getVerbPositionRussian(conjunctionDetails.verbPosition)} />
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="text-center text-muted-foreground text-sm mt-4 pt-4 border-t">
            <RefreshCw className="inline-block mr-2 h-4 w-4" />
            Нажмите, чтобы перевернуть
          </div>
        </div>
        
        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col p-6 bg-secondary">
          <div className="flex-1 flex flex-col min-h-0">
              <h2 className="font-headline text-3xl mb-3 text-secondary-foreground">{translation}</h2>
              
              {alternativeTranslations && alternativeTranslations.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-muted-foreground">Другие значения:</p>
                  <p className="text-sm text-secondary-foreground">{alternativeTranslations.join(', ')}</p>
                </div>
              )}

              <div className="flex-1 space-y-2 min-h-0">
                  <h3 className="font-semibold text-secondary-foreground">Примеры:</h3>
                   <ScrollArea className="h-full pr-4 -mr-4">
                      <ul className="space-y-3 text-sm">
                          {examples.map((ex, i) => (
                              <li key={i}>
                                  <p className="text-secondary-foreground">{ex.german}</p>
                                  <p className="text-muted-foreground">{ex.russian}</p>
                              </li>
                          ))}
                      </ul>
                   </ScrollArea>
              </div>
          </div>
           <div className="text-center text-muted-foreground text-sm mt-4 pt-4 border-t">
             <RefreshCw className="inline-block mr-2 h-4 w-4" />
            Нажмите, чтобы перевернуть
          </div>
        </div>
      </Card>
    </div>
  );
}
