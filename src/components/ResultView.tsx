import type { CheckResult } from '../types';
import styles from './ResultView.module.css';

type Props = {
  title: string;
  level: string;
  result: CheckResult;
  onTryAgain: () => void;
  onBack: () => void;
};

function scoreColor(accuracy: number): string {
  if (accuracy >= 80) return 'var(--success)';
  if (accuracy >= 60) return 'var(--warning)';
  return 'var(--error)';
}

function scoreLabel(accuracy: number): string {
  if (accuracy >= 90) return 'Excellent!';
  if (accuracy >= 80) return 'Great work';
  if (accuracy >= 60) return 'Good progress';
  if (accuracy >= 40) return 'Keep going';
  return 'Keep practicing';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const ResultView = ({ title, level, result, onTryAgain, onBack }: Props) => {
  const { sentences, totalWords, accuracy, spellingErrors, missingWords, extraWords, timeSpent } = result;

  const color = scoreColor(accuracy);
  const pct = `${accuracy}%`;

  const spellingCount = sentences.reduce((acc, s) => acc + s.tokens.filter(t => t.cls === 'wrong').length, 0);
  const missingCount = sentences.reduce((acc, s) => acc + s.tokens.filter(t => t.cls === 'missing').length, 0);
  const extraCount = sentences.reduce((acc, s) => acc + s.tokens.filter(t => t.cls === 'extra').length, 0);

  return (
    <>
      {/* Context bar */}
      <div className={styles.ctxBar}>
        <div className={styles.ctxRow}>
          <button className={styles.ibtn} aria-label="Back to list" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.phInfo}>
            <div className={styles.phTitle}>{title} — Results</div>
            <div className={styles.phMeta}>
              <span className={styles.lvlBadge}>{level}</span>
            </div>
          </div>
          <div className={styles.phActions}>
            <button className={styles.btnG} onClick={onTryAgain}>Try Again</button>
          </div>
        </div>
      </div>

      {/* Main result content */}
      <main className={styles.rmain}>

        {/* Hero: ring + AI comment */}
        <div className={styles.hero}>
          <div className={styles.ringWrap}>
            <div
              className={styles.ring}
              style={{ background: `conic-gradient(${color} ${pct}, var(--bg-sunken) ${pct})` }}
            >
              <div className={styles.ringInner}>
                <div className={styles.ringPct} style={{ color }}>{accuracy}%</div>
              </div>
            </div>
            <div className={styles.ringLbl}>{scoreLabel(accuracy)}</div>
          </div>
          <div className={styles.heroComment}>
            <p className={styles.heroCommentText} style={{ fontStyle: 'normal', color: 'var(--text-secondary)' }}>
              {spellingCount + missingCount + extraCount === 0
                ? 'Perfect score — no errors detected!'
                : `You made ${spellingCount + missingCount + extraCount} error${spellingCount + missingCount + extraCount !== 1 ? 's' : ''} across ${sentences.length} sentence${sentences.length !== 1 ? 's' : ''}.`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { v: String(totalWords), l: 'Words in original' },
            { v: `${accuracy}%`, l: 'Accuracy', color: color },
            { v: formatTime(timeSpent), l: 'Time spent' },
            { v: `${sentences.length}`, l: 'Sentences' },
          ].map(stat => (
            <div key={stat.l} className={styles.stat}>
              <div className={styles.statVal} style={stat.color ? { color: stat.color } : undefined}>
                {stat.v}
              </div>
              <div className={styles.statLbl}>{stat.l}</div>
            </div>
          ))}
        </div>

        {/* Error breakdown */}
        <div>
          <div className={styles.secTitle}>Error Breakdown</div>
          <div className={styles.breakdown}>
            <div className={`${styles.bdCard} ${styles.bdCardSpelling}`}>
              <div className={styles.bdCount}>{spellingCount}</div>
              <div className={styles.bdLbl}>Spelling errors</div>
              <div className={styles.bdDesc}>Words written incorrectly</div>
              {spellingErrors.length > 0 && (
                <div className={styles.chips}>
                  {spellingErrors.slice(0, 6).map(w => (
                    <span key={w} className={`${styles.chip} ${styles.chipSpelling}`}>{w}</span>
                  ))}
                </div>
              )}
            </div>
            <div className={`${styles.bdCard} ${styles.bdCardMissing}`}>
              <div className={styles.bdCount}>{missingCount}</div>
              <div className={styles.bdLbl}>Missing words</div>
              <div className={styles.bdDesc}>Words you didn't include</div>
              {missingWords.length > 0 && (
                <div className={styles.chips}>
                  {missingWords.slice(0, 6).map(w => (
                    <span key={w} className={`${styles.chip} ${styles.chipMissing}`}>{w}</span>
                  ))}
                </div>
              )}
            </div>
            <div className={`${styles.bdCard} ${styles.bdCardExtra}`}>
              <div className={styles.bdCount}>{extraCount}</div>
              <div className={styles.bdLbl}>Extra words</div>
              <div className={styles.bdDesc}>Words not in the original</div>
              {extraWords.length > 0 && (
                <div className={styles.chips}>
                  {extraWords.slice(0, 6).map(w => (
                    <span key={w} className={`${styles.chip} ${styles.chipExtra}`}>{w}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full text comparison */}
        <div>
          <div className={styles.secTitle}>Full Text Comparison</div>
          <div className={styles.diffCard}>
            <div className={styles.diffCardHdr}>
              <span>Word-level diff</span>
              <span>{sentences.length} sentence{sentences.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.diffBody}>
              {sentences.map((s, i) => (
                <div key={i} className={styles.diffSent}>
                  <div className={styles.diffMeta}>
                    <div className={`${styles.diffLbl} ${s.clean ? styles.diffLblClean : ''}`}>
                      {s.clean && <span>✓ </span>}Sentence {i + 1}
                    </div>
                    {!s.clean && (
                      <div className={styles.diffErrBadge}>
                        {s.errorCount} error{s.errorCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className={styles.diffWords}>
                    {s.tokens.flatMap((tok, j) => {
                      const cssBase = tok.cls === 'merge'
                        ? 'dwWrong'
                        : `dw${tok.cls.charAt(0).toUpperCase() + tok.cls.slice(1)}`;
                      const clsName = cssBase as keyof typeof styles;
                      const prefix = j > 0 ? ' ' : '';
                      const main = (
                        <span key={j} className={`${styles.dw} ${styles[clsName]}`}>
                          {prefix}{tok.text}
                        </span>
                      );
                      if ((tok.cls === 'wrong' || tok.cls === 'split' || tok.cls === 'merge' || tok.cls === 'punct') && tok.expected) {
                        return [
                          main,
                          <span key={`${j}c`} className={styles.dwCorrection}> → {tok.expected}</span>,
                        ];
                      }
                      return main;
                    })}
                    {s.tokens.length === 0 && (
                      <span className={styles.diffEmpty}>(not typed)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <div className={styles.rfooter}>
        <div className={styles.rfooterInner}>
          <button className={styles.btnG} onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
            Back to List
          </button>
          <button className={styles.btnP} onClick={onTryAgain}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Try Again
          </button>
        </div>
      </div>
    </>
  );
};
