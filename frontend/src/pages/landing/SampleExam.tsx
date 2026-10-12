const OPTIONS = [
  { letter: 'A', text: 'reticent' },
  { letter: 'B', text: 'loquacious' },
  { letter: 'C', text: 'sullen' },
  { letter: 'D', text: 'aloof' },
];

/** Static picture of the exam screen. Nothing here is interactive or live. */
export function SampleExam() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-lg" aria-hidden="true">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
          <span className="font-medium text-text-primary">Use of English · Question 14 of 60</span>
          <span className="font-mono text-text-secondary">Time left 01:48:22</span>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-body-md text-text-primary">
            Choose the option opposite in meaning to the word <strong>taciturn</strong>.
          </p>
          <div className="mt-4 space-y-2">
            {OPTIONS.map((option) => {
              const picked = option.letter === 'B';
              return (
                <div
                  key={option.letter}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-body-md ${
                    picked ? 'border-accent-royal-blue bg-bg-secondary text-text-primary' : 'border-border text-text-secondary'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                      picked ? 'bg-accent-royal-blue text-white' : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    {option.letter}
                  </span>
                  {option.text}
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg bg-bg-secondary p-3 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Explanation</p>
            <p className="mt-1">Taciturn means saying very little, so the opposite is loquacious: talkative.</p>
            <p className="mt-1">Taciturn na person wey no dey talk plenty. Loquacious na the opposite: person wey dey talk well well.</p>
          </div>
          <p className="mt-4 font-mono text-xs text-text-secondary">A–D answer · N next · P previous · F flag · S submit</p>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-text-secondary">
        Illustration of the exam screen with a sample question. It is not a live exam.
      </figcaption>
    </figure>
  );
}
