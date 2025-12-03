"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Word } from '@/lib/types';
import { LearningView } from '@/components/learning-view';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LearningSessionProps {
  words: Word[];
  onEndSession: () => void;
}

export function LearningSession({ words, onEndSession }: LearningSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, words.length - 1));
  }, [words.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };
  
  const handleClose = () => {
    setIsOpen(false);
    // Delay closing to allow for animation
    setTimeout(onEndSession, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[60vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl">Изучение слов</DialogTitle>
          <DialogDescription>
            Пролистайте карточки, чтобы освежить слова в памяти.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 min-h-0">
            {currentWord && <LearningView word={currentWord} />}
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
            <Button onClick={handleNext} disabled={currentIndex === words.length - 1}>
                Далее
                <ArrowRight className="h-4 w-4 ml-2"/>
            </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}