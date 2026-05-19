import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import {
  type PlaylistRecord,
  SOURCE_BASE_URL,
  toAudioUrl,
  validatePlaylist,
} from '../types';
import styles from './PlayerPage.module.css';

const SPEEDS = [0.75, 1, 1.25] as const;

export const PlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const [showHint, setShowHint] = useState(false);
  const [hintProgress, setHintProgress] = useState(100);
  const hintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [readingMode, setReadingMode] = useState(false);
  const [readingView, setReadingView] = useState<'sentence' | 'full'>('sentence');

  const [text, setText] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        // Fetch catalog to get title + level
        const catalogRes = await fetch(`${SOURCE_BASE_URL}dics/index.json`);
        if (!catalogRes.ok) throw new Error(`HTTP ${catalogRes.status}`);
        const catalog = await catalogRes.json() as { dics: Array<{ id: string; title: string; level: string }> };
        const entry = catalog.dics.find(d => d.id === id);
        if (entry) { setTitle(entry.title); setLevel(entry.level); }

        const playlistRes = await fetch(`${SOURCE_BASE_URL}dics/${id}/playlist.json`);
        if (!playlistRes.ok) throw new Error(`HTTP ${playlistRes.status}`);
        const data = validatePlaylist(await playlistRes.json());
        setPlaylist(data);
        setCurrentIndex(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const currentSentence = playlist[currentIndex];

  // Reset audio progress when track changes
  useEffect(() => {
    setAudioProgress(0);
    setPlaying(false);
    setShowHint(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [currentIndex, speed]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      if (audio.duration) setAudioProgress((audio.currentTime / audio.duration) * 100);
    };
    const onDurationChange = () => setAudioDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setAudioProgress(0); };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSentence]);

  // Hint timer
  useEffect(() => {
    if (!showHint) {
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
      return;
    }
    setHintProgress(100);
    hintTimerRef.current = setInterval(() => {
      setHintProgress(p => {
        if (p <= 0) {
          clearInterval(hintTimerRef.current!);
          setShowHint(false);
          return 0;
        }
        return p - 2;
      });
    }, 150);
    return () => {
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    };
  }, [showHint]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const replay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play();
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex(i => Math.min(playlist.length - 1, i + 1));
  }, [playlist.length]);

  const toggleHint = useCallback(() => setShowHint(h => !h), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 'q') { e.preventDefault(); prev(); }
        if (e.key === 'w') { e.preventDefault(); togglePlay(); }
        if (e.key === 'e') { e.preventDefault(); replay(); }
        if (e.key === 'r') { e.preventDefault(); next(); }
        if (e.key === 'a') { e.preventDefault(); toggleHint(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, togglePlay, replay, next, toggleHint]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const overallPct = playlist.length > 0 ? Math.round(((currentIndex + 1) / playlist.length) * 100) : 0;
  const currentTime = audioRef.current ? audioRef.current.currentTime : 0;

  if (loading) {
    return (
      <div className={styles.layout}>
        <TopBar />
        <main className={styles.loadingState}>Loading dictation…</main>
      </div>
    );
  }

  if (error || !currentSentence) {
    return (
      <div className={styles.layout}>
        <TopBar />
        <main className={styles.loadingState}>
          <p style={{ color: 'var(--error)' }}>{error || 'Playlist not found.'}</p>
          <button className={styles.backBtn} onClick={() => navigate('/list')}>← Back to list</button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <TopBar />

      {/* Context bar */}
      <div className={styles.ctxBar}>
        <div className={styles.ctxRow}>
          <button className={styles.ibtn} aria-label="Back to list" onClick={() => navigate('/list')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={styles.phInfo}>
            <div className={styles.phTitle}>{title}</div>
            <div className={styles.phMeta}>
              <span className={styles.lvlBadge}>{level}</span>
              <span className={styles.counter}>{currentIndex + 1} / {playlist.length}</span>
            </div>
          </div>
          <div className={styles.phActions}>
            <button
              className={`${styles.ibtn} ${readingMode ? styles.ibtnOn : ''}`}
              aria-label="Toggle reading mode"
              onClick={() => setReadingMode(m => !m)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.progStrip}>
          <div className={styles.progFill} style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Hidden audio element */}
      {currentSentence && (
        <audio
          ref={audioRef}
          key={currentSentence.audio}
          src={toAudioUrl(currentSentence.audio, `${SOURCE_BASE_URL}dics/${id}/sounds/`)}
          preload="auto"
        />
      )}

      {/* Main content */}
      <main className={styles.pmain}>

        {/* Hint panel */}
        {showHint && (
          <div className={styles.hintPanel} key="hint">
            <div className={styles.hintHdr}>
              <div className={styles.hintLabel}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                  <path d="M9 18h6"/><path d="M10 22h4"/>
                </svg>
                Hint · Sentence {currentIndex + 1}
              </div>
              <button className={styles.ibtnSm} onClick={() => setShowHint(false)} aria-label="Close hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.hintTimer}>
              <div className={styles.hintTimerFill} style={{ width: `${hintProgress}%` }} />
            </div>
            <div className={styles.hintText}>{currentSentence.text}</div>
          </div>
        )}

        {/* Reading mode panel */}
        {readingMode && (
          <div className={styles.rp} key="reading">
            <div className={styles.rpHdr}>
              <div className={styles.rpLabel}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Reading Mode
              </div>
              <div className={styles.seg}>
                <button className={`${styles.segBtn} ${readingView === 'sentence' ? styles.segBtnOn : ''}`} onClick={() => setReadingView('sentence')}>Sentence</button>
                <button className={`${styles.segBtn} ${readingView === 'full' ? styles.segBtnOn : ''}`} onClick={() => setReadingView('full')}>Full Text</button>
              </div>
            </div>
            {readingView === 'sentence' ? (
              <div className={styles.rpSentence}>
                <p className={styles.rpSentenceText}>{currentSentence.text}</p>
              </div>
            ) : (
              <div className={styles.rpFull}>
                {playlist.map((s, i) => (
                  <div key={s.id} className={`${styles.rpItem} ${i === currentIndex ? styles.rpItemOn : ''}`}>
                    <span className={styles.rpNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Textarea */}
        <div className={styles.inputWrap}>
          <div className={styles.inputTop}>
            <label className={styles.inputLbl} htmlFor="dta">Your dictation</label>
            <span className={styles.inputMeta}>{text.split('\n').filter(l => l.trim()).length} lines typed</span>
          </div>
          <textarea
            id="dta"
            className={styles.dta}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type what you hear… (all sentences go here)"
            spellCheck={false}
            rows={10}
          />
        </div>

        {/* Action bar */}
        <div className={styles.abar}>
          <button className={styles.btnG} onClick={toggleHint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
              <path d="M9 18h6"/><path d="M10 22h4"/>
            </svg>
            Hint
          </button>
          <button className={styles.btnP} disabled={!text.trim()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Check answer
          </button>
        </div>

      </main>

      {/* Player bar */}
      <footer className={styles.pbar} aria-label="Audio player">
        <div className={styles.pbarProg}>
          <div className={styles.pbarProgFill} style={{ width: `${audioProgress}%` }} />
        </div>
        <div className={styles.pbarInner}>
          <div className={styles.pcontrols}>
            <button className={styles.ibtn} aria-label="Previous sentence" onClick={prev} disabled={currentIndex === 0}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>
              </svg>
            </button>
            <button className={styles.playBtn} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
            <button className={styles.ibtn} aria-label="Next sentence" onClick={next} disabled={currentIndex === playlist.length - 1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>
              </svg>
            </button>
            <button className={styles.ibtn} aria-label="Replay" onClick={replay}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
          <div className={styles.ptrack}>
            <div className={styles.ptrackBar}>
              <div className={styles.ptrackFill} style={{ width: `${audioProgress}%` }} />
            </div>
            <span className={styles.ptime}>
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          </div>
          <div className={styles.pextras}>
            <div className={styles.speedGrp}>
              {SPEEDS.map(s => (
                <button
                  key={s}
                  className={`${styles.spill} ${speed === s ? styles.spillOn : ''}`}
                  onClick={() => {
                    setSpeed(s);
                    if (audioRef.current) audioRef.current.playbackRate = s;
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
