import { React } from 'jimu-core';
import { Button, Icon } from 'jimu-ui';

import CompareIcon from '../asset/compare_black_24dp.svg';

interface compareProps {
  compare: boolean;
  set: any;
}

const CompareNearmapButton = ({ compare, set }: compareProps): JSX.Element => {
  return (
    <div style={{ justifySelf: 'center' }}>
      <Button
        aria-label="Compare Map"
        icon
        onClick={() => {
          set(!compare);
        }}
        size="default"
      >
        <Icon icon={CompareIcon} size={18} />
      </Button>
    </div>
  );
};

export default CompareNearmapButton;
