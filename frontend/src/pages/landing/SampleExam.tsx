const OPTIONS = [
  { letter: 'A', text: 'reticent' },
  { letter: 'B', text: 'loquacious' },
  { letter: 'C', text: 'sullen' },
  { letter: 'D', text: 'aloof' },
];

/**
 * Honest, non-interactive illustration of the UTME exam screen.
 * Formatted with responsive spacing, touch-friendly proportions, and clear explanation previews.
 */
export function SampleExam() {
  return (
    <figure className="m-0 w-full">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-lg" aria-hidden="true">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm">
          <span className="font-medium text-text-primary">Use of English · Q14/60</span>
          <span className="font-mono text-text-secondary">01:48:22 left</span>
        </div>

        {/* Content body */}
        <div className="p-3.5 sm:p-5">
          <p className="text-[14px] leading-relaxed text-text-primary sm:text-body-md">
            Choose the option opposite in meaning to the word <strong>taciturn</strong>.
          </p>

          {/* Options */}
          <div className="mt-3.5 space-y-2 sm:mt-4">
            {OPTIONS.map((option) => {
              const picked = option.letter === 'B';
              return (
                <div
                  key={option.letter}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs sm:gap-3 sm:py-2.5 sm:text-body-md ${
                    picked
                      ? 'border-accent-royal-blue bg-bg-secondary text-text-primary'
                      : 'border-border text-text-secondary'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
                      picked ? 'bg-accent-royal-blue text-white' : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    {option.letter}
                  </span>
                  <span className="truncate">{option.text}</span>
                </div>
              );
            })}
          </div>

          {/* Dual Explanation preview */}
          <div className="mt-3.5 rounded-lg bg-bg-secondary p-3 text-xs text-text-secondary sm:mt-4 sm:text-sm">
            <p className="font-medium text-text-primary">Falke AI Explanation Preview</p>
            <p className="mt-1 leading-normal">
              <strong>English:</strong> Taciturn means saying very little; opposite is loquacious (talkative).
            </p>
            <p className="mt-1 leading-normal text-text-secondary">
              <strong>Pidgin:</strong> Taciturn na person wey quiet; opposite na person wey dey talk well well.
            </p>
          </div>

          {/* Controls hint */}
          <p className="mt-3 text-center font-mono text-[11px] text-text-secondary sm:mt-4 sm:text-left sm:text-xs">
            Hotkeys: A–D answer · N next · P prev · F flag · S submit
          </p>
        </div>
      </div>

      <figcaption className="mt-2.5 text-center text-xs text-text-secondary sm:text-left sm:text-sm">
        Sample exam screen illustration. Real mock exam starts after sign-in.
      </figcaption>
    </figure>
  );
}
