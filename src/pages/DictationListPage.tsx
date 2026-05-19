import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { type DicCatalogItem, SOURCE_BASE_URL, formatDuration } from '../types';
import styles from './DictationListPage.module.css';

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type SortOption = 'az' | 'level';

const fetchCatalog = async (): Promise<DicCatalogItem[]> => {
  const res = await fetch(`${SOURCE_BASE_URL}dics/index.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { dics: DicCatalogItem[] };
  return data.dics;
};

export const DictationListPage = () => {
  const [dics, setDics] = useState<DicCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string>('All');
  const [sort, setSort] = useState<SortOption | ''>('');

  useEffect(() => {
    setLoading(true);
    fetchCatalog()
      .then(setDics)
      .catch(e => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = dics;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q));
    }
    if (level !== 'All') {
      result = result.filter(d => d.level === level);
    }
    if (sort === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'level') {
      const order: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
      result = [...result].sort((a, b) => (order[a.level] ?? 0) - (order[b.level] ?? 0));
    }
    return result;
  }, [dics, search, level, sort]);

  return (
    <div className={styles.layout}>
      <TopBar />
      <main className={styles.main} id="main-content">
        <div className={styles.heading}>
          <h1 className={styles.headingTitle}>My Dictations</h1>
          <p className={styles.headingSub}>Practice makes perfect. Choose a dictation to begin.</p>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterTop}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search by title…"
                aria-label="Search dictations"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className={styles.searchClear} aria-label="Clear search" onClick={() => setSearch('')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <div className={styles.filterGroups}>
              <div className={styles.filterGroup}>
                <label htmlFor="filter-sort" className={styles.filterLabel}>Sort</label>
                <select
                  id="filter-sort"
                  className={styles.filterSelect}
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption | '')}
                >
                  <option value="">Default</option>
                  <option value="az">A → Z</option>
                  <option value="level">By level</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.filterBottom}>
            <fieldset className={styles.filterGroup} aria-label="Filter by CEFR level">
              <legend className={styles.filterLabel}>Level</legend>
              <div className={styles.pills} role="group">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    type="button"
                    className={`${styles.pill} ${level === l ? styles.pillActive : ''}`}
                    aria-pressed={level === l}
                    onClick={() => setLevel(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <p className={styles.count}>
              <strong>{filtered.length}</strong> dictation{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading && <p className={styles.message}>Loading dictations…</p>}
        {error && <p className={styles.errorMsg}>Error: {error}</p>}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>No dictations found.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map(dic => (
                  <DictationCard key={dic.id} dic={dic} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>Dictify</span>
          <span className={styles.footerCopy}>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

const DictationCard = ({ dic }: { dic: DicCatalogItem }) => {
  return (
    <Link to={`/player/${dic.id}`} className={styles.card} data-status="not-started">
      <div className={styles.cardHeader}>
        <div className={styles.cardBadges}>
          <span className={styles.cardLang}>EN</span>
          <span className={styles.badge} data-level={dic.level}>{dic.level}</span>
          <span className={`${styles.cardStatus} ${styles.cardStatusPending}`}>Not started</span>
        </div>
      </div>
      <h2 className={styles.cardTitle}>{dic.title}</h2>
      <div className={styles.cardTags}>
        {dic.tags.map(tag => (
          <span key={tag} className={styles.cardTag}>{tag}</span>
        ))}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardMetaItem}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
          </svg>
          {dic.sentences} sentences
        </span>
        <span className={styles.cardMetaItem}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatDuration(dic.duration_sec)}
        </span>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardSource}>dictify-en</span>
        <span className={styles.cardId}>#{dic.id}</span>
      </div>
      <div className={styles.cardPlay} tabIndex={-1} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    </Link>
  );
};
