import { type CSSProperties, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Field, Modal, NumberInput, Textarea, TextInput, Typography } from '@strapi/design-system';
import { ArrowLeft, Cross, Download, Pencil, Search } from '@strapi/icons';
import { Icon, getIcon } from '@iconify/react';
import type { IconifyInfo } from '@iconify/types';
import debounce from 'lodash/debounce';
import { useTheme } from 'styled-components';
import IconGrid from './IconGrid';
import IconPickerIcon from './IconPickerIcon';
import IconSetCard from './IconSetCard';
import { getIconsInCollection, searchIcon, type IconifySearchOptions } from '../libs/iconifyApi';
import { useIconCollections } from '../hooks/useIconCollections';
import { filterByAllowedPrefixes, groupByCategory, slugifyCategory, sortCategories } from '../libs/iconSetUtils';

type IconInputValue = {
  iconName: string | null;
  iconData: string | null;
  width: number | null;
  height: number | null;
  color: string | null | undefined;
  isSvgEditable?: boolean;
  isIconNameEditable?: boolean;
};

type IconInputProps = {
  attribute: { type: string; customField: string; options: Record<string, unknown> };
  description: unknown;
  placeholder: unknown;
  hint: string;
  name: string;
  intlLabel: unknown;
  onChange: (event: { target: { name: string; value: unknown; type: string } }) => void;
  contentTypeUID: string;
  type: string;
  value: IconInputValue;
  required: boolean;
  error: unknown;
  disabled: boolean;
  label: string;
};

type PickerView = 'collections' | 'global-search' | 'set-browser';
type PaletteFilter = 'all' | 'mono' | 'multicolor';
type SearchStyleFilter = 'any' | 'fill' | 'stroke';
type CollectionData = NonNullable<Awaited<ReturnType<typeof getIconsInCollection>>['data']>;

const ICON_PAGE_SIZE = 120;
type ThemeColors = {
  alternative100: string;
  neutral0: string;
  neutral100: string;
  neutral150: string;
  neutral200: string;
  neutral300: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral1000: string;
  primary100: string;
  primary500: string;
  primary600: string;
};

type ThemeShape = {
  colors: ThemeColors;
  shadows: {
    popupShadow: string;
  };
};

const getInputSurfaceStyle = (theme: ThemeShape): CSSProperties => ({
  width: '100%',
  height: '40px',
  borderRadius: '8px',
  border: `1px solid ${theme.colors.neutral200}`,
  background: theme.colors.neutral0,
  color: theme.colors.neutral1000,
  padding: '0 12px',
});

const getSelectSurfaceStyle = (theme: ThemeShape): CSSProperties => ({
  ...getInputSurfaceStyle(theme),
  width: 'auto',
  minWidth: '160px',
  paddingRight: '28px',
});

