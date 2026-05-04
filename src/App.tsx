import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';

declare const __APP_VERSION__: string;

type PlaylistRecord = {
  id: number;
  text: string;
  audio: string;
};

type DicCatalogItem = {
  id: string;
  title: string;
};

type DicCatalog = {
  dics: DicCatalogItem[];
};

const DEFAULT_DIC_ID = '0002';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeSourceBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Source URL is required.');
  }
  const url = new URL(trimmed, window.location.href);
  return url.toString().replace(/\/?$/, '/');
};

const validateCatalog = (raw: unknown): DicCatalog => {
  if (!isRecord(raw) || !Array.isArray(raw.dics) || raw.dics.length === 0) {
    throw new Error('Invalid catalog format. Expected: { "dics": [{ "id": "0001", "title": "..." }] }');
  }

  const dics = raw.dics.map((item, index) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string') {
      throw new Error(`Invalid catalog item at index ${index}.`);
    }
    if (!/^\d{4}$/.test(item.id)) {
      throw new Error(`Dic id "${item.id}" is invalid. Expected 4 digits.`);
    }
    if (!item.title.trim()) {
      throw new Error(`Dic title at index ${index} cannot be empty.`);
    }

    return {
      id: item.id,
      title: item.title.trim(),
    };
  });

  return { dics };
};

