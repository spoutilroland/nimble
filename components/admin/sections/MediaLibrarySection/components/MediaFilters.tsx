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

  const filterBtnClass = (active: boolean) =>
    `bg-transparent border border-[var(--bo-border)] text-[var(--bo-text-dim)] px-[0.6rem] py-[0.25rem] rounded-[var(--bo-radius-sm,4px)] cursor-pointer text-[0.8rem] transition-all duration-150 hover:border-[var(--bo-border-hover)] hover:text-[var(--bo-text)]${active ? ' media-filter-btn-active bg-[var(--bo-green)] !border-[var(--bo-green)] !text-[#0e1018] font-semibold' : ''}`;

  const sortSelectClass = 'bg-[var(--bo-surface)] border border-[var(--bo-border)] text-[var(--bo-text)] px-2 py-[0.25rem] rounded-[var(--bo-radius-sm,4px)] text-[0.8rem] cursor-pointer';

  return (
    <div className="flex items-center gap-[0.6rem] flex-wrap mb-4 text-[0.82rem]">
      <span className="text-[var(--bo-text-dim)] whitespace-nowrap">{count}</span>

      <div className="flex items-center gap-[0.3rem]">
        {/* Filtre usage */}
        {(['all', 'used', 'orphan'] as FilterUsage[]).map((f) => (
          <button
            key={f}
            className={filterBtnClass(filterUsage === f)}
            onClick={() => setFilterUsage(f)}
          >
            {t(`mediaLibrary.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as `mediaLibrary.${string}`)}
          </button>
        ))}

        <span className="w-px h-4 bg-[var(--bo-border)] mx-[0.3rem]" />

        {/* Filtre type */}
        {(['all', 'jpg', 'png', 'webp', 'svg'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={filterBtnClass(filterType === f)}
            onClick={() => setFilterType(f)}
          >
            {t(`mediaLibrary.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as `mediaLibrary.${string}`)}
          </button>
        ))}

        {/* Filtre dimensions */}
        {availableDimensions.length > 1 && (
          <>
            <span className="w-px h-4 bg-[var(--bo-border)] mx-[0.3rem]" />

            <select
              className={sortSelectClass}
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
        className={`${sortSelectClass} ml-auto`}
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
