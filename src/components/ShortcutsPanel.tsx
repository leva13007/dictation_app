import { useState } from 'react';
import styles from './ShortcutsPanel.module.css';

type Props = {
  onClose: (dontShowAgain: boolean) => void;
};

const SHORTCUTS = [
  { keys: 'Ctrl+Q', action: 'Previous sentence' },
  { keys: 'Ctrl+W', action: 'Play / Pause' },
  { keys: 'Ctrl+E', action: 'Replay from start' },
  { keys: 'Ctrl+R', action: 'Next sentence' },
  { keys: 'Ctrl+A', action: 'Toggle hint' },
] as const;

export const ShortcutsPanel = ({ onClose }: Props) => {
  const [dontShow, setDontShow] = useState(false);

  return (
    <div className={styles.backdrop} onClick={() => onClose(dontShow)}>
      <div className={styles.panel} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">

        <div className={styles.hdr}>
          <div className={styles.title}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Keyboard Shortcuts
          </div>
          <button className={styles.closeBtn} onClick={() => onClose(dontShow)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <table className={styles.table}>
            <tbody>
              {SHORTCUTS.map(s => (
                <tr key={s.keys}>
                  <td className={styles.tdKey}>
                    {s.keys.split('+').map((k, i) => (
                      <span key={k}>
                        {i > 0 && <span className={styles.plus}>+</span>}
                        <kbd className={styles.kbd}>{k}</kbd>
                      </span>
                    ))}
                  </td>
                  <td className={styles.tdAction}>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.hintNote}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
              <path d="M9 18h6"/><path d="M10 22h4"/>
            </svg>
            Hint shows the sentence text for ~7.5 s, then auto-hides.
          </div>
        </div>

        <div className={styles.footer}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              className={styles.checkbox}
            />
            Don't show again
          </label>
          <button className={styles.gotItBtn} onClick={() => onClose(dontShow)}>
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
