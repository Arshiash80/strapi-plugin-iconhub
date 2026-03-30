import { type CSSProperties, memo, useMemo, useState } from 'react';
import { Box, Badge, Typography, Checkbox, Button, Field } from '@strapi/design-system';
import { Search, Cross } from '@strapi/icons';
import type { IconifyInfo } from '@iconify/types';
import { groupByCategory, sortCategories, type IconSetCollections } from '../libs/iconSetUtils';

type IconSetFilterPanelProps = {
  collections: IconSetCollections;
  selectedPrefixes: Set<string>;
  onSelectionChange: (prefixes: Set<string>) => void;
  isLoading: boolean;
};

const panelStyle: CSSProperties = {
  width: '280px',
  flexShrink: 0,
  overflowY: 'auto',
  borderRight: '1px solid #32324d33',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const categoryHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  padding: '8px 4px',
  borderRadius: '4px',
  userSelect: 'none',
};

const setRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 4px 4px 24px',
};

const IconSetFilterPanel = memo(
  ({ collections, selectedPrefixes, onSelectionChange, isLoading }: IconSetFilterPanelProps) => {
    const [searchFilter, setSearchFilter] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const grouped = useMemo(() => groupByCategory(collections), [collections]);
    const sortedCategories = useMemo(() => sortCategories(Object.keys(grouped)), [grouped]);
    const allPrefixes = useMemo(() => Object.keys(collections), [collections]);

    // Filter sets by search query
    const filteredGrouped = useMemo(() => {
      if (!searchFilter.trim()) return grouped;

      const query = searchFilter.toLowerCase();
      const result: typeof grouped = {};

      for (const [category, sets] of Object.entries(grouped)) {
        const filtered: IconSetCollections = {};
        for (const [prefix, info] of Object.entries(sets)) {
          if (
            prefix.toLowerCase().includes(query) ||
            info.name.toLowerCase().includes(query)
          ) {
            filtered[prefix] = info;
          }
        }
        if (Object.keys(filtered).length > 0) {
          result[category] = filtered;
        }
      }
      return result;
    }, [grouped, searchFilter]);

    const filteredCategories = useMemo(
      () => sortCategories(Object.keys(filteredGrouped)),
      [filteredGrouped]
    );

    const toggleCategory = (category: string) => {
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }
        return next;
      });
    };

    const handleSelectAll = () => {
      onSelectionChange(new Set(allPrefixes));
    };

    const handleDeselectAll = () => {
      onSelectionChange(new Set());
    };

    const handleTogglePrefix = (prefix: string) => {
      const next = new Set(selectedPrefixes);
      if (next.has(prefix)) {
        next.delete(prefix);
      } else {
        next.add(prefix);
      }
      onSelectionChange(next);
    };

    const handleToggleCategory = (category: string) => {
      const categoryPrefixes = Object.keys(grouped[category] || {});
      const allSelected = categoryPrefixes.every((p) => selectedPrefixes.has(p));

      const next = new Set(selectedPrefixes);
      if (allSelected) {
        categoryPrefixes.forEach((p) => next.delete(p));
      } else {
        categoryPrefixes.forEach((p) => next.add(p));
      }
      onSelectionChange(next);
    };

    const getCategoryCheckState = (
      category: string
    ): boolean | 'indeterminate' => {
      const categoryPrefixes = Object.keys(grouped[category] || {});
      if (categoryPrefixes.length === 0) return false;
      const selectedCount = categoryPrefixes.filter((p) => selectedPrefixes.has(p)).length;
      if (selectedCount === 0) return false;
      if (selectedCount === categoryPrefixes.length) return true;
      return 'indeterminate';
    };

    if (isLoading) {
      return (
        <div style={panelStyle}>
          <Typography variant="pi" style={{ textAlign: 'center', padding: '20px 0' }}>
            Loading icon sets...
          </Typography>
        </div>
      );
    }

    return (
      <div style={panelStyle}>
        {/* Search filter */}
        <Field.Root name="filterSearch">
          <Field.Input
            placeholder="Search icon sets..."
            value={searchFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchFilter(e.target.value)}
            startAction={<Search width={14} height={14} />}
            endAction={
              searchFilter ? (
                <Cross
                  width={14}
                  height={14}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSearchFilter('')}
                />
              ) : undefined
            }
            style={{ fontSize: '13px' }}
          />
        </Field.Root>

        {/* Select All / Deselect All */}
        <Box style={{ display: 'flex', gap: '8px' }}>
          <Button variant="tertiary" size="S" onClick={handleSelectAll} style={{ flex: 1, fontSize: '12px' }}>
            Select All
          </Button>
          <Button variant="tertiary" size="S" onClick={handleDeselectAll} style={{ flex: 1, fontSize: '12px' }}>
            Deselect All
          </Button>
        </Box>

        <Typography variant="pi" style={{ fontSize: '11px', opacity: 0.6 }}>
          {selectedPrefixes.size} of {allPrefixes.length} icon sets selected
        </Typography>

        {/* Category list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.has(category);
            const categoryPrefixes = Object.keys(filteredGrouped[category] || {});
            const checkState = getCategoryCheckState(category);

            return (
              <div key={category}>
                {/* Category header */}
                <div
                  style={categoryHeaderStyle}
                  onClick={() => toggleCategory(category)}
                >
                  <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Typography variant="pi" style={{ fontSize: '11px', opacity: 0.5, width: '12px' }}>
                      {isExpanded ? '\u25BC' : '\u25B6'}
                    </Typography>
                    <Checkbox
                      checked={checkState}
                      onCheckedChange={() => handleToggleCategory(category)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                    <Typography variant="pi" style={{ fontWeight: 600, fontSize: '13px' }}>
                      {category}
                    </Typography>
                  </Box>
                  <Badge>{categoryPrefixes.length}</Badge>
                </div>

                {/* Expanded set list */}
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {categoryPrefixes.map((prefix) => {
                      const info = filteredGrouped[category][prefix];
                      return (
                        <div key={prefix} style={setRowStyle}>
                          <Checkbox
                            checked={selectedPrefixes.has(prefix)}
                            onCheckedChange={() => handleTogglePrefix(prefix)}
                          />
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="pi"
                              style={{
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'block',
                              }}
                              title={`${info.name} (${prefix})`}
                            >
                              {info.name}
                            </Typography>
                          </Box>
                          <Typography variant="pi" style={{ fontSize: '11px', opacity: 0.5, flexShrink: 0 }}>
                            {info.total}
                          </Typography>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

IconSetFilterPanel.displayName = 'IconSetFilterPanel';

export default IconSetFilterPanel;
