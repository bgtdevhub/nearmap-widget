import { React, AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis';
import format from 'date-fns/format';
import WebTileLayer from 'esri/layers/WebTileLayer';
import TileInfo from 'esri/layers/support/TileInfo';
import LOD from 'esri/layers/support/LOD';
import SpatialReference from 'esri/geometry/SpatialReference';
import Point from 'esri/geometry/Point';
import Swipe from 'esri/widgets/Swipe';
import reactiveUtils from 'esri/core/reactiveUtils';
import { Modal, ModalBody, ModalHeader, Alert, Switch } from 'jimu-ui';

import MapDatepicker from './components/MapDatepicker';
import CompareNearmapButton from './components/CompareNearmap';
import { IMConfig, nearmapCoverage } from '../config';
import {
  addSwipeLayer,
  generateTileID,
  lat2tile,
  lon2tile,
  removeSwipeLayer
} from './components/Utils';

import './widget.css';

const { useState, useEffect, useRef } = React;

const NO_KEY = 'API key not found';
const NO_COVERAGE = 'You are not authorized to access this area';
const NO_DATE = 'No Datelist Found';

const Widget = (props: AllWidgetProps<IMConfig>) => {
  // User Input Parameters
  const dateToday = format(new Date(), 'yyyy-MM-dd');
  const swipeWidgetRef = useRef<Swipe>();
  const jmvObjRef = useRef(null);

  const {
    nApiKey, // "NEARMAP_API_KEY_GOES_HERE"
    tileURL, // Nearmap Tile API URL base
    coverageURL, // Nearmap Coverage API URL base
    direction, // Options: 'Vert', 'North', // Note: awaiting fix from esri to support E, W, S
    originLongitude, // Original longitude for Location: ex: Austin, TX
    originLatitude, // Original latitude for Location: ex: Austin, TX
    originZoom, // Starting Zoom level for the Web Map
    nearmapMinZoom, // Nearmap Imagery Lowest resolution zoom level the user can view
    nearmapMaxZoom, // Nearmap Imagery Highest resolution zoom level the user can view
    opacity, // Range of 0.1 to 1.0
    tilesize,
    earthCircumference,
    inchesPerMeter
  } = props.config;

  const [mapDate, setMapDate] = useState(dateToday);
  const [dateList, setDateList] = useState([dateToday]);
  const [lonLat, setLonLat] = useState([originLongitude, originLatitude]);
  const [compareDate, setCompareDate] = useState(dateToday);
  const [compare, setCompare] = useState(false);
  const [nmapActive, setNmapActive] = useState(false);
  const [nmapDisable, setNmapDisable] = useState(false);
  const [errorMode, setErrorMode] = useState([]);

  const activeViewChangeHandler = (jmvObj: JimuMapView) => {
    jmvObjRef.current = jmvObj;

    // const map = new Map();
    // jmvObjRef.current.view.map = map;
    jmvObjRef.current.view.zoom = originZoom - nearmapMinZoom;
    jmvObjRef.current.view.constraints = {
      lods,
      maxZoom: nearmapMaxZoom
    };

    if (errorMode.length === 0) {
      const nearmapSince = generateWebTileLayer(mapDate);
      // add the layer to the view
      jmvObjRef.current.view.map.add(nearmapSince);
      // checkLayerViewError(nearmapSince);
    }

    reactiveUtils.when(
      () => jmvObjRef.current.view.stationary === true,
      () => {
        setLonLat([
          jmvObjRef.current.view.center.longitude,
          jmvObjRef.current.view.center.latitude
        ]);
      }
    );

    reactiveUtils
      .whenOnce(() => jmvObjRef.current.view.ready)
      .then(() => {
        console.log('MapView is ready.');
      });
  };

  // Taken from https://gist.github.com/stdavis/6e5c721d50401ddbf126
  // By default ArcGIS SDK only goes to zoom level 19,
  // In order to overcome this, we need to add more Level Of Detail (LOD) entries to
  //  both the view and the web tile layer
  const lods: LOD[] = [];
  const initialResolution = earthCircumference / tilesize;
  for (let zoom = nearmapMinZoom; zoom <= nearmapMaxZoom; zoom++) {
    const resolution = initialResolution / Math.pow(2, zoom);
    const scale = resolution * 96 * inchesPerMeter;
    lods.push(
      new LOD({
        level: zoom,
        scale,
        resolution
      })
    );
  }

  // Create a tileinfo instance with increased level of detail
  // using the lod array we created earlier
  // We need to use rows and cols (currently undocumented in https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-TileInfo.html)
  // in addition to width and height properties
  const tileInfo = new TileInfo({
    dpi: 72,
    format: 'jpg',
    lods,
    origin: new Point({
      x: -20037508.342787,
      y: 20037508.342787
    }),
    spatialReference: SpatialReference.WebMercator,
    size: [256, 256]
  });

  // generate web tile layer
  const generateWebTileLayer = (
    date: string,
    isCompare = false
  ): WebTileLayer => {
    const id = generateTileID(date, isCompare);
    // Create a WebTileLayer for Nearmap imagery.
    // We are using tileinfo we created earlier.
    const wtl = new WebTileLayer({
      urlTemplate: `${tileURL}/${direction}/{level}/{col}/{row}.img?apikey=${nApiKey}&until=${date}`,
      copyright: 'Nearmap',
      tileInfo,
      title: `Nearmap for ${id}`,
      opacity,
      id
    });

    wtl.on('layerview-create-error', () => {
      if (errorMode.length === 0) {
        wtl.refresh();
      }
    });

    return wtl;
  };

  // const checkLayerViewError = (weblayer: WebTileLayer) => {
  //   jmvObjRef.current.view
  //     .whenLayerView(weblayer)
  //     .then(() => {
  //       console.log('layer OK');
  //       // console.log(res);
  //     })
  //     .catch((err) => {
  //       console.log('layer is not OK!!!!!');
  //       console.log(err.message, err.details.layer.id);
  //     });
  // };

  // sync date function for new date list
  const syncDates = (nmDateList: string[]) => {
    if (dateList.join() !== nmDateList.join()) {
      setDateList(nmDateList);
    }
    if (!nmDateList.includes(mapDate)) {
      setMapDate(nmDateList[0]);
    }
    if (!nmDateList.includes(compareDate)) {
      setCompareDate(nmDateList[nmDateList.length - 1]);
    }
  };

  const checkErrorExist = (errorType: string) => {
    if (!errorMode.includes(errorType)) {
      setErrorMode([...errorMode, errorType]);
    }
    setNmapDisable(true);
  };

  // fetch list of capture date based on origin
  useEffect(() => {
    const originLon = lon2tile(lonLat[0], originZoom);
    const originLat = lat2tile(lonLat[1], originZoom);

    fetch(
      `${coverageURL}/${originZoom}/${originLon}/${originLat}?apikey=${nApiKey}&limit=500`
    )
      .then(async (response) => await response.json())
      .then((data) => {
        switch (true) {
          case data.error === NO_KEY:
          case data.error === NO_COVERAGE: {
            checkErrorExist(data.error);
            break;
          }
          case data.surveys.length === 0: {
            checkErrorExist(NO_DATE);
            break;
          }
          default: {
            setErrorMode([]);
            const nmDateList: string[] = data.surveys.map(
              (d: nearmapCoverage) => d.captureDate
            );
            const finalDateList = [...new Set(nmDateList)];
            syncDates(finalDateList);
          }
        }
      })
      .catch((err) => console.log(`nearmap coverage error: ${err}`));
  }, [originZoom, lonLat, nApiKey]);

  // date change hook
  const useMapDate = (date: string, isCompare = false): void => {
    useEffect(() => {
      if (errorMode.length === 0) {
        const newMapLayer = generateWebTileLayer(date, isCompare);
        // put compare map at back
        const index = isCompare ? 0 : 1;
        // set compare map visibility to false when compare is false
        if (!nmapActive || (!compare && isCompare)) {
          newMapLayer.visible = false;
        }
        jmvObjRef.current.view.map.add(newMapLayer, index);
        // checkLayerViewError(newMapLayer);

        if (swipeWidgetRef.current !== undefined) {
          addSwipeLayer(isCompare, newMapLayer, swipeWidgetRef.current);
        }
      }

      return () => {
        const oldLayers: any = jmvObjRef.current.view.map.layers.filter(
          (y: __esri.Layer) => y.id === generateTileID(date, isCompare)
        );
        jmvObjRef.current.view.map.removeMany(oldLayers);

        if (swipeWidgetRef.current !== undefined) {
          removeSwipeLayer(isCompare, swipeWidgetRef.current);
        }
      };
    }, [date, compare, errorMode.length, nmapActive]);
  };

  // compare date
  useMapDate(compareDate, true);
  // map date
  useMapDate(mapDate);

  // compare function
  useEffect(() => {
    if (errorMode.length === 0) {
      const nearmapLead = jmvObjRef.current.view.map.findLayerById(mapDate);
      const [nearmapTrail] = jmvObjRef.current.view.map.layers.filter(
        (cp: __esri.Layer) => cp.id.includes('compare')
      );
      if (compare) {
        // create a new Swipe widget
        const swipe = new Swipe({
          leadingLayers: [nearmapLead],
          trailingLayers: [nearmapTrail],
          position: 35, // set position of widget to 35%
          view: jmvObjRef.current.view,
          id: 'compare-swipe'
        });
        swipeWidgetRef.current = swipe;
        jmvObjRef.current.view.ui.add(swipe);
      }
    }
    return () => {
      if (swipeWidgetRef.current !== undefined) {
        swipeWidgetRef.current.destroy();
      }
    };
  }, [compare, errorMode.length]);

  const handleNmapActive = (): void => {
    setNmapActive(!nmapActive);
    if (compare) setCompare(false);
  };

  return (
    <div className="jimu-widget">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}
      {jmvObjRef && (
        <div className="grid-nav">
          <div className="nmapactive-button">
            <Switch
              checked={nmapActive}
              disabled={nmapDisable}
              onChange={handleNmapActive}
            />
          </div>
          {!nmapDisable && [
            <MapDatepicker
              mapDate={mapDate}
              setMapDate={setMapDate}
              dateList={dateList}
            />,
            <CompareNearmapButton
              compare={compare}
              set={setCompare}
              disabled={!nmapActive}
            />
          ]}
          {!nmapDisable && compare && (
            <MapDatepicker
              mapDate={compareDate}
              setMapDate={setCompareDate}
              dateList={dateList}
            />
          )}
        </div>
      )}
      <div>
        <Modal
          isOpen={jmvObjRef.current === null || errorMode.includes(NO_KEY)}
        >
          <ModalHeader>Valid Nearmap API Key Required</ModalHeader>
          <ModalBody>
            Kindly check the following items in Nearmap widget settings
            <ul>
              <li>A map has been selected</li>
              <li>A valid Nearmap API Key has been entered</li>
            </ul>
          </ModalBody>
        </Modal>
      </div>
      <div>
        <Alert
          // closable
          form="basic"
          onClose={() => {}}
          open={errorMode.includes(NO_COVERAGE)}
          text="No Nearmap imagery found for this area. Try another area"
          type="info"
          withIcon
          style={{ width: '420px' }}
        />
      </div>
    </div>
  );
};

export default Widget;
