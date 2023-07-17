import {
  React,
  AllWidgetProps,
  getAppStore,
  IMState,
  ReactRedux,
} from "jimu-core";
import { JimuMapViewComponent, JimuMapView } from "jimu-arcgis";
import format from "date-fns/format";
import WebTileLayer from "esri/layers/WebTileLayer";
import TileInfo from "esri/layers/support/TileInfo";
import LOD from "esri/layers/support/LOD";
import SpatialReference from "esri/geometry/SpatialReference";
import Point from "esri/geometry/Point";
import Swipe from "esri/widgets/Swipe";
import reactiveUtils from "esri/core/reactiveUtils";
import {
  Modal,
  ModalBody,
  ModalHeader,
  Alert,
  Switch,
  Loading,
  Tooltip,
} from "jimu-ui";

import MapDatepicker from "./components/MapDatepicker";
import CompareNearmapButton from "./components/CompareNearmap";
import { IMConfig, NearmapCoverage } from "../config";
import {
  addSwipeLayer,
  generateTileID,
  lat2tile,
  lon2tile,
  removeSwipeLayer,
} from "./components/Utils";

import "./widget.css";

const { useState, useEffect, useRef, useCallback } = React;
const { useSelector } = ReactRedux;

const NO_KEY = "API key not found";
const NO_AUTHORIZE = "You are not authorized to access this area";
const NO_DATE = "No Datelist Found";
const TIMEOUT = "Something wrong happened";

