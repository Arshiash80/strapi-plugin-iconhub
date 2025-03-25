import {
  type CSSProperties,
  type MouseEvent,
  type FocusEvent,
  type KeyboardEvent,
  useState,
} from 'react';
import { Icon } from '@iconify/react';
import { Box, Typography } from '@strapi/design-system';

type IconGridProps = {
  icons: string[];
  onClick: (icon: string) => void;
  defaultSelectdIcon?: string;
};
const IconGrid = ({ icons, defaultSelectdIcon, onClick }: IconGridProps) => {
  const [columns, setColumns] = useState(6);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(defaultSelectdIcon || null);

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
    // This will automatically create as many columns as will fit, with each column being at least 120px wide
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '8px',
    padding: '12px',
    maxWidth: '1000px',
    margin: '0 auto',
  };

  // Icon item styles
  const iconItemStyle = (icon: string): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 4px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    // ring if selected
    boxShadow: selectedIcon === icon ? '0 0 0 2px #4f46e5' : 'none',
    outline: 'none',
    height: '80px',
  });

  // Text style with ellipsis for long names
  const textStyle: CSSProperties = {
    fontSize: '12px',
    textAlign: 'center',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '4px',
  };

  // Focus styles applied via inline event handlers
  const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 0 0 2px #4f46e5';
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  // Hover styles applied via inline event handlers
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '0.8';
  };

  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>, icon: string) => {
    if (selectedIcon !== icon) {
      e.currentTarget.style.opacity = '1';
    }
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
          <Icon icon={icon} width={24} height={24} />
          <Typography style={textStyle} variant="pi" textColor="neutral1000">
            {icon}
          </Typography>
        </Box>
      ))}
    </div>
  );
};

export default IconGrid;
