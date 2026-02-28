import { useEffect, useRef, useState } from 'react';
import { playlist } from './dics/0001/playlist';
import styles from './App.module.css';

const App = () => {

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentSentence = playlist[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (audio!.paused) {
      audio!.play();
    } else {
      audio!.pause()
    }
  }

  const rePlay = () => {
    if (audioRef?.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }

  const prev = () => {
    setCurrentIndex(prev => prev > 1 ? prev - 1 : 0);
    setShowHint(false);
  }
  const next = () => {
    setCurrentIndex(prev => prev < playlist.length - 1 ? prev + 1 : prev);
    setShowHint(false);
  }

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const setPlaybackSpeed = (rate: number) => {
    if (audioRef?.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate)
    }
  }

  const [showHint, setShowHint] = useState<boolean>(false);
  const hint = () => {
    setShowHint(prev => !prev)
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      
      const keyName = event.key;
      console.log("handler", keyName)
      if (event.ctrlKey) {        
        if (keyName === 'q') prev();
        if (keyName === 'w') play();
        if (keyName === 'e') rePlay();
        if (keyName === 'r') next();
        if (keyName === 'a') hint();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={styles.App}>
      <h1>Dictation!</h1>
      <div>{currentIndex + 1} / {playlist.length}</div>
      <div>Speed: {playbackRate}</div>
      <audio ref={audioRef} src={currentSentence.audio}></audio>
      <div className={styles.Controls}>
        <button onClick={prev}>Prev</button>
        <button onClick={play}>Play</button>
        <button onClick={rePlay}>RePlay</button>
        <button onClick={next}>Next</button>
      </div>
      <div className={styles.Controls}>
        <button onClick={() => setPlaybackSpeed(0.5)}>0.5</button>
        <button onClick={() => setPlaybackSpeed(0.75)}>0.75</button>
        <button onClick={() => setPlaybackSpeed(1)}>1</button>
        <button onClick={() => setPlaybackSpeed(1.25)}>1.25</button>
      </div>
      <div className={styles.Hint}>
        <button onClick={hint}>{showHint ? "Hide" : "Show"} Hint</button>
        <div className={showHint ? styles["HintText-show"] : styles["HintText-hide"]}>{playlist[currentIndex].text}</div>
      </div>
      <div className={styles.Input}>
        <textarea name="" id=""></textarea>
      </div>
    </div>
  )
}

export default App
