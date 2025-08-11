import { Box, Button, Field, Modal, Textarea, TextInput, NumberInput } from '@strapi/design-system';
import { Cross, Search, Pencil, Download } from '@strapi/icons';
import { IntlShape } from 'react-intl';
import { Icon, getIcon } from '@iconify/react';
import IconPickerIcon from './IconPickerIcon';
import { searchIcon } from '../libs/iconifyApi';
import debounce from 'lodash/debounce';
import { Typography } from '@strapi/design-system';
import IconGrid from './IconGrid';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';

type IconInputValue = {
  iconName: string | null;
  iconData: string | null;
  width: number | null;
  height: number | null;
  color: string | null | undefined;
  isSvgEditable?: boolean;
  isIconNameEditable?: boolean;
};

/**
 * Props for the IconInput component.
 */
type IconInputProps = {
  /** The attribute object with custom field's underlying Strapi type and options */
  attribute: { type: string; customField: string; options: any };
  /** The field description set in configure the view */
  description: IntlShape;
  /** The field placeholder set in configure the view */
  placeholder: IntlShape;
  /** The field description set in configure the view along with min/max validation requirements */
  hint: string;
  /** The field name set in the content-type builder */
  name: string;
  /** The field name set in the content-type builder or configure the view */
  intlLabel: IntlShape;
  /** The handler for the input change event. The name argument references the field name. The type argument references the underlying Strapi type */
  onChange: (event: { target: { name: string; value: unknown; type: string } }) => void;
  /** The content-type the field belongs to */
  contentTypeUID: string;
  /** The custom field uid, for example plugin::color-picker.color */
  type: string;
  /** The input value the underlying Strapi type expects */
  value: IconInputValue;
  /** Whether or not the field is required */
  required: boolean;
  /** Error received after validation */
  error: IntlShape;
  /** Whether or not the input is disabled */
  disabled: boolean;
  /** The label of the field */
  label: string;
};

