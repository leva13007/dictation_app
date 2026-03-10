import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';

type PlaylistRecord = {
  id: number;
  text: string;
  audio: string;
};

const DEFAULT_DIC_ID = '0002';

const App = () => {
  const dicId = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('dic');
    return value ?? DEFAULT_DIC_ID;
  }, []);
  const [playlist, setPlaylist] = useState<PlaylistRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentSentence = playlist[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch(`${import.meta.env.BASE_URL}dics/${dicId}/playlist.json`);
        if (!response.ok) {
          throw new Error(`Cannot load playlist: HTTP ${response.status}`);
        }
        const data = (await response.json()) as PlaylistRecord[];
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Playlist is empty or invalid.');
        }
        setPlaylist(data);
        setCurrentIndex(0);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlaylist();
  }, [dicId]);

  const play = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const rePlay = () => {
    if (audioRef?.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    }
  };

  const prev = () => {
    setCurrentIndex(prev => prev > 1 ? prev - 1 : 0);
    setShowHint(false);
  };
  const next = () => {
    setCurrentIndex(prev => prev < playlist.length - 1 ? prev + 1 : prev);
    setShowHint(false);
  };

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const setPlaybackSpeed = (rate: number) => {
    if (audioRef?.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const [showHint, setShowHint] = useState<boolean>(false);
  const hint = () => {
    setShowHint(prev => !prev);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const keyName = event.key;
      if (event.ctrlKey) {
        if (keyName === 'q') prev();
        if (keyName === 'w') play();
        if (keyName === 'e') rePlay();
        if (keyName === 'r') next();
        if (keyName === 'a') hint();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [currentIndex, playbackRate]);

  const all = () => {};

  if (isLoading) {
    return (
      <div className={styles.App}>
        <h1>Dictation!</h1>
        <div>Loading playlist {dicId}...</div>
      </div>
    );
  }

  if (loadError || !currentSentence) {
    return (
      <div className={styles.App}>
        <h1>Dictation!</h1>
        <div>Failed to load playlist {dicId}.</div>
        <div>{loadError || 'No sentences found.'}</div>
      </div>
    );
  }

  return (
    <div className={styles.App}>
      <h1>Dictation!</h1>
      <div>{currentIndex + 1} / {playlist.length}</div>
      <div>Speed: {playbackRate}</div>
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}${currentSentence.audio}`}></audio>
      <div className={styles.Controls}>
        <button onClick={prev}>Prev</button>
        <button onClick={play}>Play</button>
        <button onClick={rePlay}>RePlay</button>
        <button onClick={next}>Next</button>
        <button onClick={all}>All</button>
      </div>
      <div className={styles.Controls}>
        <button onClick={() => setPlaybackSpeed(0.5)}>0.5</button>
        <button onClick={() => setPlaybackSpeed(0.75)}>0.75</button>
        <button onClick={() => setPlaybackSpeed(1)}>1</button>
        <button onClick={() => setPlaybackSpeed(1.25)}>1.25</button>
      </div>
      <div className={styles.Hint}>
        <button onClick={hint}>{showHint ? "Hide" : "Show"} Hint</button>
        <div className={showHint ? styles["HintText-show"] : styles["HintText-hide"]}>{currentSentence.text}</div>
      </div>
      <div className={styles.Input}>
        <textarea name="" id=""></textarea>
      </div>
    </div>
  )
}

export default App
