import { Box, Button, Field, Modal } from '@strapi/design-system';
import { Cross, Search } from '@strapi/icons';
import { IntlShape } from 'react-intl';
import { Icon, getIcon } from '@iconify/react';
import IconPickerIcon from './IconPickerIcon';
import { searchIcon } from '../libs/iconifyApi';
import debounce from 'lodash.debounce';
import { Typography } from '@strapi/design-system';
import IconGrid from './IconGrid';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';

type IconInputValue = {
  iconName: string | null;
  iconData: string | null;
  width: number | null;
  height: number | null;
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
};

const IconInput = forwardRef<HTMLButtonElement, IconInputProps>(
  ({ hint, disabled, name, value, required, ...props }, forwardedRef) => {
    const [iconData, setIconData] = useState<IconInputValue | null>(value);
    const [searchedIcons, setSearchedIcons] = useState<string[] | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [startIndex, setStartIndex] = useState(0);
    const [thereIsMoreIcons, setThereIsMoreIcons] = useState(false);

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
        iconName: icon,
        iconData: iconData,
        width: data.width || 24,
        height: data.height || 24,
      };

      setIconData(newIconData);
      props.onChange({ target: { name, value: newIconData, type: 'string' } });
      setModalOpen(false);
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
      setSearchQuery(query || '');
      if (!query) {
        setSearchedIcons(null);
        setStartIndex(0);
        setThereIsMoreIcons(false);
        return;
      }

      setIsLoading(true);
      const { data, success, error } = await searchIcon(query);
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

    return (
      <Modal.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Trigger>
          <Field.Root required={required} error={props.error} hint={hint}>
            <Field.Label htmlFor={name} error={props.error} required={required}>
              {name}
            </Field.Label>
            <Field.Input
              type="text"
              value={iconData?.iconName || ''}
              startAction={
                iconData?.iconName && (
                  <Icon icon={iconData.iconName} width={16} height={16} color="white" />
                )
              }
              endAction={
                <Cross
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleIconChange('');
                  }}
                />
              }
              required={required}
              defaultValue={iconData}
              placeholder={props?.placeholder || props?.attribute?.options?.placeholder}
            />
            <Field.Hint />
            <Field.Error />
          </Field.Root>
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
              <Field.Label>Search for an icon</Field.Label>

              <Field.Input
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
                value={searchQuery}
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
    );
  }
);

IconInput.displayName = 'IconInput';

export default IconInput;
