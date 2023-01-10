import { React } from 'jimu-core';
import { Button, Icon } from 'jimu-ui';

import CompareIcon from '../asset/compare_black_24dp.svg';
import './styles/CompareNearmapButton.css';

interface compareProps {
  compare: boolean;
  set: any;
}

const CompareNearmapButton = ({ compare, set }: compareProps): JSX.Element => {
  return (
    <div className="compare-grid">
      <Button
        aria-label="Compare Map"
        icon
        onClick={() => {
          set(!compare);
        }}
        size="lg"
        className="compare-button"
      >
        <Icon icon={CompareIcon} size={20} />
      </Button>
    </div>
  );
};

export default CompareNearmapButton;
