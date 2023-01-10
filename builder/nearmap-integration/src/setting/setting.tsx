import { React } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { Slider, TextArea } from 'jimu-ui';
import {
  MapWidgetSelector,
  SettingSection,
  SettingRow
} from 'jimu-ui/advanced/setting-components';
import { IMConfig } from '../config';

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const propChangeBase = (obj: string, value: any) => {
    props.onSettingChange({
      id: props.id,
      config: {
        ...props.config,
        [obj]: value
      }
    });
  };

  const onMapWidgetSelected = (useMapWidgetId: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetId
    });
  };

  const onBlurAPI = (e: React.ChangeEvent<HTMLInputElement>) => {
    propChangeBase('nApiKey', e.target.value);
  };

  const onChangeOpacity = (e: React.ChangeEvent<HTMLInputElement>) => {
    propChangeBase('opacity', e.target.value);
  };

  return (
    <div>
      <SettingSection title="Select Map">
        <SettingRow>
          <MapWidgetSelector
            onSelect={onMapWidgetSelected}
            useMapWidgetIds={props.useMapWidgetIds}
          />
        </SettingRow>
      </SettingSection>
      <SettingSection>
        <SettingRow>
          <label>Nearmap API Key: </label>
        </SettingRow>
        <SettingRow>
          <TextArea
            className="mb-3"
            defaultValue={props.config.nApiKey}
            height={100}
            onBlur={onBlurAPI}
          />
        </SettingRow>
        <SettingRow>
          <label>Nearmap Map Opacity: </label>
        </SettingRow>
        <SettingRow>
          <Slider
            aria-label="Range"
            defaultValue={props.config.opacity}
            max={1}
            min={0}
            onChange={onChangeOpacity}
            step={0.1}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
};

export default Setting;
