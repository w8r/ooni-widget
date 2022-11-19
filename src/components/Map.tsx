import { useState, useRef, useEffect } from "react";
import { zoom as d3Zoom, ZoomTransform, zoomIdentity } from "d3-zoom";
import { geoPath, geoMercator } from "d3-geo";
import { FeatureCollection, Feature, Position, Polygon } from "geojson";
import { select as d3Select } from "d3-selection";
import { polygonContains } from "d3-polygon";
import "./Map.css";
import { useAppContext } from "../Context";

export function Map() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { countries } = useAppContext();

  // initialize the canvas context in the effect hook
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const ctx = canvas.getContext("2d");
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      let t = zoomIdentity.scale(1);

      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const projection = geoMercator()
          .fitSize([w, h], countries as GeoJSON.FeatureCollection)
          .precision(100);
        const path = geoPath(projection, ctx);

        const zoom = d3Zoom<HTMLCanvasElement, unknown>()
          .scaleExtent([1, 12])
          .on("zoom", ({ transform }: { transform: ZoomTransform }) => {
            t = transform;
            requestAnimationFrame(() => render(ctx));
          });
        const canvasSelection = d3Select(canvas);
        zoom(canvasSelection, zoomIdentity.translate(w / 2, h / 2));

        // country detection
        let selectedCountry: Feature | null = null;
        canvasSelection.on("mousemove", (evt) => {
          selectedCountry = getCountryAtPoint(evt.offsetX, evt.offsetY);
          //if (selectedCountry) console.log(selectedCountry?.properties.name);
        });

        function getCountryAtPoint(cx: number, cy: number) {
          const [x, y] = t.invert([cx, cy]);
          const coord = projection.invert!([x, y]);
          for (const country of countries.features) {
            const bounds = path.bounds(country);
            if (
              bounds[0][0] <= x &&
              x <= bounds[1][0] &&
              bounds[0][1] <= y &&
              y <= bounds[1][1]
            ) {
              const polygons: Position[][][] =
                country.geometry.type === "MultiPolygon"
                  ? country.geometry.coordinates
                  : [(country.geometry as Polygon).coordinates!];
              for (const polygon of polygons) {
                if (
                  polygon.some((contour) =>
                    polygonContains(contour as [number, number][], coord!)
                  )
                ) {
                  return country;
                }
              }
            }
          }
          return null;
        }

        function render(ctx: CanvasRenderingContext2D) {
          ctx.clearRect(0, 0, w, h);
          ctx.lineJoin = "round";
          ctx.lineCap = "round";

          ctx.save();

          ctx.translate(t.x, t.y);
          ctx.scale(t.k, t.k);

          ctx.beginPath();
          ctx.rect(-w / 2, -h / 2, w * 2, h * 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "antiquewhite";
          ctx.lineWidth = 1 / t.k;

          countries.features.forEach((feature) => {
            ctx.beginPath();
            // per color
            path(feature);
            ctx.stroke();
          });

          ctx.restore();
        }

        render(ctx);
      }
    }
  }, []);

  return <canvas className="Map" ref={canvasRef} />;
}