const validatePlaylist = (raw: unknown): PlaylistRecord[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Playlist must be a non-empty JSON array.');
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid playlist record at index ${index}.`);
    }
    const id = item.id;
    const text = item.text;
    const audio = item.audio;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new Error(`Invalid playlist record id at index ${index}.`);
    }
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(`Invalid playlist text at index ${index}.`);
    }
    if (typeof audio !== 'string' || !audio.trim()) {
      throw new Error(`Invalid playlist audio path at index ${index}.`);
    }
    if (audio.startsWith('/')) {
      throw new Error(`Audio path "${audio}" is invalid. Use relative path like "dics/0001/sounds/0001-01.mp3".`);
    }
    if (!/\.mp3($|\?)/i.test(audio)) {
      throw new Error(`Audio path "${audio}" is invalid. Expected an .mp3 file.`);
    }

    return {
      id,
      text: text.trim(),
      audio: audio.replace(/^\.\//, ''),
    };
  });
};

const toAudioUrl = (sourceBaseUrl: string, audioPath: string): string => {
  if (/^https?:\/\//i.test(audioPath)) {
    return audioPath;
  }
  return new URL(audioPath, sourceBaseUrl).toString();
};

const App = () => {
  const dicId = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('dic');
    return value ?? DEFAULT_DIC_ID;
  }, []);
  const sourceFromQuery = useMemo(() => {
    return new URLSearchParams(window.location.search).get('source');
  }, []);
  const defaultSourceBase = useMemo(
    () => new URL(import.meta.env.BASE_URL, window.location.origin).toString().replace(/\/?$/, '/'), // https://leva13007.github.io/dictations
    [],
  );

  const [sourceInput, setSourceInput] = useState<string>(sourceFromQuery ?? defaultSourceBase);
  const [sourceBaseUrl, setSourceBaseUrl] = useState<string>(sourceFromQuery ?? defaultSourceBase);
  const [catalog, setCatalog] = useState<DicCatalogItem[]>([]);
  const [selectedDicId, setSelectedDicId] = useState<string>(dicId);
  const [catalogError, setCatalogError] = useState<string>('');
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);

  const [playlist, setPlaylist] = useState<PlaylistRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentSentence = playlist[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadCatalog = async (sourceUrl: string, preferredDicId?: string) => {
    try {
      setIsCatalogLoading(true);
      setCatalogError('');
      setPlaylist([]);
      setLoadError('');
      const catalogResponse = await fetch(new URL('dics/index.json', sourceUrl).toString());
      if (!catalogResponse.ok) {
        throw new Error(`Cannot load dics/index.json: HTTP ${catalogResponse.status}`);
      }
      const catalogData = validateCatalog(await catalogResponse.json());
      const resolvedDicId = preferredDicId && catalogData.dics.some(dic => dic.id === preferredDicId)
        ? preferredDicId
        : catalogData.dics[0].id;
      setCatalog(catalogData.dics);
      setSelectedDicId(resolvedDicId);
      setSourceBaseUrl(sourceUrl);
      setCurrentIndex(0);
      setShowHint(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setCatalogError(message);
      setCatalog([]);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    const initialSource = sourceFromQuery ?? defaultSourceBase;
    void loadCatalog(initialSource, dicId);
  }, [dicId, sourceFromQuery, defaultSourceBase]);

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!selectedDicId || !sourceBaseUrl) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch(new URL(`dics/${selectedDicId}/playlist.json`, sourceBaseUrl).toString());
        if (!response.ok) {
          throw new Error(`Cannot load playlist: HTTP ${response.status}`);
        }
        const data = validatePlaylist(await response.json());
        setPlaylist(data);
        setCurrentIndex(0);
        setShowHint(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlaylist();
  }, [selectedDicId, sourceBaseUrl]);

  const play = useCallback(() => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const rePlay = useCallback(() => {
    if (audioRef?.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    }
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex(prev => prev > 1 ? prev - 1 : 0);
    setShowHint(false);
  }, []);
  const next = useCallback(() => {
    console.log("Next", currentIndex, playlist.length)
    setCurrentIndex(prev => prev < playlist.length - 1 ? prev + 1 : prev);
    setShowHint(false);
  }, [playlist.length, currentIndex]);

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const setPlaybackSpeed = (rate: number) => {
    if (audioRef?.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const [showHint, setShowHint] = useState<boolean>(false);
  const hint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const keyName = event.key;
      console.log("Key", keyName, event.ctrlKey)
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
  }, [prev, play, rePlay, next, hint]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [currentIndex, playbackRate]);

  const all = () => {};

  const submitSource = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const normalizedSource = normalizeSourceBaseUrl(sourceInput);
      void loadCatalog(normalizedSource, selectedDicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid source URL.';
      setCatalogError(message);
    }
  };

  if (isCatalogLoading) {
    return (
      <div className={styles.App}>
        <h1>Dictation <small>v{__APP_VERSION__}</small></h1>
        <div>Loading source...</div>
      </div>
    );
  }

  return (
    <div className={styles.App}>
      <h1>Dictation <small>v{__APP_VERSION__}</small></h1>
      <form className={styles.SourceForm} onSubmit={submitSource}>
        <label htmlFor="source-url">Source URL</label>
        <input
          id="source-url"
          type="url"
          value={sourceInput}
          onChange={event => setSourceInput(event.target.value)}
          placeholder="https://leva13007.github.io/dictations"
          required
        />
        <button type="submit">Load Source</button>
      </form>

      {catalogError && <div className={styles.Error}>{catalogError}</div>}

      {catalog.length > 0 && (
        <div className={styles.Controls}>
          <label htmlFor="dic-select">Dic:</label>
          <select
            id="dic-select"
            value={selectedDicId}
            onChange={event => setSelectedDicId(event.target.value)}
          >
            {catalog.map(dic => (
              <option key={dic.id} value={dic.id}>
                {dic.id} - {dic.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && <div>Loading playlist {selectedDicId}...</div>}
      {loadError && <div className={styles.Error}>Failed to load playlist: {loadError}</div>}

      {!isLoading && !loadError && !!currentSentence && (
        <>
          <div>{currentIndex + 1} / {playlist.length}</div>
          <div>Speed: {playbackRate}</div>
          <audio ref={audioRef} src={toAudioUrl(sourceBaseUrl, currentSentence.audio)}></audio>
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
            <button onClick={() => setPlaybackSpeed(0.85)}>0.85</button>
            <button onClick={() => setPlaybackSpeed(1)}>1</button>
            <button onClick={() => setPlaybackSpeed(1.25)}>1.25</button>
          </div>
          <div className={styles.Hint}>
            <button onClick={hint}>{showHint ? "Hide" : "Show"} Hint</button>
            <div className={showHint ? styles["HintText-show"] : styles["HintText-hide"]}>{currentSentence.text}</div>
          </div>
          <div className={styles.Input}>
            <textarea></textarea>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
