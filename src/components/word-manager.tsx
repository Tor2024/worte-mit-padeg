"use client";

import { useState } from 'react';
import type { Word, WordType } from '@/lib/types';
import { LearningView } from '@/components/learning-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookMarked, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WordManager() {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [wordType, setWordType] = useState<WordType>('other');
  const [article, setArticle] = useState<'der' | 'die' | 'das' | null>(null);
  const [showArticle, setShowArticle] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // Automatically suggest 'noun' if the word starts with a capital letter
    if (value.length > 0 && value.charAt(0) === value.charAt(0).toUpperCase() && value.split(" ").length === 1) {
      if (wordType !== 'noun') {
         setWordType('noun');
         setShowArticle(true);
      }
    }
  };
  
  const handleWordTypeChange = (value: string) => {
    const newType = value as WordType;
    setWordType(newType);
    if (newType === 'noun') {
      setShowArticle(true);
    } else {
      setShowArticle(false);
      setArticle(null);
    }
  };

  const handleStartLearning = () => {
    if (!inputValue.trim()) return;
    if (wordType === 'noun' && !article) {
        toast({
            title: "Artikel fehlt",
            description: "Bitte wählen Sie einen Artikel für das Nomen.",
            variant: "destructive",
        })
        return;
    }

    setCurrentWord({
      text: inputValue.trim(),
      type: wordType,
      article: wordType === 'noun' ? article! : undefined,
    });
  };
  
  const handleReset = () => {
    setCurrentWord(null);
    setInputValue('');
    setWordType('other');
    setArticle(null);
    setShowArticle(false);
  };

  if (currentWord) {
    return <LearningView word={currentWord} onReset={handleReset} />;
  }

  return (
    <div className="w-full max-w-xl">
        <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <BookMarked className="h-6 w-6 text-primary" />
                    Lass uns ein neues Wort lernen!
                </CardTitle>
                <CardDescription>
                    Gib ein deutsches Wort oder eine Phrase ein, um zu beginnen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleStartLearning(); }} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="word-input">Wort / Phrase</Label>
                        <Input 
                            id="word-input" 
                            placeholder="z.B. Haus, gehen, schön" 
                            value={inputValue}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Wortart</Label>
                        <Select onValueChange={handleWordTypeChange} value={wordType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wortart auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="noun">Nomen</SelectItem>
                                <SelectItem value="verb">Verb</SelectItem>
                                <SelectItem value="adjective">Adjektiv</SelectItem>
                                <SelectItem value="adverb">Adverb</SelectItem>
                                <SelectItem value="other">Andere</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {showArticle && (
                        <div className="space-y-3 rounded-md border p-4 animate-in fade-in-50">
                            <Label className="font-semibold">Artikel</Label>
                            <RadioGroup onValueChange={(v) => setArticle(v as 'der' | 'die' | 'das')} value={article || ''}>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="der" id="der" />
                                        <Label htmlFor="der" className="cursor-pointer">der</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="die" id="die" />
                                        <Label htmlFor="die" className="cursor-pointer">die</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="das" id="das" />
                                        <Label htmlFor="das" className="cursor-pointer">das</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={!inputValue.trim()}
                    >
                        Lernen beginnen
                        <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