const Widget = (props: AllWidgetProps<IMConfig>) => {
  // User Input Parameters
  const dateToday = format(new Date(), "yyyy-MM-dd");
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
    inchesPerMeter,
    initialNmapActive,
  } = props.config;

  const [mapDate, setMapDate] = useState(dateToday);
  const [dateList, setDateList] = useState([dateToday]);
  const [lonLat, setLonLat] = useState([originLongitude, originLatitude]);
  const [compareDate, setCompareDate] = useState(dateToday);
  const [compare, setCompare] = useState(false);
  const [nmapActive, setNmapActive] = useState(initialNmapActive);
  const [nmapDisable, setNmapDisable] = useState(false);
  const [errorMode, setErrorMode] = useState(null);
  const [jimuView, setJimuView] = useState<JimuMapView>(null);
  const [nmapWidgetId, setNmapWidgetId] = useState(null);
  const [ctrlWidgetId, setCtrlWidgetId] = useState(null);

  const swipeWidgetRef = useRef<Swipe>();

  const compareRef = useRef(false);
  const nmapActiveRef = useRef(false);

  const widgetState = useSelector((state: IMState) => {
    return state.widgetsRuntimeInfo;
  });

  const handleCompare = (value: boolean): void => {
    setCompare(value);
    compareRef.current = value;
  };

  const handleNmapActive = useCallback((value: boolean): void => {
    nmapActiveRef.current = value;
    setNmapActive(value);
    handleCompare(false);
  }, []);

  // Taken from https://gist.github.com/stdavis/6e5c721d50401ddbf126
  // By default ArcGIS SDK only goes to zoom level 19,
  // In order to overcome this, we need to add more Level Of Detail (LOD) entries to
  //  both the view and the web tile layer
  const getLods = useCallback(() => {
    const lods: LOD[] = [];
    const initialResolution = earthCircumference / tilesize;
    for (let zoom = nearmapMinZoom; zoom <= nearmapMaxZoom; zoom++) {
      const resolution = initialResolution / Math.pow(2, zoom);
      const scale = resolution * 96 * inchesPerMeter;
      lods.push(
        new LOD({
          level: zoom,
          scale,
          resolution,
        })
      );
    }
    return lods;
  }, [
    earthCircumference,
    inchesPerMeter,
    nearmapMaxZoom,
    nearmapMinZoom,
    tilesize,
  ]);

  // Create a tileinfo instance with increased level of detail
  // using the lod array we created earlier
  // We need to use rows and cols (currently undocumented in https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-TileInfo.html)
  // in addition to width and height properties
  const getTileInfo = useCallback(() => {
    const tileInfo = new TileInfo({
      dpi: 72,
      format: "jpg",
      lods: getLods(),
      origin: new Point({
        x: -20037508.342787,
        y: 20037508.342787,
      }),
      spatialReference: SpatialReference.WebMercator,
      size: [256, 256],
    });
    return tileInfo;
  }, [getLods]);

  // generate web tile layer
  const generateWebTileLayer = useCallback(
    (date: string, isCompare = false): WebTileLayer => {
      const id = generateTileID(date, isCompare);
      // Create a WebTileLayer for Nearmap imagery.
      // We are using tileinfo we created earlier.
      const wtl = new WebTileLayer({
        urlTemplate: `${tileURL}/${direction}/{level}/{col}/{row}.img?apikey=${nApiKey}&until=${date}`,
        copyright: "Nearmap",
        tileInfo: getTileInfo(),
        title: `Nearmap for ${id}`,
        opacity,
        // blendMode,
        id,
      });

      wtl.on("layerview-create-error", () => {
        wtl.refresh();
      });

      return wtl;
    },
    [direction, getTileInfo, nApiKey, opacity, tileURL]
  );

  // sync date function for new date list
  const syncDates = useCallback(
    (nmDateList: string[]) => {
      if (dateList.join() !== nmDateList.join()) {
        setDateList(nmDateList);
      }
      if (!nmDateList.includes(mapDate)) {
        setMapDate(nmDateList[0]);
      }
      if (!nmDateList.includes(compareDate)) {
        setCompareDate(nmDateList[nmDateList.length - 1]);
      }
    },
    [compareDate, dateList, mapDate]
  );

  const loadMapTask = useCallback(
    (date: string, isCompare: boolean): void => {
      if (errorMode === null && jimuView !== null) {
        const newMapLayer = generateWebTileLayer(date, isCompare);
        // set compare map visibility to false when compare is false
        if ((!compareRef.current && isCompare) || !nmapActiveRef.current) {
          newMapLayer.visible = false;
        }
        jimuView.view.map.add(newMapLayer, 0);

        if (swipeWidgetRef.current !== undefined) {
          addSwipeLayer(isCompare, newMapLayer, swipeWidgetRef.current);
        }
      }
    },
    [errorMode, generateWebTileLayer, jimuView]
  );

  const mapCleanupTask = useCallback(
    (isCompare: boolean): void => {
      if (jimuView !== null) {
        const oldId = isCompare ? "compare-" : "base-";
        const oldLayers: __esri.Layer[] | undefined = jimuView.view.map.layers
          .filter((y: __esri.Layer) => y.id.includes(oldId))
          .toArray();

        jimuView.view.map.removeMany(oldLayers);

        if (swipeWidgetRef.current !== undefined) {
          removeSwipeLayer(isCompare, swipeWidgetRef.current);
        }
      }
    },
    [jimuView]
  );

  const activeViewChangeHandler = (jmvObj: JimuMapView) => {
    if (jmvObj) {
      setJimuView(jmvObj);
    }
  };

  // initial loading
  useEffect(() => {
    if (jimuView) {
      jimuView.view.constraints = {
        lods: getLods(),
        maxZoom: nearmapMaxZoom,
      };

      // check if widget exist inside widget controller
      const widgets = getAppStore().getState().appConfig.widgets;
      console.log(Object.values(widgets));
      const [nmapWidget] = Object.values(widgets).filter(
        (x) => x.uri === "widgets/nearmap-integration/"
      );
      const [controllerWidget] = Object.values(widgets).filter(
        (x) => x.uri === "widgets/common/controller/"
      );

      if (nmapWidget) setNmapWidgetId(nmapWidget.id);
      if (controllerWidget) setCtrlWidgetId(controllerWidget.id);

      reactiveUtils.when(
        () => jimuView.view.stationary || !jimuView.view.updating,
        () => {
          setLonLat([
            jimuView.view.center.longitude,
            jimuView.view.center.latitude,
          ]);
        }
      );

      reactiveUtils
        .whenOnce(() => jimuView.view.ready)
        .then(() => {
          console.log("MapView is ready.");
        })
        .catch((err) => console.log(err));
    }
  }, [getLods, jimuView, nearmapMaxZoom]);

  // fetch list of capture date based on origin
  useEffect(() => {
    const originLon = lon2tile(lonLat[0], originZoom);
    const originLat = lat2tile(lonLat[1], originZoom);

    const setDisable = (value: string) => {
      const disabled = value !== null;
      setErrorMode(value);
      setNmapDisable(disabled);

      if (disabled && value !== TIMEOUT) {
        handleNmapActive(false);
      }
      if (disabled) {
        handleCompare(false);
      }
    };

    fetch(
      `${coverageURL}/${originZoom}/${originLon}/${originLat}?apikey=${nApiKey}&limit=500`
    )
      .then(async (response) => {
        return response.json();
      })
      .then((data) => {
        switch (true) {
          case data.error === NO_KEY:
          case data.error === NO_AUTHORIZE: {
            setDisable(data.error);
            break;
          }
          case data.surveys.length === 0: {
            setDisable(NO_DATE);
            break;
          }
          default: {
            setDisable(null);
            const nmDateList: string[] = data.surveys.map(
              (d: NearmapCoverage) => d.captureDate
            );
            const finalDateList = [...new Set(nmDateList)];
            syncDates(finalDateList);
            break;
          }
        }
      })
      .catch((err) => {
        console.log(`nearmap coverage error: ${err}`);
        setDisable(TIMEOUT);
      });
  }, [coverageURL, handleNmapActive, lonLat, nApiKey, originZoom, syncDates]);

  // map date hook
  useEffect(() => {
    loadMapTask(mapDate, false);
    return () => {
      mapCleanupTask(false);
    };
  }, [loadMapTask, mapCleanupTask, mapDate]);

  // compare date hook
  useEffect(() => {
    loadMapTask(compareDate, true);
    return () => {
      mapCleanupTask(true);
    };
  }, [compareDate, loadMapTask, mapCleanupTask]);

  // compare function
  useEffect(() => {
    if (errorMode === null && compare) {
      const nearmapLead: __esri.Layer | undefined = jimuView.view.map.layers
        .filter((bs) => bs.id.includes("base-"))
        .at(0);
      const nearmapTrail: __esri.Layer | undefined = jimuView.view.map.layers
        .filter((cp) => cp.id.includes("compare"))
        .at(0);

      if (nearmapTrail !== undefined) nearmapTrail.visible = true;

      // create a new Swipe widget
      const swipe = new Swipe({
        leadingLayers: [nearmapLead],
        trailingLayers: [nearmapTrail],
        position: 35, // set position of widget to 35%
        view: jimuView.view as __esri.MapView,
        id: "compare-swipe",
      });

      swipeWidgetRef.current = swipe;
      jimuView.view.ui.add(swipe);
    }
    return () => {
      if (jimuView) {
        const nearmapTrail: __esri.Layer | undefined = jimuView.view.map.layers
          .filter((cp: __esri.Layer) => cp.id.includes("compare"))
          .at(0);

        if (nearmapTrail !== undefined) nearmapTrail.visible = false;
        if (swipeWidgetRef.current !== undefined) {
          swipeWidgetRef.current.destroy();
        }
      }
    };
  }, [compare, errorMode, jimuView]);

  // widget in controller behaviour control
  useEffect(() => {
    const nmapState = widgetState[nmapWidgetId];

    if (!(ctrlWidgetId && nmapWidgetId && nmapState.state === "OPENED")) {
      handleNmapActive(false);
    }
  }, [ctrlWidgetId, handleNmapActive, nmapWidgetId, widgetState]);

  // set map visibility
  useEffect(() => {
    if (jimuView !== null) {
      const nearmapLead: __esri.Layer | undefined = jimuView.view.map.layers
        .filter((bs: __esri.Layer) => bs.id.includes("base-"))
        .at(0);

      if (nearmapLead !== undefined) nearmapLead.visible = nmapActive;
    }
  }, [nmapActive, mapDate, jimuView]);

  return (
    <div className="jimu-widget">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}
      <div className="alert-box">
        <Alert
          // closable
          form="basic"
          onClose={() => {}}
          open={errorMode === NO_DATE || errorMode === NO_AUTHORIZE}
          text={errorMode}
          type="info"
          withIcon
        />
      </div>
      {jimuView !== null && (
        <div className="grid-nav">
          <Tooltip
            placement="top"
            showArrow
            enterDelay={500}
            title="Activate Nearmap"
          >
            <div
              className={
                !nmapActive || errorMode !== null
                  ? "nmapactive-button-alt"
                  : "nmapactive-button"
              }
            >
              <Switch
                aria-label="Activate Nearmap"
                checked={nmapActive}
                disabled={nmapDisable}
                onChange={() => handleNmapActive(!nmapActive)}
              />
            </div>
          </Tooltip>
          {!nmapDisable &&
            nmapActive && [
              <MapDatepicker
                key="mapDatePicker"
                mapDate={mapDate}
                setMapDate={setMapDate}
                dateList={dateList}
              />,
              <CompareNearmapButton
                key="compareNearmapButton"
                compare={compare}
                set={handleCompare}
                disabled={!nmapActive}
              />,
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
        <Modal isOpen={errorMode === NO_KEY}>
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
        <Modal isOpen={errorMode === TIMEOUT}>
          <ModalHeader>Error</ModalHeader>
          <ModalBody>
            {errorMode}
            <br />
            Please refresh the page
          </ModalBody>
        </Modal>
      </div>
      {jimuView === null && (
        <div>
          <Loading />
        </div>
      )}
    </div>
  );
};

export default Widget;
