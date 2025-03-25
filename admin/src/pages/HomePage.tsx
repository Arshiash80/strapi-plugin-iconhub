import { Main } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <h1
        style={{
          fontSize: '5rem',
          fontWeight: 600,
        }}
      >
        Comming soon ...
      </h1>
    </Main>
  );
};

export { HomePage };
