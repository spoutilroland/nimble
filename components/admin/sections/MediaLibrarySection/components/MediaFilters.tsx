'use client';

import { useI18n } from '@/lib/i18n/context';
import type { SortMode, FilterUsage, FilterType } from '../hooks/useMediaLibrary';

interface MediaFiltersProps {
  sort: SortMode;
  setSort: (s: SortMode) => void;
  filterUsage: FilterUsage;
  setFilterUsage: (f: FilterUsage) => void;
  filterType: FilterType;
  setFilterType: (f: FilterType) => void;
  filterDimension: string;
  setFilterDimension: (d: string) => void;
  availableDimensions: { dim: string; count: number }[];
  totalCount: number;
}

export function MediaFilters({
  sort, setSort,
  filterUsage, setFilterUsage,
  filterType, setFilterType,
  filterDimension, setFilterDimension,
  availableDimensions,
  totalCount,
}: MediaFiltersProps) {
  const { t } = useI18n();

  const count = totalCount === 1
    ? t('mediaLibrary.count_one')
    : t('mediaLibrary.count_other').replace('{n}', String(totalCount));

  return (
    <div className="media-filters">
      <span className="media-filters-count">{count}</span>

      <div className="media-filters-group">
        {/* Filtre usage */}
        {(['all', 'used', 'orphan'] as FilterUsage[]).map((f) => (
          <button
            key={f}
            className={`media-filter-btn${filterUsage === f ? ' active' : ''}`}
            onClick={() => setFilterUsage(f)}
          >
            {t(`mediaLibrary.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as `mediaLibrary.${string}`)}
          </button>
        ))}

        <span className="media-filters-sep" />

        {/* Filtre type */}
        {(['all', 'jpg', 'png', 'webp', 'svg'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`media-filter-btn${filterType === f ? ' active' : ''}`}
            onClick={() => setFilterType(f)}
          >
            {t(`mediaLibrary.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as `mediaLibrary.${string}`)}
          </button>
        ))}

        {/* Filtre dimensions */}
        {availableDimensions.length > 1 && (
          <>
            <span className="media-filters-sep" />

            <select
              className="media-sort-select"
              value={filterDimension}
              onChange={(e) => setFilterDimension(e.target.value)}
            >
              <option value="all">{t('mediaLibrary.filterDimAll')}</option>
              {availableDimensions.map(({ dim, count: c }) => (
                <option key={dim} value={dim}>
                  {dim.replace('x', ' × ')} ({c})
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <select
        className="media-sort-select"
        value={sort}
        onChange={(e) => setSort(e.target.value as SortMode)}
      >
        <option value="newest">{t('mediaLibrary.sortNewest')}</option>
        <option value="oldest">{t('mediaLibrary.sortOldest')}</option>
        <option value="largest">{t('mediaLibrary.sortLargest')}</option>
        <option value="smallest">{t('mediaLibrary.sortSmallest')}</option>
      </select>
    </div>
  );
}
