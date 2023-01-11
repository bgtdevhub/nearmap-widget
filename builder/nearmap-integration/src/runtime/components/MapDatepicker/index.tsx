import parse from 'date-fns/parse';
import format from 'date-fns/format';
import { React } from 'jimu-core';
import {
  Button,
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  Icon
} from 'jimu-ui';

import NavigateBeforeIcon from '../../asset/navigate_before_black_24dp.svg';
import NavigateNextIcon from '../../asset/navigate_next_black_24dp.svg';
import TripOriginOutlinedIcon from '../../asset/trip_origin_black_24dp.svg';

import './index.css';

const { useState, useEffect } = React;

interface DatePickerProps {
  mapDate: string;
  setMapDate: any;
  dateList: string[];
}

const renderSelectedDate = (date: string): string => {
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  return format(parsedDate, 'E MMM dd yyyy');
};

const renderMenuItem = (
  dateList: string[],
  handleDateChange: any
): JSX.Element[] => {
  return dateList.map((d) => {
    // check for year
    if (d.length === 4) {
      return (
        <DropdownItem header key={d}>
          {d}
        </DropdownItem>
      );
    }
    const parsedDate = parse(d, 'yyyy-MM-dd', new Date());
    const formatDate = format(parsedDate, 'MMMM dd');

    return (
      <DropdownItem
        key={d}
        value={d}
        onClick={handleDateChange}
        className="middle-line"
      >
        <Icon
          icon={TripOriginOutlinedIcon}
          size="m"
          className="dropdown-icon"
        />{' '}
        {formatDate}
      </DropdownItem>
    );
  });
};

const MapDatepicker = ({
  mapDate,
  setMapDate,
  dateList
}: DatePickerProps): JSX.Element => {
  const [nextDisabled, setNextDisabled] = useState(true);
  const [prevDisabled, setPrevDisabled] = useState(false);

  // render years
  const yearList1 = dateList.map((y) => {
    return y.substring(0, 4);
  });
  const uniqYearList = [...new Set(yearList1)];

  const menuItem = uniqYearList.map((y2) => {
    const sameYear = dateList.filter((d) => y2 === d.substring(0, 4));
    return [y2, ...sameYear];
  });
  const finalMenuItem = menuItem.flat();

  // change button disability, return target index
  const navButtonState = (date: string): void => {
    const currentIndex = finalMenuItem.findIndex((i) => i === date);
    switch (true) {
      // disable prev button if last record, last should never be a year
      case currentIndex === finalMenuItem.length - 1: {
        setNextDisabled(false);
        setPrevDisabled(true);
        break;
      }
      // disable next button if 2nd record, 1st should always be a year
      case currentIndex === 1: {
        setNextDisabled(true);
        setPrevDisabled(false);
        break;
      }
      // enable both next and prev button
      default: {
        setNextDisabled(false);
        setPrevDisabled(false);
        break;
      }
    }
  };

  // get target date, next or previous function
  const getTargetDate = (prevDate = true): void => {
    const currentIndex = finalMenuItem.findIndex((i) => i === mapDate);
    let targetIndex = prevDate ? currentIndex + 1 : currentIndex - 1;
    let finalDate = finalMenuItem[targetIndex];

    // skip year item
    if (finalDate.length === 4) {
      targetIndex = prevDate ? targetIndex + 1 : targetIndex - 1;
      finalDate = finalMenuItem[targetIndex];
    }
    setMapDate(finalDate);
    navButtonState(finalDate);
  };

  const handleDateChange = (e: any): void => {
    setMapDate(e.target.value);
    navButtonState(e.target.value);
  };

  useEffect(() => {
    navButtonState(mapDate);
  }, [finalMenuItem]);

  // const navColor = (disabled: boolean) => (disabled ? 'grey' : 'black');

  return (
    <div className="date-grid">
      <Button
        aria-label="Previous Date"
        size="lg"
        icon
        onClick={() => getTargetDate(true)}
        disabled={prevDisabled}
        className="nav-button prev-button"
      >
        <Icon icon={NavigateBeforeIcon} size="l" className="nav-icon" />
      </Button>
      <Dropdown
        activeIcon="false"
        direction="up"
        menuRole="menu"
        className="dropdown-grid"
      >
        <DropdownButton
          size="lg"
          arrow={false}
          className="dropdown-date-button"
        >
          {renderSelectedDate(mapDate)}
        </DropdownButton>
        <DropdownMenu
          alignment="center"
          maxHeight={300}
          className="dropdown-menu"
        >
          {renderMenuItem(finalMenuItem, handleDateChange)}
        </DropdownMenu>
      </Dropdown>
      <Button
        aria-label="Next Date"
        size="lg"
        icon
        onClick={() => getTargetDate(false)}
        disabled={nextDisabled}
        className="nav-button next-button"
      >
        <Icon icon={NavigateNextIcon} size="l" className="nav-icon" />
      </Button>
    </div>
  );
};

export default MapDatepicker;
