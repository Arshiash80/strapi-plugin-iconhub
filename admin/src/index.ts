import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import IconPickerIcon from './components/IconPickerIcon';
import * as yup from 'yup';

export default {
  register(app: any) {
    // app.addMenuLink({
    //   to: `plugins/${PLUGIN_ID}`,
    //   icon: PluginIcon,
    //   intlLabel: {
    //     id: `${PLUGIN_ID}.plugin.name`,
    //     defaultMessage: PLUGIN_ID,
    //   },
    //   Component: async () => {
    //     const { App } = await import('./pages/App');

    //     return App;
    //   },
    // });

    app.customFields.register({
      name: "iconhub",
      pluginId: PLUGIN_ID,
      type: "json",
      icon: IconPickerIcon,
      intlLabel: {
        id: getTranslation(`input.label`),
        defaultMessage: 'IconHub',
      },
      intlDescription: {
        id: getTranslation('input.description'),
        defaultMessage: 'Icon picker with Iconify support. Saves icon name and icon data as raw SVG to the field as JSON.',
      },
      components: {
        Input: async () =>
          import('./components/IconHubInput').then((module) => ({
            default: module.default,
          })),
      },

      options: {
        base: [],

        advanced: [
          {
            sectionTitle: {
              id: "global.settings",
            },
            items: [
              {
                name: "required",
                type: "checkbox",
                intlLabel: {
                  id: 'options.advanced.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'options.advanced.requiredField.description',
                  defaultMessage: "You won't be able to create an entry if this field is empty",
                },
              }
            ]
          },
          {
            sectionTitle: {
              id: "iconhub.settings",
              defaultMessage: "Icon Storage Options",
            },
            items: [
              {
                size: 6,
                name: "options.storeIconData",
                type: "checkbox",
                required: true,
                intlLabel: {
                  id: 'iconhub.settings.storeIconData.label',
                  defaultMessage: 'Store icon data (raw SVG)',
                },
                description: {
                  id: 'iconhub.settings.storeIconData.description',
                  defaultMessage: "Store the raw SVG data in the database. Recommended if you don't use Iconify and just want to render the raw SVG.",
                },
                value: true,
                defaultValue: true,
              },
              {
                size: 6,
                name: "options.storeIconName",
                type: "checkbox",
                required: true,
                intlLabel: {
                  id: 'iconhub.settings.storeIconName.label',
                  defaultMessage: 'Store icon name',
                },
                description: {
                  id: 'iconhub.settings.storeIconName.description',
                  defaultMessage: "Store the icon name in the database. Recommended if you need the icon name to fetch from Iconify.",
                },
                value: true,
                defaultValue: true,
              },
            ]
          }
        ],
        validator: (args: any) => ({
          storeIconData: yup.boolean().test(
            'at-least-one-selected',
            'At least one storage option must be selected',
            function (value) {
              const { storeIconName } = this.parent;
              return value || storeIconName;
            }
          ),
          storeIconName: yup.boolean().test(
            'at-least-one-selected',
            'At least one storage option must be selected',
            function (value) {
              const { storeIconData } = this.parent;
              return value || storeIconData;
            }
          ),
        }),
      }

    })

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