const getToolbarButtonStyle = (theme: ThemeShape, active: boolean): CSSProperties => ({
  height: '40px',
  borderRadius: '999px',
  padding: '0 14px',
  border: `1px solid ${active ? theme.colors.primary500 : theme.colors.neutral200}`,
  background: active ? theme.colors.primary100 : theme.colors.neutral0,
  color: active ? theme.colors.primary600 : theme.colors.neutral1000,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontWeight: active ? 700 : 500,
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

const getChipStyle = (theme: ThemeShape, active: boolean): CSSProperties => ({
  height: '34px',
  borderRadius: '999px',
  padding: '0 14px',
  border: `1px solid ${active ? theme.colors.primary500 : theme.colors.neutral200}`,
  background: active ? theme.colors.primary100 : theme.colors.neutral0,
  color: active ? theme.colors.primary600 : theme.colors.neutral800,
  fontSize: '12px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  fontWeight: active ? 700 : 500,
});

const getDropdownPanelStyle = (theme: ThemeShape): CSSProperties => ({
  position: 'absolute',
  top: '50px',
  left: 0,
  zIndex: 20,
  minWidth: '280px',
  maxWidth: '420px',
  padding: '14px',
  borderRadius: '14px',
  border: `1px solid ${theme.colors.neutral200}`,
  background: theme.colors.neutral0,
  boxShadow: theme.shadows.popupShadow,
});

const getSectionLabelStyle = (theme: ThemeShape): CSSProperties => ({
  fontSize: '12px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: theme.colors.neutral600,
});

const getPanelStyle = (theme: ThemeShape): CSSProperties => ({
  background: theme.colors.neutral0,
  border: `1px solid ${theme.colors.neutral200}`,
  borderRadius: '16px',
  padding: '18px',
});

const getSoftPanelStyle = (theme: ThemeShape): CSSProperties => ({
  background: theme.colors.neutral100,
  border: `1px solid ${theme.colors.neutral150}`,
  borderRadius: '14px',
  padding: '16px',
});

const getToolbarMetaStyle = (theme: ThemeShape): CSSProperties => ({
  fontSize: '12px',
  color: theme.colors.neutral600,
  lineHeight: 1.5,
});

const getSubtleDividerStyle = (theme: ThemeShape): CSSProperties => ({
  borderBottom: `1px solid ${theme.colors.neutral200}`,
});

const blockTitleStyle: CSSProperties = {
  display: 'block',
  lineHeight: 1.15,
  marginBottom: '6px',
};

const blockMetaStyle: CSSProperties = {
  display: 'block',
};

const getLicenseTitle = (info: IconifyInfo) => {
  if (typeof info.license === 'string') return info.license;
  return info.license?.title || info.license?.spdx || 'License unknown';
};

const getCollectionTags = (info: IconifyInfo) => {
  return Array.isArray(info.tags) ? info.tags : [];
};

const getCollectionGridLabels = (height?: number | number[]) => {
  if (!height) return ['mixed'];
  if (Array.isArray(height)) {
    return height.length === 1 ? [String(height[0])] : ['mixed'];
  }
  return [String(height)];
};

const normalizeSetIcons = (data: CollectionData, prefix: string) => {
  const withPrefix = (icon: string) => `${prefix}:${icon}`;
  const allIcons = (data.uncategorized ?? []).map(withPrefix);
  const byCategory = Object.fromEntries(
    Object.entries(data.categories ?? {}).map(([category, icons]) => [category, icons.map(withPrefix)])
  ) as Record<string, string[]>;

  return {
    allIcons,
    byCategory,
  };
};

const IconInput = forwardRef<HTMLButtonElement, IconInputProps>(
  ({ hint, name, value, required, label, ...props }, forwardedRef) => {
    const theme = useTheme() as ThemeShape;
    const [iconData, setIconData] = useState<IconInputValue | null>(value);
    const [editableIconData, setEditableIconData] = useState<IconInputValue | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [infoModalOpen, setInfoModalOpen] = useState(false);

    const [view, setView] = useState<PickerView>('collections');
    const [openFilterPanel, setOpenFilterPanel] = useState<'tag' | 'grid' | 'meta' | null>(null);

    const [collectionSearch, setCollectionSearch] = useState('');
    const [selectedCollectionCategory, setSelectedCollectionCategory] = useState<string>('all');
    const [selectedCollectionTags, setSelectedCollectionTags] = useState<Set<string>>(new Set());
    const [selectedCollectionGrid, setSelectedCollectionGrid] = useState<string>('all');
    const [selectedCollectionPalette, setSelectedCollectionPalette] = useState<PaletteFilter>('all');
    const [selectedCollectionLicense, setSelectedCollectionLicense] = useState<string>('all');
    const [tagSearch, setTagSearch] = useState('');

    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [globalSearchCategory, setGlobalSearchCategory] = useState<string>('all');
    const [globalSearchPalette, setGlobalSearchPalette] = useState<PaletteFilter>('all');
    const [globalSearchStyle, setGlobalSearchStyle] = useState<SearchStyleFilter>('any');
    const [globalSearchResults, setGlobalSearchResults] = useState<string[]>([]);
    const [globalSearchStartIndex, setGlobalSearchStartIndex] = useState(0);
    const [globalSearchHasMore, setGlobalSearchHasMore] = useState(false);
    const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false);

    const [currentCollectionPrefix, setCurrentCollectionPrefix] = useState<string | null>(null);
    const [currentCollectionData, setCurrentCollectionData] = useState<CollectionData | null>(null);
    const [setSearchQuery, setSetSearchQuery] = useState('');
    const [setCategoryFilter, setSetCategoryFilter] = useState<string>('all');
    const [setVisibleCount, setSetVisibleCount] = useState(ICON_PAGE_SIZE);
    const [isSetLoading, setIsSetLoading] = useState(false);

    const [viewportWidth, setViewportWidth] = useState<number>(() =>
      typeof window === 'undefined' ? 1280 : window.innerWidth
    );

    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const globalSearchLoadLockRef = useRef(false);

    const inputSurfaceStyle = useMemo(() => getInputSurfaceStyle(theme), [theme]);
    const selectSurfaceStyle = useMemo(() => getSelectSurfaceStyle(theme), [theme]);
    const dropdownPanelStyle = useMemo(() => getDropdownPanelStyle(theme), [theme]);
    const sectionLabelStyle = useMemo(() => getSectionLabelStyle(theme), [theme]);
    const panelStyle = useMemo(() => getPanelStyle(theme), [theme]);
    const softPanelStyle = useMemo(() => getSoftPanelStyle(theme), [theme]);
    const toolbarMetaStyle = useMemo(() => getToolbarMetaStyle(theme), [theme]);
    const subtleDividerStyle = useMemo(() => getSubtleDividerStyle(theme), [theme]);

    const options = props.attribute.options;
    const storeIconData = options?.storeIconData ?? true;
    const storeIconName = options?.storeIconName ?? true;

    const { collections: allCollections, isLoading: collectionsLoading } = useIconCollections();

    const allowedPrefixes = useMemo(() => {
      if (!options || !allCollections) return undefined;

      const grouped = groupByCategory(allCollections);
      const enabledPrefixes: string[] = [];
      const categoryKeys = Object.keys(options).filter((key) => key.startsWith('category_'));

      if (categoryKeys.length === 0) return undefined;

      for (const [category, sets] of Object.entries(grouped)) {
        const slug = slugifyCategory(category);
        if (options[`category_${slug}`] === true) {
          enabledPrefixes.push(...Object.keys(sets));
        }
      }

      return enabledPrefixes.length > 0 ? enabledPrefixes : undefined;
    }, [allCollections, options]);

    const collections = useMemo(() => {
      if (!allCollections) return null;
      return filterByAllowedPrefixes(allCollections, allowedPrefixes);
    }, [allCollections, allowedPrefixes]);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      const handleResize = () => setViewportWidth(window.innerWidth);
      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const activePrefixes = useMemo(() => {
      if (!collections) return allowedPrefixes ?? [];
      return Object.keys(collections);
    }, [allowedPrefixes, collections]);

    const allowedCollections = useMemo(() => {
      if (!collections) return [];
      return Object.entries(collections).map(([prefix, info]) => ({ prefix, info }));
    }, [collections]);

    const allowedCategories = useMemo(
      () => sortCategories(Array.from(new Set(allowedCollections.map(({ info }) => info.category || 'Uncategorized')))),
      [allowedCollections]
    );

    const availableCollectionTags = useMemo(() => {
      const frequency = new Map<string, number>();

      for (const { info } of allowedCollections) {
        for (const tag of getCollectionTags(info)) {
          frequency.set(tag, (frequency.get(tag) || 0) + 1);
        }
      }

      return Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([tag]) => tag);
    }, [allowedCollections]);

    const availableGridOptions = useMemo(() => {
      const values = new Set<string>();
      for (const { info } of allowedCollections) {
        for (const grid of getCollectionGridLabels(info.height)) {
          values.add(grid);
        }
      }

      return Array.from(values).sort((a, b) => {
        if (a === 'mixed') return 1;
        if (b === 'mixed') return -1;
        return Number(a) - Number(b);
      });
    }, [allowedCollections]);

    const availableLicenses = useMemo(
      () =>
        Array.from(new Set(allowedCollections.map(({ info }) => getLicenseTitle(info)))).sort((a, b) =>
          a.localeCompare(b)
        ),
      [allowedCollections]
    );

    const filteredCollections = useMemo(() => {
      const searchTerm = collectionSearch.trim().toLowerCase();
      const filtered = allowedCollections.filter(({ info, prefix }) => {
        const category = info.category || 'Uncategorized';
        if (selectedCollectionCategory !== 'all' && category !== selectedCollectionCategory) return false;
        if (selectedCollectionPalette === 'mono' && info.palette) return false;
        if (selectedCollectionPalette === 'multicolor' && !info.palette) return false;
        if (selectedCollectionGrid !== 'all' && !getCollectionGridLabels(info.height).includes(selectedCollectionGrid)) {
          return false;
        }
        if (selectedCollectionLicense !== 'all' && getLicenseTitle(info) !== selectedCollectionLicense) return false;
        if (selectedCollectionTags.size > 0) {
          const tags = getCollectionTags(info);
          for (const tag of selectedCollectionTags) {
            if (!tags.includes(tag)) return false;
          }
        }
        if (!searchTerm) return true;

        const searchable = [
          prefix,
          info.name,
          getLicenseTitle(info),
          info.author?.name || '',
          ...(getCollectionTags(info) ?? []),
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(searchTerm);
      });

      return [...filtered].sort((left, right) => {
        const leftCategory = left.info.category || 'Uncategorized';
        const rightCategory = right.info.category || 'Uncategorized';
        if (leftCategory !== rightCategory) {
          const sortedCategories = sortCategories([leftCategory, rightCategory]);
          return leftCategory === sortedCategories[0] ? -1 : 1;
        }
        return left.info.name.localeCompare(right.info.name);
      });
    }, [
      allowedCollections,
      collectionSearch,
      selectedCollectionCategory,
      selectedCollectionPalette,
      selectedCollectionGrid,
      selectedCollectionLicense,
      selectedCollectionTags,
    ]);

    const visibleCollectionsByCategory = useMemo(() => {
      const grouped: Record<string, { prefix: string; info: IconifyInfo }[]> = {};

      for (const collection of filteredCollections) {
        const category = collection.info.category || 'Uncategorized';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(collection);
      }

      return grouped;
    }, [filteredCollections]);

    const runGlobalSearch = useCallback(
      async (query: string, start: number, append: boolean) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        const searchOptions: IconifySearchOptions = {
          category: globalSearchCategory === 'all' ? undefined : globalSearchCategory,
          palette: globalSearchPalette,
          style: globalSearchStyle,
        };

        setIsGlobalSearchLoading(true);
        const { data, success } = await searchIcon(
          trimmedQuery,
          start,
          ICON_PAGE_SIZE,
          activePrefixes,
          searchOptions
        );
        setIsGlobalSearchLoading(false);
        globalSearchLoadLockRef.current = false;

        if (!success || !data) {
          if (!append) {
            setGlobalSearchResults([]);
            setGlobalSearchHasMore(false);
          }
          return;
        }

        setGlobalSearchResults((current) =>
          append ? [...current, ...data.icons] : data.icons
        );
        setGlobalSearchStartIndex(data.start + data.total);
        setGlobalSearchHasMore(data.total === data.limit);
      },
      [activePrefixes, globalSearchCategory, globalSearchPalette, globalSearchStyle]
    );

    const debouncedGlobalSearch = useMemo(
      () =>
        debounce((query: string) => {
          runGlobalSearch(query, 0, false);
        }, 300),
      [runGlobalSearch]
    );

    useEffect(() => {
      return () => {
        debouncedGlobalSearch.cancel();
      };
    }, [debouncedGlobalSearch]);

    const handleGlobalSearchChange = (query: string) => {
      setGlobalSearchQuery(query);

      if (!query.trim()) {
        debouncedGlobalSearch.cancel();
        setGlobalSearchResults([]);
        setGlobalSearchHasMore(false);
        setGlobalSearchStartIndex(0);
        setView(currentCollectionPrefix ? 'set-browser' : 'collections');
        return;
      }

      setView('global-search');
      debouncedGlobalSearch(query);
    };

    useEffect(() => {
      if (view !== 'global-search' || !globalSearchQuery.trim()) return;
      runGlobalSearch(globalSearchQuery, 0, false);
    }, [globalSearchCategory, globalSearchPalette, globalSearchStyle, view, globalSearchQuery, runGlobalSearch]);

    const currentCollectionInfo = currentCollectionPrefix && collections ? collections[currentCollectionPrefix] : undefined;

    useEffect(() => {
      if (!currentCollectionPrefix || !modalOpen) return;

      let cancelled = false;

      const loadCollection = async () => {
        setIsSetLoading(true);
        const response = await getIconsInCollection(currentCollectionPrefix);
        if (cancelled) return;
        setIsSetLoading(false);
        if (!response.success || !response.data) {
          setCurrentCollectionData(null);
          return;
        }
        setCurrentCollectionData(response.data);
      };

      loadCollection();

      return () => {
        cancelled = true;
      };
    }, [currentCollectionPrefix, modalOpen]);

    const currentSetModel = useMemo(() => {
      if (!currentCollectionData || !currentCollectionPrefix) return null;
      return normalizeSetIcons(currentCollectionData, currentCollectionPrefix);
    }, [currentCollectionData, currentCollectionPrefix]);

    const currentSetCategories = useMemo(() => {
      if (!currentSetModel) return [];
      return Object.keys(currentSetModel.byCategory).sort((a, b) => a.localeCompare(b));
    }, [currentSetModel]);

    const filteredSetIcons = useMemo(() => {
      if (!currentSetModel) return [];
      const baseIcons =
        setCategoryFilter === 'all'
          ? currentSetModel.allIcons
          : currentSetModel.byCategory[setCategoryFilter] || [];
      const searchTerm = setSearchQuery.trim().toLowerCase();
      if (!searchTerm) return baseIcons;
      return baseIcons.filter((icon) => icon.toLowerCase().includes(searchTerm));
    }, [currentSetModel, setCategoryFilter, setSearchQuery]);

    useEffect(() => {
      setSetVisibleCount(ICON_PAGE_SIZE);
    }, [currentCollectionPrefix, setCategoryFilter, setSearchQuery]);

    const visibleSetIcons = useMemo(
      () => filteredSetIcons.slice(0, setVisibleCount),
      [filteredSetIcons, setVisibleCount]
    );

    const hasMoreSetIcons = filteredSetIcons.length > visibleSetIcons.length;

    useEffect(() => {
      const root = scrollAreaRef.current;
      const target = sentinelRef.current;
      if (!root || !target) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;

          if (view === 'set-browser' && hasMoreSetIcons) {
            setSetVisibleCount((current) => current + ICON_PAGE_SIZE);
            return;
          }

          if (view === 'global-search' && globalSearchHasMore && !isGlobalSearchLoading && !globalSearchLoadLockRef.current) {
            globalSearchLoadLockRef.current = true;
            runGlobalSearch(globalSearchQuery, globalSearchStartIndex, true);
          }
        },
        {
          root,
          rootMargin: '240px 0px',
        }
      );

      observer.observe(target);

      return () => {
        observer.disconnect();
      };
    }, [
      view,
      hasMoreSetIcons,
      globalSearchHasMore,
      isGlobalSearchLoading,
      globalSearchQuery,
      globalSearchStartIndex,
      visibleSetIcons.length,
      globalSearchResults.length,
      runGlobalSearch,
    ]);

    useEffect(() => {
      if (value && !value.color) {
        setIconData({
          ...value,
          color: undefined,
          isSvgEditable: value.isSvgEditable || false,
          isIconNameEditable: value.isIconNameEditable || false,
        });
      }
    }, [value]);

    const openCollectionBrowser = (prefix: string) => {
      setCurrentCollectionPrefix(prefix);
      setSetSearchQuery('');
      setSetCategoryFilter('all');
      setView('set-browser');
      setOpenFilterPanel(null);
    };

    const handleIconChange = (icon?: string) => {
      if (!icon) {
        setIconData(null);
        props.onChange({ target: { name, value: null, type: 'string' } });
        setModalOpen(false);
        return;
      }

      const data = getIcon(icon);
      if (!data?.body) throw new Error('Icon not found');

      const nextValue = {
        iconName: storeIconName ? icon : null,
        iconData: storeIconData ? data.body : null,
        width: data.width || 24,
        height: data.height || 24,
        color: undefined,
        isSvgEditable: false,
        isIconNameEditable: false,
      };

      setIconData(nextValue);
      props.onChange({ target: { name, value: nextValue, type: 'string' } });
      setModalOpen(false);
    };

    const handleInfoModalOpen = () => {
      setEditableIconData(
        iconData
          ? {
              ...iconData,
              color: iconData.color || undefined,
              isSvgEditable: iconData.isSvgEditable || false,
              isIconNameEditable: iconData.isIconNameEditable || false,
            }
          : null
      );
      setInfoModalOpen(true);
    };

    const handleInfoModalSave = () => {
      if (editableIconData) {
        setIconData(editableIconData);
        props.onChange({ target: { name, value: editableIconData, type: 'string' } });
      }
      setInfoModalOpen(false);
    };

    const handleDownload = (format: 'svg' | 'png' | 'jpg') => {
      if (!editableIconData) return;

      let svgBody = editableIconData.iconData || '';
      let fileName = editableIconData.iconName || 'icon';

      if (!svgBody && editableIconData.iconName) {
        svgBody = getIcon(editableIconData.iconName)?.body || '';
      }

      if (!svgBody) return;

      const width = editableIconData.width || 24;
      const height = editableIconData.height || 24;
      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"${editableIconData.color ? ` style="color: ${editableIconData.color}"` : ''}>${svgBody}</svg>`;

      if (format === 'svg') {
        const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      const size = Math.max(width, height) * 4;
      canvas.width = size;
      canvas.height = size;
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
      const imageUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);
        canvas.toBlob(
          (fileBlob) => {
            if (!fileBlob) return;
            const url = URL.createObjectURL(fileBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          },
          format === 'png' ? 'image/png' : 'image/jpeg',
          0.92
        );
        URL.revokeObjectURL(imageUrl);
      };
      image.src = imageUrl;
    };

    const tagOptions = useMemo(() => {
      const query = tagSearch.trim().toLowerCase();
      return availableCollectionTags.filter((tag) => tag.toLowerCase().includes(query)).slice(0, 30);
    }, [availableCollectionTags, tagSearch]);

    const selectedTagValues = useMemo(() => Array.from(selectedCollectionTags).sort((a, b) => a.localeCompare(b)), [selectedCollectionTags]);
    const hasActiveTagFilters = selectedTagValues.length > 0;
    const hasActiveGridFilter = selectedCollectionGrid !== 'all';
    const hasActiveMetaFilters = selectedCollectionPalette !== 'all' || selectedCollectionLicense !== 'all';

    const tagButtonLabel =
      selectedTagValues.length === 0
        ? 'Tag'
        : selectedTagValues.length === 1
          ? `Tag · ${selectedTagValues[0]}`
          : `Tag · ${selectedTagValues.length} selected`;

    const gridButtonLabel =
      selectedCollectionGrid === 'all'
        ? 'Grid'
        : `Grid · ${selectedCollectionGrid === 'mixed' ? 'Mixed grid' : `${selectedCollectionGrid}px`}`;

    const metaButtonSummary = [
      selectedCollectionPalette === 'mono'
        ? 'Monotone'
        : selectedCollectionPalette === 'multicolor'
          ? 'Multicolor'
          : null,
      selectedCollectionLicense !== 'all' ? 'License' : null,
    ].filter(Boolean) as string[];

    const metaButtonLabel =
      metaButtonSummary.length === 0
        ? 'Palette and license'
        : metaButtonSummary.length === 1
          ? `Palette and license · ${metaButtonSummary[0]}`
          : `Palette and license · ${metaButtonSummary.length} selected`;

    const totalVisibleCollections = filteredCollections.length;
    const isCompactLayout = viewportWidth < 1080;
    const isMobileLayout = viewportWidth < 768;
    const isTightLayout = viewportWidth < 560;

    const renderCollectionsView = () => (
      <>
        <Box style={{ ...panelStyle, marginBottom: '18px', position: 'relative' }}>
          <Box
            style={{
              ...subtleDividerStyle,
              display: 'grid',
              gridTemplateColumns: isMobileLayout ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto',
              gap: '16px',
              alignItems: 'start',
              paddingBottom: '16px',
              marginBottom: '16px',
            }}
          >
            <Box>
              <Typography variant="beta" style={blockTitleStyle}>Browse icon sets</Typography>
              <Typography variant="pi" style={{ ...toolbarMetaStyle, ...blockMetaStyle }}>
                Search and narrow the available icon sets first, then open a set to pick an icon.
              </Typography>
            </Box>
            <Box style={{ textAlign: isMobileLayout ? 'left' : 'right' }}>
              <Typography variant="omega" style={{ ...blockTitleStyle, marginBottom: '4px' }}>
                {totalVisibleCollections.toLocaleString()} sets
              </Typography>
              <Typography variant="pi" style={{ ...toolbarMetaStyle, ...blockMetaStyle }}>
                Showing results inside this field configuration
              </Typography>
            </Box>
          </Box>

          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: isCompactLayout ? 'minmax(0, 1fr)' : 'minmax(260px, 1.2fr) minmax(0, 2fr)',
              gap: '16px',
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography style={sectionLabelStyle}>Search icon sets</Typography>
              <input
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Filter icon sets by name, author, license, or tag"
                style={{ ...inputSurfaceStyle, marginTop: '8px' }}
              />
            </Box>

            <Box>
              <Typography style={sectionLabelStyle}>Refine results</Typography>
              <Box style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px', position: 'relative' }}>
                <Box style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFilterPanel((current) => (current === 'tag' ? null : 'tag'))}
                    style={getToolbarButtonStyle(theme, openFilterPanel === 'tag' || hasActiveTagFilters)}
                  >
                    {tagButtonLabel}
                  </button>
                  {openFilterPanel === 'tag' && (
                    <Box style={dropdownPanelStyle}>
                      <Typography variant="omega">Filter by tag</Typography>
                      <input
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Search tags..."
                        style={{ ...inputSurfaceStyle, marginTop: '12px' }}
                      />
                      <Box style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {tagOptions.map((tag) => {
                          const active = selectedCollectionTags.has(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setSelectedCollectionTags((current) => {
                                  const next = new Set(current);
                                  if (next.has(tag)) next.delete(tag);
                                  else next.add(tag);
                                  return next;
                                })
                              }
                              style={getChipStyle(theme, active)}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFilterPanel((current) => (current === 'grid' ? null : 'grid'))}
                    style={getToolbarButtonStyle(theme, openFilterPanel === 'grid' || hasActiveGridFilter)}
                  >
                    {gridButtonLabel}
                  </button>
                  {openFilterPanel === 'grid' && (
                    <Box style={dropdownPanelStyle}>
                      <Typography variant="omega">Filter by grid</Typography>
                      <Box style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        <button type="button" style={getChipStyle(theme, selectedCollectionGrid === 'all')} onClick={() => setSelectedCollectionGrid('all')}>
                          All
                        </button>
                        {availableGridOptions.map((grid) => (
                          <button
                            key={grid}
                            type="button"
                            style={getChipStyle(theme, selectedCollectionGrid === grid)}
                            onClick={() => setSelectedCollectionGrid(grid)}
                          >
                            {grid === 'mixed' ? 'Mixed grid' : `${grid}px`}
                          </button>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFilterPanel((current) => (current === 'meta' ? null : 'meta'))}
                    style={getToolbarButtonStyle(theme, openFilterPanel === 'meta' || hasActiveMetaFilters)}
                  >
                    {metaButtonLabel}
                  </button>
                  {openFilterPanel === 'meta' && (
                    <Box style={{ ...dropdownPanelStyle, minWidth: '320px' }}>
                      <Typography variant="omega">Palette and license</Typography>
                      <Box style={{ marginTop: '16px' }}>
                        <Typography style={sectionLabelStyle}>Palette</Typography>
                        <Box style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          {(['all', 'mono', 'multicolor'] as PaletteFilter[]).map((value) => (
                            <button
                              key={value}
                              type="button"
                              style={getChipStyle(theme, selectedCollectionPalette === value)}
                              onClick={() => setSelectedCollectionPalette(value)}
                            >
                              {value === 'all' ? 'All' : value === 'mono' ? 'Monotone' : 'Multicolor'}
                            </button>
                          ))}
                        </Box>
                      </Box>
                      <Box style={{ marginTop: '16px' }}>
                        <Typography style={sectionLabelStyle}>License</Typography>
                        <select
                          value={selectedCollectionLicense}
                          onChange={(e) => setSelectedCollectionLicense(e.target.value)}
                          style={{ ...selectSurfaceStyle, width: '100%', marginTop: '8px' }}
                        >
                          <option value="all">All licenses</option>
                          {availableLicenses.map((license) => (
                            <option key={license} value={license}>
                              {license}
                            </option>
                          ))}
                        </select>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box style={{ ...softPanelStyle, marginBottom: '20px' }}>
          <Typography style={sectionLabelStyle}>Categories</Typography>
          <Box
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: isMobileLayout ? 'nowrap' : 'wrap',
              overflowX: isMobileLayout ? 'auto' : 'visible',
              marginTop: '10px',
              paddingBottom: isMobileLayout ? '8px' : 0,
              scrollbarWidth: 'thin',
            }}
          >
          <button type="button" onClick={() => setSelectedCollectionCategory('all')} style={getChipStyle(theme, selectedCollectionCategory === 'all')}>
            All
          </button>
          {allowedCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCollectionCategory(category)}
              style={getChipStyle(theme, selectedCollectionCategory === category)}
            >
              {category}
            </button>
          ))}
        </Box>
        </Box>

        {sortCategories(Object.keys(visibleCollectionsByCategory)).map((category) => (
          <Box key={category} style={{ marginBottom: '28px' }}>
            <Box style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
              <Typography variant="alpha">{category}</Typography>
              <Typography variant="pi" style={toolbarMetaStyle}>
                {visibleCollectionsByCategory[category].length} sets
              </Typography>
            </Box>
            <div
              style={{
                display: 'grid',
                gap: '14px',
                gridTemplateColumns: isMobileLayout
                  ? 'minmax(0, 1fr)'
                  : 'repeat(auto-fill, minmax(240px, 1fr))',
              }}
            >
              {visibleCollectionsByCategory[category].map(({ prefix, info }) => (
                <IconSetCard key={prefix} prefix={prefix} info={info} onClick={() => openCollectionBrowser(prefix)} />
              ))}
            </div>
          </Box>
        ))}
      </>
    );

    const renderGlobalSearchView = () => (
      <>
        <Box style={{ ...panelStyle, marginBottom: '20px' }}>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: isMobileLayout ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto',
              gap: '16px',
              alignItems: 'start',
              marginBottom: '14px',
            }}
          >
            <Box>
              <Typography variant="beta" style={blockTitleStyle}>Global search</Typography>
              <Typography variant="pi" style={{ ...toolbarMetaStyle, ...blockMetaStyle }}>
                Search across all icon sets currently allowed in this field.
              </Typography>
            </Box>
            <Typography variant="pi" style={{ ...toolbarMetaStyle, ...blockMetaStyle, textAlign: isMobileLayout ? 'left' : 'right' }}>
              Searching across {activePrefixes.length} icon sets
            </Typography>
          </Box>
          <Box style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={globalSearchCategory}
              onChange={(e) => setGlobalSearchCategory(e.target.value)}
              style={{ ...selectSurfaceStyle, minWidth: isMobileLayout ? '100%' : '160px', width: isMobileLayout ? '100%' : 'auto' }}
            >
              <option value="all">All categories</option>
              {allowedCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={globalSearchPalette}
              onChange={(e) => setGlobalSearchPalette(e.target.value as PaletteFilter)}
              style={{ ...selectSurfaceStyle, minWidth: isMobileLayout ? '100%' : '160px', width: isMobileLayout ? '100%' : 'auto' }}
            >
              <option value="all">All palettes</option>
              <option value="mono">Monotone</option>
              <option value="multicolor">Multicolor</option>
            </select>
            <select
              value={globalSearchStyle}
              onChange={(e) => setGlobalSearchStyle(e.target.value as SearchStyleFilter)}
              style={{ ...selectSurfaceStyle, minWidth: isMobileLayout ? '100%' : '160px', width: isMobileLayout ? '100%' : 'auto' }}
            >
              <option value="any">Any style</option>
              <option value="fill">Fill</option>
              <option value="stroke">Stroke</option>
            </select>
          </Box>
        </Box>

        {globalSearchResults.length > 0 ? (
          <IconGrid
            icons={globalSearchResults}
            onClick={handleIconChange}
            defaultSelectdIcon={iconData?.iconName ?? undefined}
            minColumnWidth={isMobileLayout ? 92 : 120}
            iconSize={24}
            tileHeight={isMobileLayout ? 78 : 86}
            contentPadding={isMobileLayout ? '6px 0' : '12px'}
          />
        ) : !isGlobalSearchLoading ? (
          <Box
            style={{
              ...softPanelStyle,
              display: 'grid',
              placeItems: 'center',
              minHeight: isMobileLayout ? '180px' : '220px',
              textAlign: 'center',
              padding: isMobileLayout ? '20px' : '28px',
            }}
          >
            <Box style={{ maxWidth: '420px', textAlign: 'center' }}>
              <Typography
                variant="alpha"
                style={{ display: 'block', lineHeight: 1.2, marginBottom: '10px' }}
              >
                No icons matched your search
              </Typography>
              <Typography
                variant="pi"
                style={{ ...toolbarMetaStyle, display: 'block', lineHeight: 1.6 }}
              >
                Try a different keyword or relax the category, palette, or style filters.
              </Typography>
            </Box>
          </Box>
        ) : null}
      </>
    );

    const renderSetBrowserView = () => (
      <>
        <Box style={{ ...panelStyle, marginBottom: '18px' }}>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: isMobileLayout ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(300px, 360px)',
              gap: '20px',
              alignItems: 'start',
            }}
          >
          <Box style={{ minWidth: 0 }}>
            <button
              type="button"
              onClick={() => {
                setView('collections');
                setGlobalSearchQuery('');
              }}
              style={{ ...getToolbarButtonStyle(theme, false), paddingInline: '10px', marginBottom: '14px' }}
            >
              <ArrowLeft width={14} height={14} />
              Return to icon sets list
            </button>
            <Typography
              variant="beta"
              style={{
                ...blockTitleStyle,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isMobileLayout ? 'normal' : 'nowrap',
              }}
            >
              {currentCollectionInfo?.name || currentCollectionPrefix}
            </Typography>
            <Typography variant="pi" style={{ ...toolbarMetaStyle, ...blockMetaStyle }}>
              {currentCollectionInfo?.author?.name ? `By ${currentCollectionInfo.author.name}` : currentCollectionPrefix}
            </Typography>
            <Box style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <Box style={getChipStyle(theme, false)}>
                {currentCollectionInfo ? getLicenseTitle(currentCollectionInfo) : 'Unknown license'}
              </Box>
              {currentCollectionInfo?.total ? (
                <Box style={getChipStyle(theme, false)}>
                  {currentCollectionInfo.total.toLocaleString()} icons
                </Box>
              ) : null}
              {currentCollectionInfo?.palette === false ? <Box style={getChipStyle(theme, false)}>Monotone</Box> : null}
              {currentCollectionInfo?.palette === true ? <Box style={getChipStyle(theme, false)}>Multicolor</Box> : null}
            </Box>
          </Box>
          <Box style={{ width: '100%' }}>
            <Typography style={sectionLabelStyle}>Search inside this set</Typography>
            <input
              value={setSearchQuery}
              onChange={(e) => setSetSearchQuery(e.target.value)}
              placeholder="Search icons in this set..."
              style={{ ...inputSurfaceStyle, marginTop: '8px' }}
            />
          </Box>
          </Box>
        </Box>

        {currentSetCategories.length > 0 && (
          <Box style={{ ...softPanelStyle, marginBottom: '18px' }}>
            <Typography style={sectionLabelStyle}>Categories in this set</Typography>
            <Box
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: isMobileLayout ? 'nowrap' : 'wrap',
              overflowX: isMobileLayout ? 'auto' : 'visible',
              marginTop: '10px',
              paddingBottom: isMobileLayout ? '8px' : 0,
              scrollbarWidth: 'thin',
            }}
          >
            <button type="button" onClick={() => setSetCategoryFilter('all')} style={getChipStyle(theme, setCategoryFilter === 'all')}>
              All
            </button>
            {currentSetCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSetCategoryFilter(category)}
                style={getChipStyle(theme, setCategoryFilter === category)}
              >
                {category}
              </button>
            ))}
            </Box>
          </Box>
        )}

        {visibleSetIcons.length > 0 ? (
          <IconGrid
            icons={visibleSetIcons}
            onClick={handleIconChange}
            defaultSelectdIcon={iconData?.iconName ?? undefined}
            showLabel={false}
            minColumnWidth={isMobileLayout ? 64 : 78}
            iconSize={isMobileLayout ? 24 : 28}
            tileHeight={isMobileLayout ? 64 : 72}
            contentPadding={isMobileLayout ? '4px 0' : '0'}
          />
        ) : !isSetLoading ? (
          <Box
            style={{
              ...softPanelStyle,
              display: 'grid',
              placeItems: 'center',
              minHeight: isMobileLayout ? '180px' : '220px',
              textAlign: 'center',
              padding: isMobileLayout ? '20px' : '28px',
            }}
          >
            <Box style={{ maxWidth: '420px', textAlign: 'center' }}>
              <Typography
                variant="alpha"
                style={{ display: 'block', lineHeight: 1.2, marginBottom: '10px' }}
              >
                No icons matched this set view
              </Typography>
              <Typography
                variant="pi"
                style={{ ...toolbarMetaStyle, display: 'block', lineHeight: 1.6 }}
              >
                Try a different search term or switch to another category in this icon set.
              </Typography>
            </Box>
          </Box>
        ) : null}
      </>
    );

    const renderModalBody = () => {
      if (collectionsLoading) {
        return (
          <Box style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <Typography variant="alpha">Loading icon sets…</Typography>
          </Box>
        );
      }

      if (!collections || activePrefixes.length === 0) {
        return (
          <Box style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <Typography variant="alpha">No icon sets are available for this field.</Typography>
          </Box>
        );
      }

      if (view === 'global-search') return renderGlobalSearchView();
      if (view === 'set-browser') return renderSetBrowserView();
      return renderCollectionsView();
    };

    return (
      <>
        <Field.Root required={required} error={props.error} hint={hint}>
          <Field.Label htmlFor={name} error={props.error} required={required}>
            {label || 'Icon'}
          </Field.Label>
          <Box style={{ display: 'flex', gap: '8px', alignItems: 'stretch', width: '100%' }}>
            <Modal.Root open={modalOpen} onOpenChange={setModalOpen}>
              <Modal.Trigger style={{ width: '100%' }}>
                <Field.Input
                  id={name}
                  name={name}
                  type="text"
                  placeholder={
                    props?.placeholder || props?.attribute?.options?.placeholder || 'Choose an icon'
                  }
                  value={iconData?.iconName || iconData?.iconData || ''}
                  startAction={
                    iconData?.iconName ? (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon icon={iconData.iconName} width={16} height={16} />
                        {iconData.color && (
                          <Box
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: iconData.color,
                              borderRadius: '2px',
                              border: '1px solid #fff',
                            }}
                          />
                        )}
                      </Box>
                    ) : iconData?.iconData ? (
                      <svg
                        dangerouslySetInnerHTML={{ __html: iconData.iconData }}
                        viewBox={`0 0 ${iconData.width} ${iconData.height}`}
                        style={{ width: '16px', height: '16px' }}
                      />
                    ) : null
                  }
                  endAction={
                    (iconData?.iconName || iconData?.iconData) && (
                      <Cross
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleIconChange('');
                        }}
                      />
                    )
                  }
                  required={required}
                  style={{ cursor: 'pointer', width: '100%' }}
                />
              </Modal.Trigger>
              <Modal.Content
                style={{
                  maxWidth: isMobileLayout ? 'calc(100vw - 16px)' : 'min(1320px, calc(100vw - 64px))',
                  width: '100%',
                }}
              >
                <Modal.Header>
                  <IconPickerIcon style={{ width: '30px', height: '30px' }} />
                  <Modal.Title style={{ fontWeight: 'bold' }}>IconHub</Modal.Title>
                </Modal.Header>
                <Modal.Body
                  style={{
                    height: isMobileLayout ? 'calc(100vh - 88px)' : 'calc(100vh - 120px)',
                    padding: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ flex: 1, padding: isMobileLayout ? '12px' : '20px 24px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <Box style={{ ...panelStyle, marginBottom: '18px', padding: '16px 18px' }}>
                        <Box style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', minWidth: isMobileLayout ? '100%' : '220px' }}>
                          <Box>
                            <Typography variant="omega" style={{ ...blockTitleStyle, marginBottom: '2px' }}>Icon discovery</Typography>
                            <Typography variant="pi" style={{ ...toolbarMetaStyle, ...blockMetaStyle }}>
                              {activePrefixes.length} icon sets available in this field
                            </Typography>
                          </Box>
                        </Box>
                        {view !== 'set-browser' && (
                          <Box style={{ position: 'relative', width: isMobileLayout ? '100%' : 'min(360px, 100%)' }}>
                            <Search width={14} height={14} style={{ position: 'absolute', left: '12px', top: '13px', opacity: 0.6 }} />
                            <input
                              value={globalSearchQuery}
                              onChange={(e) => handleGlobalSearchChange(e.target.value)}
                              placeholder="Search icons globally..."
                              style={{ ...inputSurfaceStyle, paddingLeft: '34px' }}
                            />
                          </Box>
                        )}
                        </Box>
                      </Box>

                      <div
                        ref={scrollAreaRef}
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          paddingRight: isMobileLayout ? 0 : '4px',
                          paddingBottom: '4px',
                        }}
                      >
                        {renderModalBody()}
                        <div ref={sentinelRef} style={{ height: '1px' }} />
                      </div>
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Modal.Close>
                    <Button variant="tertiary">Cancel</Button>
                  </Modal.Close>
                </Modal.Footer>
              </Modal.Content>
            </Modal.Root>

            <Button
              variant="tertiary"
              size="S"
              disabled={!iconData?.iconName && !iconData?.iconData}
              onClick={handleInfoModalOpen}
              style={{
                padding: 0,
                height: '40px',
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pencil width={16} height={16} />
            </Button>
          </Box>
          <Field.Hint />
          <Field.Error />
        </Field.Root>

        <Modal.Root open={infoModalOpen} onOpenChange={setInfoModalOpen}>
          <Modal.Content style={{ maxHeight: '90vh', maxWidth: '640px', overflow: 'hidden' }}>
            <Modal.Header>
              <IconPickerIcon style={{ width: '30px', height: '30px' }} />
              <Modal.Title style={{ fontWeight: 'bold' }}>Icon Data</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto', padding: '24px' }}>
              {editableIconData && (
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Typography variant="beta">Preview</Typography>
                    <Typography variant="pi" style={{ opacity: 0.72 }}>
                      Review how the icon looks before you save changes.
                    </Typography>
                  </Box>
                  <Box style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {storeIconName && editableIconData.iconName && (
                      <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Box
                          style={{
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.neutral100,
                            border: `1px solid ${theme.colors.neutral200}`,
                            borderRadius: '10px',
                            padding: '12px',
                          }}
                        >
                          <Icon icon={editableIconData.iconName} width={40} height={40} color={editableIconData.color || theme.colors.neutral800} />
                        </Box>
                        <Typography variant="pi" style={{ fontWeight: 600 }}>
                          Iconify Preview
                        </Typography>
                      </Box>
                    )}
                    {editableIconData.iconData && (
                      <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Box
                          style={{
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.neutral100,
                            border: `1px solid ${theme.colors.neutral200}`,
                            borderRadius: '10px',
                            padding: '12px',
                          }}
                        >
                          <svg
                            dangerouslySetInnerHTML={{ __html: editableIconData.iconData }}
                            viewBox={`0 0 ${editableIconData.width || 24} ${editableIconData.height || 24}`}
                            style={{
                              width: '40px',
                              height: '40px',
                              color: editableIconData.color || theme.colors.neutral800,
                            }}
                          />
                        </Box>
                        <Typography variant="pi" style={{ fontWeight: 600 }}>
                          Raw SVG Preview
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box style={{ display: 'grid', gap: '16px' }}>
                    <Field.Root name="color">
                      <Field.Label>Icon Color (Optional)</Field.Label>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="color"
                          value={editableIconData.color || '#000000'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditableIconData((current) =>
                              current ? { ...current, color: e.target.value } : current
                            )
                          }
                          style={{
                            width: '40px',
                            height: '40px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'transparent',
                            padding: 0,
                          }}
                        />
                        <TextInput
                          label=""
                          value={editableIconData.color || ''}
                          placeholder="Enter hex color (e.g. #4da3ff) or leave empty"
                          onChange={(e: { target: { value: string } }) =>
                            setEditableIconData((current) =>
                              current
                                ? { ...current, color: e.target.value === '' ? undefined : e.target.value }
                                : current
                            )
                          }
                          endAction={
                            editableIconData.color ? (
                              <Cross
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditableIconData((current) =>
                                    current ? { ...current, color: undefined } : current
                                  );
                                }}
                              />
                            ) : undefined
                          }
                        />
                      </Box>
                      <Typography variant="pi" style={{ marginTop: '8px', fontSize: '12px', opacity: 0.72 }}>
                        Leave this empty to use the icon&apos;s default color behavior.
                      </Typography>
                    </Field.Root>

                    <TextInput
                      label="Icon name"
                      value={editableIconData.iconName || ''}
                      hint="Change the saved Iconify identifier if you need to point to a different icon."
                      onChange={(e: { target: { value: string } }) =>
                        setEditableIconData((current) => (current ? { ...current, iconName: e.target.value || null } : current))
                      }
                    />
                    <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <NumberInput
                        label="Width"
                        value={editableIconData.width || 24}
                        onValueChange={(value: number) =>
                          setEditableIconData((current) => (current ? { ...current, width: value } : current))
                        }
                      />
                      <NumberInput
                        label="Height"
                        value={editableIconData.height || 24}
                        onValueChange={(value: number) =>
                          setEditableIconData((current) => (current ? { ...current, height: value } : current))
                        }
                      />
                    </Box>
                    <Textarea
                      label="SVG data"
                      hint="Advanced: edit the raw SVG markup directly. Invalid SVG can break the preview or output."
                      value={editableIconData.iconData || ''}
                      onChange={(e: { target: { value: string } }) =>
                        setEditableIconData((current) => (current ? { ...current, iconData: e.target.value || null } : current))
                      }
                    />
                  </Box>

                  <Field.Root name="download">
                    <Field.Label>Download Icon</Field.Label>
                    <Box style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button variant="secondary" onClick={() => handleDownload('svg')}>
                        <Download width={14} height={14} />
                        Download as SVG
                      </Button>
                      <Button variant="secondary" onClick={() => handleDownload('png')}>
                        <Download width={14} height={14} />
                        Download as PNG
                      </Button>
                      <Button variant="secondary" onClick={() => handleDownload('jpg')}>
                        <Download width={14} height={14} />
                        Download as JPG
                      </Button>
                    </Box>
                    <Typography variant="pi" style={{ marginTop: '8px', fontSize: '12px', opacity: 0.72 }}>
                      Downloads use the current icon, dimensions, and selected color.
                    </Typography>
                  </Field.Root>

                </Box>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onClick={() => setInfoModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInfoModalSave}>Save changes</Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      </>
    );
  }
);

export default IconInput;
