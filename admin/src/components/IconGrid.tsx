import {
  type CSSProperties,
  type MouseEvent,
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useState,
} from 'react';
import { Icon } from '@iconify/react';
import { Box, Typography } from '@strapi/design-system';
import { useTheme } from 'styled-components';

type IconGridProps = {
  icons: string[];
  onClick: (icon: string) => void;
  defaultSelectdIcon?: string;
  showLabel?: boolean;
  minColumnWidth?: number;
  iconSize?: number;
  tileHeight?: number;
  contentPadding?: string;
};

type ThemeShape = {
  colors: {
    neutral100: string;
    neutral150: string;
    neutral200: string;
    neutral600: string;
    neutral800: string;
    primary500: string;
    primary100: string;
  };
};

const IconGrid = ({
  icons,
  defaultSelectdIcon,
  onClick,
  showLabel = true,
  minColumnWidth = 120,
  iconSize = 24,
  tileHeight = 80,
  contentPadding = '12px',
}: IconGridProps) => {
  const theme = useTheme() as ThemeShape;
  const [selectedIcon, setSelectedIcon] = useState<string | null>(defaultSelectdIcon || null);

  useEffect(() => {
    setSelectedIcon(defaultSelectdIcon || null);
  }, [defaultSelectdIcon]);

  const handleIconClick = (icon: string) => {
    setSelectedIcon(icon);
    onClick(icon);
  };

  const handleKeyDown = (e: KeyboardEvent, icon: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleIconClick(icon);
    }
  };

  // Container styles with auto-fit grid
  const containerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
    gap: '10px',
    padding: contentPadding,
  };

  // Icon item styles
  const iconItemStyle = (icon: string): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: showLabel ? '10px 8px' : '8px 4px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid ${selectedIcon === icon ? theme.colors.primary500 : theme.colors.neutral150}`,
    background: selectedIcon === icon ? theme.colors.primary100 : theme.colors.neutral100,
    outline: 'none',
    height: `${tileHeight}px`,
  });

  // Text style with ellipsis for long names
  const textStyle: CSSProperties = {
    fontSize: '12px',
    textAlign: 'center',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '8px',
    color: theme.colors.neutral600,
  };

  // Focus styles applied via inline event handlers
  const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = theme.colors.primary500;
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = selectedIcon && e.currentTarget.getAttribute('aria-selected') === 'true'
      ? theme.colors.primary500
      : theme.colors.neutral150;
  };

  // Hover styles applied via inline event handlers
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.borderColor = theme.colors.neutral200;
  };

  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>, icon: string) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.borderColor = selectedIcon === icon ? theme.colors.primary500 : theme.colors.neutral150;
  };

  return (
    <div style={containerStyle} role="grid" aria-label="Icon selection grid">
      {icons.map((icon, index) => (
          <Box
            key={index}
            role="gridcell"
            background="neutral100"
            borderColor="neutral100"
            tabIndex={0}
            aria-selected={selectedIcon === icon}
            style={iconItemStyle(icon)}
            onClick={() => handleIconClick(icon)}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, icon)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={(e: MouseEvent<HTMLDivElement>) => handleMouseLeave(e, icon)}
            aria-label={`${icon} icon`}
            title={icon}
          >
            <Icon icon={icon} width={iconSize} height={iconSize} />
            {showLabel && (
              <Typography style={textStyle} variant="pi" textColor="neutral1000">
                {icon}
              </Typography>
            )}
          </Box>
      ))}
    </div>
  );
};

export default IconGrid;
