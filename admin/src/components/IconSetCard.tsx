import { type CSSProperties, type MouseEvent } from 'react';
import { Icon } from '@iconify/react';
import { Box, Typography } from '@strapi/design-system';
import type { IconifyInfo } from '@iconify/types';
import { useTheme } from 'styled-components';

type IconSetCardProps = {
  info: IconifyInfo;
  prefix: string;
  onClick: () => void;
};

type ThemeShape = {
  colors: {
    alternative100: string;
    neutral100: string;
    neutral150: string;
    neutral200: string;
    neutral600: string;
    neutral700: string;
    neutral1000: string;
    primary100: string;
    primary500: string;
  };
};

const sampleRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
  minHeight: '28px',
};

const sampleIconsStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const getCardStyle = (theme: ThemeShape): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  borderRadius: '16px',
  background: theme.colors.neutral100,
  border: `1px solid ${theme.colors.neutral200}`,
  cursor: 'pointer',
  minHeight: '156px',
  transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
});

const getBadgeStyle = (theme: ThemeShape): CSSProperties => ({
  fontSize: '11px',
  color: theme.colors.neutral600,
  padding: '4px 9px',
  borderRadius: '999px',
  background: theme.colors.neutral150,
});

const getGridLabel = (height?: number | number[]) => {
  if (!height) return 'Mixed grid';
  if (Array.isArray(height)) {
    return height.length === 1 ? `${height[0]}px` : 'Mixed grid';
  }
  return `${height}px`;
};

const getLicenseLabel = (info: IconifyInfo) => {
  if (typeof info.license === 'string') return info.license;
  return info.license?.title || 'License unknown';
};

const IconSetCard = ({ info, prefix, onClick }: IconSetCardProps) => {
  const theme = useTheme() as ThemeShape;
  const sampleIcons = info.samples?.slice(0, 4) ?? [];

  return (
    <Box
      style={getCardStyle(theme)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = theme.colors.primary500;
        e.currentTarget.style.boxShadow = `0 8px 24px ${theme.colors.alternative100}`;
      }}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = theme.colors.neutral200;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Box style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <Box style={{ minWidth: 0 }}>
          <Typography
            variant="omega"
            textColor="neutral1000"
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {info.name}
          </Typography>
          <Typography variant="pi" style={{ marginTop: '4px', color: theme.colors.neutral700, fontSize: '12px' }}>
            {prefix}
          </Typography>
        </Box>
        <Typography variant="pi" style={{ color: theme.colors.neutral700, fontSize: '12px', flexShrink: 0 }}>
          {(info.total ?? 0).toLocaleString()} icons
        </Typography>
      </Box>

      <Typography variant="pi" style={{ fontSize: '12px', color: theme.colors.neutral700 }}>
        {getLicenseLabel(info)}
      </Typography>

      <Box style={sampleRowStyle}>
        <Box style={sampleIconsStyle}>
          {sampleIcons.map((sample) => (
            <Icon key={sample} icon={`${prefix}:${sample}`} width={18} height={18} />
          ))}
        </Box>
        <Box style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={getBadgeStyle(theme)}>{info.palette ? 'Multicolor' : 'Monotone'}</span>
          <span style={getBadgeStyle(theme)}>{getGridLabel(info.height)}</span>
        </Box>
      </Box>
    </Box>
  );
};

export default IconSetCard;
