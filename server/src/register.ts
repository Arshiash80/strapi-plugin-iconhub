import type { Core } from '@strapi/strapi';
const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Register IconHub field
  strapi.customFields.register({
    name: "iconhub",
    type: "json",
    plugin: 'strapi-plugin-iconhub',
    inputSize: {
      default: 4,
      isResizable: true,
    },
  })
};
export default register;
