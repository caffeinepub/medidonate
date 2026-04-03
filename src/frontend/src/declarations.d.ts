declare module "tesseract.js" {
  interface RecognizeResult {
    data: { text: string };
  }
  const Tesseract: {
    recognize(
      image: File | string | HTMLImageElement,
      lang: string,
    ): Promise<RecognizeResult>;
  };
  export default Tesseract;
}

declare module "react-leaflet" {
  import type { ComponentType, ReactNode } from "react";
  import type { LatLngExpression, PathOptions } from "leaflet";

  interface MapContainerProps {
    center: LatLngExpression;
    zoom: number;
    style?: React.CSSProperties;
    scrollWheelZoom?: boolean;
    children?: ReactNode;
  }
  export const MapContainer: ComponentType<MapContainerProps>;

  interface TileLayerProps {
    attribution?: string;
    url: string;
  }
  export const TileLayer: ComponentType<TileLayerProps>;

  interface CircleMarkerProps {
    center: LatLngExpression;
    radius?: number;
    pathOptions?: PathOptions;
    children?: ReactNode;
  }
  export const CircleMarker: ComponentType<CircleMarkerProps>;

  interface PopupProps {
    children?: ReactNode;
  }
  export const Popup: ComponentType<PopupProps>;
}
