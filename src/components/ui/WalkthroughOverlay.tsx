/**
 * WalkthroughOverlay
 * First-use in-app walkthrough shown once per user after login (web).
 * Full-screen backdrop with a step card, pagination dots, Next / Done buttons.
 * Dismissed via localStorage flag.
 */
import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

export interface WalkthroughStep {
  emoji: string;
  title: string;
  body: string;
}

interface WalkthroughOverlayProps {
  visible: boolean;
  steps: WalkthroughStep[];
  onDone: () => void;
}

export const WalkthroughOverlay = ({ visible, steps, onDone }: WalkthroughOverlayProps) => {
  const [index, setIndex] = useState(0);
  if (!visible) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const handleNext = () => {
    if (isLast) { setIndex(0); onDone(); }
    else setIndex(i => i + 1);
  };

  const handleSkip = () => { setIndex(0); onDone(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <GlassCard bordered className="text-center px-6 py-10">
          {/* Emoji */}
          <div className="text-5xl mb-4">{step.emoji}</div>

          {/* Step counter */}
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-3">
            {index + 1} of {steps.length}
          </p>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-3 leading-snug">
            {step.title}
          </h2>

          {/* Body */}
          <p className="text-sm text-white/60 leading-relaxed mb-6">
            {step.body}
          </p>

          {/* Pagination dots */}
          <div className="flex justify-center items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  height: 6,
                  width: i === index ? 20 : 6,
                  backgroundColor:
                    i === index ? 'rgba(170,120,255,1)' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          {/* Next / Get started */}
          <Button variant="glass" size="lg" fullWidth onClick={handleNext} className="mb-3">
            {isLast ? 'Get started →' : 'Next'}
          </Button>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={handleSkip}
              className="text-xs text-white/30 hover:text-white/60 transition-colors w-full py-1"
            >
              Skip
            </button>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
