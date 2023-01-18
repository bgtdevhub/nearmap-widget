import { React } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { Slider, Switch, TextArea } from 'jimu-ui';
import {
  MapWidgetSelector,
  SettingSection,
  SettingRow
} from 'jimu-ui/advanced/setting-components';
import { IMConfig } from '../config';

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const propChange = (obj: string, value: any) => {
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
      <SettingSection title="Nearmap API Key">
        <SettingRow>
          <TextArea
            className="mb-3"
            defaultValue={props.config.nApiKey}
            height={100}
            onBlur={(e) => propChange('nApiKey', e.target.value)}
          />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Nearmap Map Opacity">
        <SettingRow>
          <Slider
            aria-label="Nearmap Map Opacity"
            defaultValue={props.config.opacity}
            max={1}
            min={0}
            onChange={(e) => propChange('opacity', e.target.value)}
            step={0.1}
          />
        </SettingRow>
      </SettingSection>
      <SettingSection>
        <SettingRow>
          <label className="w-100 justify-content-start">
            Nearmap active on load
            <Switch
              className="ml-auto mr-0"
              checked={props.config.initialNmapActive}
              onChange={(e) =>
                propChange('initialNmapActive', e.target.checked)
              }
            />
          </label>
        </SettingRow>
      </SettingSection>
    </div>
  );
};

export default Setting;