const IconInput = forwardRef<HTMLButtonElement, IconInputProps>(
  ({ hint, disabled, name, value, required, label, ...props }, forwardedRef) => {
    const [iconData, setIconData] = useState<IconInputValue | null>(value);
    const [searchedIcons, setSearchedIcons] = useState<string[] | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [startIndex, setStartIndex] = useState(0);
    const [thereIsMoreIcons, setThereIsMoreIcons] = useState(false);
    const [editableIconData, setEditableIconData] = useState<IconInputValue | null>(null);
    const options = props.attribute.options;
    // For backward compatibility
    const storeIconData = options?.storeIconData ?? true;
    const storeIconName = options?.storeIconName ?? true;

    // Helper function to validate hex color format
    const isValidHexColor = (color: string): boolean => {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    };

    const handleIconChange = (icon?: string) => {
      if (!icon) {
        setIconData(null);
        props.onChange({ target: { name, value: null, type: 'string' } });
        setModalOpen(false);
        return;
      }
      const data = getIcon(icon);
      const iconData = data?.body;
      if (!iconData) throw new Error('Icon not found');

      const newIconData = {
        iconName: storeIconName ? icon : null,
        iconData: storeIconData ? iconData : null,
        width: data.width || 24,
        height: data.height || 24,
        color: undefined, // No initial color
        isSvgEditable: false, // SVG editing disabled by default
        isIconNameEditable: false, // Icon name editing disabled by default
      };

      setIconData(newIconData);
      props.onChange({ target: { name, value: newIconData, type: 'string' } });
      setModalOpen(false);
    };

    const handleInfoModalOpen = () => {
      // Ensure backward compatibility by adding undefined color if missing
      const iconDataWithColor = iconData
        ? {
            ...iconData,
            color: iconData.color || undefined,
            isSvgEditable: iconData.isSvgEditable || false,
            isIconNameEditable: iconData.isIconNameEditable || false,
          }
        : null;
      setEditableIconData(iconDataWithColor);
      setInfoModalOpen(true);
    };

    const handleInfoModalSave = () => {
      if (editableIconData) {
        setIconData(editableIconData);
        props.onChange({ target: { name, value: editableIconData, type: 'string' } });
      }
      setInfoModalOpen(false);
    };

    const handleInfoModalCancel = () => {
      setInfoModalOpen(false);
      setEditableIconData(null);
    };

    // Add download SVG functionality
    const handleDownloadSVG = () => {
      if (!editableIconData) return;

      let svgContent = '';
      let fileName = 'icon';

      if (editableIconData.iconData) {
        // Use raw SVG data if available
        svgContent = editableIconData.iconData;
        fileName = editableIconData.iconName || 'icon';
      } else if (editableIconData.iconName) {
        // Generate SVG from Iconify icon
        const iconData = getIcon(editableIconData.iconName);
        if (iconData?.body) {
          svgContent = iconData.body;
          fileName = editableIconData.iconName;
        }
      }

      if (svgContent) {
        // Create SVG element with proper attributes
        const svgElement = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${editableIconData.width || 24} ${editableIconData.height || 24}" width="${editableIconData.width || 24}" height="${editableIconData.height || 24}"${editableIconData.color ? ` style="color: ${editableIconData.color}"` : ''}>${svgContent}</svg>`;

        // Create blob and download
        const blob = new Blob([svgElement], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    };

    // Add download PNG functionality
    const handleDownloadPNG = async () => {
      if (!editableIconData) return;

      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size (you can make this configurable)
        const size = Math.max(editableIconData.width || 24, editableIconData.height || 24) * 4; // 4x for better quality
        canvas.width = size;
        canvas.height = size;

        // Create temporary SVG element
        let svgContent = '';
        let fileName = 'icon';

        if (editableIconData.iconData) {
          svgContent = editableIconData.iconData;
          fileName = editableIconData.iconName || 'icon';
        } else if (editableIconData.iconName) {
          const iconData = getIcon(editableIconData.iconName);
          if (iconData?.body) {
            svgContent = iconData.body;
            fileName = editableIconData.iconName;
          }
        }

        if (svgContent) {
          const svgElement = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${editableIconData.width || 24} ${editableIconData.height || 24}" width="${size}" height="${size}"${editableIconData.color ? ` style="color: ${editableIconData.color}"` : ''}>${svgContent}</svg>`;

          // Convert SVG to data URL
          const svgBlob = new Blob([svgElement], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);

          // Create image element
          const img = new Image();
          img.onload = () => {
            // Clear canvas and draw image
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Convert to PNG and download
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }
            }, 'image/png');

            URL.revokeObjectURL(svgUrl);
          };
          img.src = svgUrl;
        }
      } catch (error) {
        console.error('Error generating PNG:', error);
      }
    };

    // Add download JPG functionality
    const handleDownloadJPG = async () => {
      if (!editableIconData) return;

      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const size = Math.max(editableIconData.width || 24, editableIconData.height || 24) * 4;
        canvas.width = size;
        canvas.height = size;

        // Create temporary SVG element
        let svgContent = '';
        let fileName = 'icon';

        if (editableIconData.iconData) {
          svgContent = editableIconData.iconData;
          fileName = editableIconData.iconName || 'icon';
        } else if (editableIconData.iconName) {
          const iconData = getIcon(editableIconData.iconName);
          if (iconData?.body) {
            svgContent = iconData.body;
            fileName = editableIconData.iconName;
          }
        }

        if (svgContent) {
          const svgElement = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${editableIconData.width || 24} ${editableIconData.height || 24}" width="${size}" height="${size}"${editableIconData.color ? ` style="color: ${editableIconData.color}"` : ''}>${svgContent}</svg>`;

          // Convert SVG to data URL
          const svgBlob = new Blob([svgElement], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);

          // Create image element
          const img = new Image();
          img.onload = () => {
            // Clear canvas and draw image
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Convert to JPG and download
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              },
              'image/jpeg',
              0.9
            ); // 90% quality

            URL.revokeObjectURL(svgUrl);
          };
          img.src = svgUrl;
        }
      } catch (error) {
        console.error('Error generating JPG:', error);
      }
    };

    // Generic download handler
    const handleDownload = (format: 'svg' | 'png' | 'jpg') => {
      switch (format) {
        case 'svg':
          handleDownloadSVG();
          break;
        case 'png':
          handleDownloadPNG();
          break;
        case 'jpg':
          handleDownloadJPG();
          break;
      }
    };

    const handleLoadMore = async () => {
      if (!searchQuery) return;
      const { data, success, error } = await searchIcon(searchQuery, startIndex, startIndex + 50);
      if (!success || !data) {
        // TODO: Handle error
        return;
      }
      setSearchedIcons([...(searchedIcons ?? []), ...data.icons]);
      setStartIndex(data.start + data.total);
      setThereIsMoreIcons(data.total === data.limit);
    };

    const handleSearch = useCallback(async (query?: string) => {
      const searchTerm = query || '';
      setSearchQuery(searchTerm);
      if (!searchTerm.trim()) {
        setSearchedIcons(null);
        setStartIndex(0);
        setThereIsMoreIcons(false);
        return;
      }

      setIsLoading(true);
      const { data, success, error } = await searchIcon(searchTerm);
      setIsLoading(false);

      if (!success || !data) {
        // TODO: Handle error
        return;
      }

      setSearchedIcons(data.icons);
      setStartIndex(data.start + data.total);
      setThereIsMoreIcons(data.total === data.limit);
    }, []);

    const debouncedSearch = useMemo(
      () =>
        debounce((query: string) => {
          handleSearch(query);
        }, 300),
      [handleSearch]
    );

    const handleSearchChange = (query: string) => {
      setSearchQuery(query);
      debouncedSearch(query);
    };

    useEffect(() => {
      return () => {
        // ? lodash.debounce creates a persistent function.
        // ? So we should cancel it when the component unmounts to avoid memory leaks:
        debouncedSearch.cancel();
      };
    }, [debouncedSearch]);

    // Handle backward compatibility for existing icon data without color field
    useEffect(() => {
      if (value && !value.color) {
        const iconDataWithColor = {
          ...value,
          color: undefined,
          isSvgEditable: value.isSvgEditable || false,
          isIconNameEditable: value.isIconNameEditable || false,
        };
        setIconData(iconDataWithColor);
        // Removed props.onChange call that was causing infinite loop
      }
    }, [value]);

    return (
      <>
        <Field.Root required={required} error={props.error} hint={hint}>
          <Field.Label htmlFor={name} error={props.error} required={required}>
            {label || 'Icon'}
          </Field.Label>
          <Box
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'stretch',
              width: '100%',
            }}
          >
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
                            title={`Custom color: ${iconData.color}`}
                          />
                        )}
                      </Box>
                    ) : iconData?.iconData ? (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg
                          dangerouslySetInnerHTML={{ __html: iconData.iconData }}
                          viewBox={`0 0 ${iconData.width} ${iconData.height}`}
                          style={{
                            width: '16px',
                            height: '16px',
                          }}
                        />
                        {iconData.color && (
                          <Box
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: iconData.color,
                              borderRadius: '2px',
                              border: '1px solid #fff',
                            }}
                            title={`Custom color: ${iconData.color}`}
                          />
                        )}
                      </Box>
                    ) : (
                      <></>
                    )
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
              <Modal.Content>
                <Modal.Header>
                  <IconPickerIcon
                    style={{
                      width: '30px',
                      height: '30px',
                    }}
                  />
                  <Modal.Title
                    style={{
                      fontWeight: 'bold',
                    }}
                  >
                    IconHub
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body
                  style={{
                    height: 'calc(100vh - 100px)',
                  }}
                >
                  <Field.Root name="name">
                    <Field.Label>Search for an icon from Iconify</Field.Label>

                    <Field.Input
                      placeholder="What icon are you looking for?"
                      startAction={
                        isLoading ? (
                          <Icon icon={'line-md:loading-loop'} width={16} height={16} />
                        ) : (
                          <Search />
                        )
                      }
                      endAction={
                        <Cross
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSearchChange('');
                          }}
                        />
                      }
                      value={searchQuery || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSearchChange(e.target.value)
                      }
                    />
                  </Field.Root>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      paddingTop: '30px',
                    }}
                  >
                    {searchedIcons && searchedIcons?.length > 0 && (
                      <IconGrid
                        icons={searchedIcons}
                        onClick={handleIconChange}
                        defaultSelectdIcon={iconData?.iconName ?? undefined}
                      />
                    )}

                    {searchedIcons?.length === 0 && (
                      <Box
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                        }}
                      >
                        <Icon icon={'mdi:ghost'} width={30} height={30} />
                        <Typography
                          style={{
                            marginTop: '20px',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            textAlign: 'center',
                          }}
                        >
                          No icons found
                        </Typography>
                      </Box>
                    )}

                    {!searchedIcons && (
                      <Box
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                        }}
                      >
                        <Icon icon={'mdi:ghost'} width={30} height={30} />
                        <Typography
                          style={{
                            marginTop: '20px',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            textAlign: 'center',
                          }}
                        >
                          Search for an icon
                        </Typography>
                      </Box>
                    )}

                    {thereIsMoreIcons && (
                      <Button
                        onClick={handleLoadMore}
                        startIcon
                        loading={isLoading}
                        style={{
                          margin: '20px auto',
                          display: 'flex',
                        }}
                      >
                        Load more
                      </Button>
                    )}
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
                padding: '0',
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

        {/* Info Modal */}
        <Modal.Root open={infoModalOpen} onOpenChange={setInfoModalOpen}>
          <Modal.Content style={{ maxHeight: '90vh', maxWidth: '600px', overflow: 'hidden' }}>
            <Modal.Header>
              <IconPickerIcon
                style={{
                  width: '30px',
                  height: '30px',
                }}
              />
              <Modal.Title
                style={{
                  fontWeight: 'bold',
                }}
              >
                Icon Data
              </Modal.Title>
            </Modal.Header>
            <Modal.Body
              style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto', padding: '24px' }}
            >
              {editableIconData && (
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Icon Previews */}
                  <Box
                    style={{
                      display: 'flex',
                      gap: '24px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {storeIconName && editableIconData.iconName && (
                      <Box
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Typography variant="pi" style={{ fontWeight: '600', color: '#d4d4d4' }}>
                          Iconify Preview
                        </Typography>
                        <Box
                          style={{
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #3c3c3c',
                            borderRadius: '8px',
                            padding: '12px',
                          }}
                        >
                          <Icon
                            icon={editableIconData.iconName}
                            width={40}
                            height={40}
                            color={editableIconData.color || '#d4d4d4'}
                          />
                        </Box>
                      </Box>
                    )}

                    {storeIconData && editableIconData.iconData && (
                      <Box
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Typography variant="pi" style={{ fontWeight: '600', color: '#d4d4d4' }}>
                          Raw SVG Preview
                        </Typography>
                        <Box
                          style={{
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #3c3c3c',
                            borderRadius: '8px',
                            padding: '12px',
                          }}
                        >
                          <svg
                            dangerouslySetInnerHTML={{ __html: editableIconData.iconData }}
                            viewBox={`0 0 ${editableIconData.width} ${editableIconData.height}`}
                            style={{
                              width: '40px',
                              height: '40px',
                              color: editableIconData.color || '#d4d4d4',
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Color Picker - Moved to top for better visibility */}
                  <Field.Root name="color">
                    <Field.Label>Icon Color (Optional)</Field.Label>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="color"
                        value={editableIconData?.color || '#000000'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (editableIconData) {
                            setEditableIconData({
                              ...editableIconData,
                              color: e.target.value,
                            });
                          }
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                      <TextInput
                        value={editableIconData?.color || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const colorValue = e.target.value;
                          // Allow any input to be typed - don't restrict typing
                          if (editableIconData) {
                            setEditableIconData({
                              ...editableIconData,
                              color: colorValue === '' ? undefined : colorValue,
                            });
                          }
                        }}
                        endAction={
                          editableIconData?.color && (
                            <Cross
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditableIconData({
                                  ...editableIconData,
                                  color: undefined,
                                });
                              }}
                            />
                          )
                        }
                        placeholder="Enter hex color (e.g., #ff0000) or leave empty"
                        style={{ flex: 1 }}
                      />
                    </Box>
                    <Typography
                      variant="pi"
                      style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}
                    >
                      Leave empty to use default icon colors
                    </Typography>
                  </Field.Root>

                  {/* Download SVG Button */}
                  <Field.Root name="download">
                    <Field.Label>Download Icon</Field.Label>
                    <Box
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        variant="secondary"
                        startIcon={<Download />}
                        onClick={() => handleDownload('svg')}
                        disabled={!editableIconData?.iconData && !editableIconData?.iconName}
                        style={{ minHeight: '40px' }}
                      >
                        Download as SVG
                      </Button>
                      <Button
                        variant="tertiary"
                        startIcon={<Download />}
                        onClick={() => handleDownload('png')}
                        disabled={!editableIconData?.iconData && !editableIconData?.iconName}
                        style={{ minHeight: '40px' }}
                      >
                        Download as PNG
                      </Button>
                      <Button
                        variant="tertiary"
                        startIcon={<Download />}
                        onClick={() => handleDownload('jpg')}
                        disabled={!editableIconData?.iconData && !editableIconData?.iconName}
                        style={{ minHeight: '40px' }}
                      >
                        Download as JPG
                      </Button>
                      <Typography
                        variant="pi"
                        style={{ fontSize: '12px', opacity: 0.7, width: '100%', marginTop: '8px' }}
                      >
                        Choose format and download with current color and dimensions
                      </Typography>
                    </Box>
                  </Field.Root>

                  {storeIconName && (
                    <Field.Root name="iconName">
                      <Field.Label>Icon Name</Field.Label>
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() =>
                            setEditableIconData({
                              ...editableIconData,
                              isIconNameEditable: !editableIconData.isIconNameEditable,
                            })
                          }
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            minHeight: 'auto',
                          }}
                        >
                          {editableIconData.isIconNameEditable
                            ? '🔒 Make Read-Only'
                            : '✏️ Enable Editing'}
                        </Button>
                        {!editableIconData.isIconNameEditable && (
                          <Typography variant="pi" style={{ color: '#ff6b6b', fontSize: '12px' }}>
                            Icon name is read-only to prevent display issues
                          </Typography>
                        )}
                      </Box>
                      <TextInput
                        value={editableIconData.iconName || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (editableIconData.isIconNameEditable) {
                            setEditableIconData({
                              ...editableIconData,
                              iconName: e.target.value || null,
                              iconData: editableIconData.iconData,
                              width: editableIconData.width,
                              height: editableIconData.height,
                              color: editableIconData.color,
                              isSvgEditable: editableIconData.isSvgEditable,
                            });
                          }
                        }}
                        placeholder="Icon name"
                        disabled={!editableIconData.isIconNameEditable}
                      />
                      <Typography
                        variant="pi"
                        style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}
                      >
                        ⚠️ Warning: If you're using Iconify to display icons, changing the icon name
                        can result in icons not showing up.
                        {!editableIconData.isIconNameEditable &&
                          ' Click "Enable Editing" above to modify the icon name.'}
                      </Typography>
                    </Field.Root>
                  )}

                  {storeIconData && (
                    <Field.Root name="iconData">
                      <Field.Label>Icon Data (SVG)</Field.Label>
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() =>
                            setEditableIconData({
                              ...editableIconData,
                              isSvgEditable: !editableIconData.isSvgEditable,
                            })
                          }
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            minHeight: 'auto',
                          }}
                        >
                          {editableIconData.isSvgEditable
                            ? '🔒 Make Read-Only'
                            : '✏️ Enable Editing'}
                        </Button>
                        {!editableIconData.isSvgEditable && (
                          <Typography variant="pi" style={{ color: '#ff6b6b', fontSize: '12px' }}>
                            SVG is read-only to prevent accidental changes
                          </Typography>
                        )}
                      </Box>
                      <Textarea
                        value={editableIconData.iconData || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          if (editableIconData.isSvgEditable) {
                            setEditableIconData({
                              ...editableIconData,
                              iconName: editableIconData.iconName,
                              iconData: e.target.value || null,
                              width: editableIconData.width,
                              height: editableIconData.height,
                              color: editableIconData.color,
                              isIconNameEditable: editableIconData.isIconNameEditable,
                            });
                          }
                        }}
                        placeholder="<svg>...</svg>"
                        disabled={!editableIconData.isSvgEditable}
                        style={{
                          fontFamily: 'monospace',
                        }}
                      />
                    </Field.Root>
                  )}
                </Box>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="tertiary" onClick={handleInfoModalCancel}>
                  Cancel
                </Button>
              </Modal.Close>
              <Button onClick={handleInfoModalSave}>Save Changes</Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      </>
    );
  }
);

IconInput.displayName = 'IconInput';

export default IconInput;
