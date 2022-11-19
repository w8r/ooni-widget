import {
  createContext,
  Context,
  ReactElement,
  useContext,
  useState,
  useEffect,
} from "react";
import { FeatureCollection, Feature } from "./types";

import data from "./assets/countries.json";

interface IAppContext {
  countries: FeatureCollection;
  countriesByCode: Record<string, Feature>;
  setCountries: (countries: FeatureCollection) => void;
  selectedCountry: Feature | null;
  setSelectedCountry: (country: Feature) => void;
}

export function createAppContext() {
  return createContext<IAppContext | null>(null);
}

export const AppContext = createContext(
  undefined
) as any as Context<IAppContext>;

export const useAppContext = () => useContext<IAppContext>(AppContext);

interface Props {
  children: ReactElement;
}

export const AppContextProvider = ({ children }: Props) => {
  const [countries, setCountries] = useState<FeatureCollection>(
    data as FeatureCollection
  );
  const [selectedCountry, setSelectedCountry] = useState<Feature | null>(null);

  useEffect(() => {
    fetch(
      "https://api.ooni.io/api/v1/aggregation?test_name=web_connectivity&since=2022-11-19&until=2022-11-20&axis_x=measurement_start_day&axis_y=probe_cc"
    )
      .then((r) => r.json())
      .then((webData) => {
        console.log(webData);

        webData.result.forEach(
          ({
            confirmed_count,
            measurement_count,
            probe_cc,
          }: {
            confirmed_count: number;
            measurement_count: number;
            probe_cc: string;
          }) => {
            console.log(probe_cc, confirmed_count / measurement_count);
          }
        );
      });
  }, []);

  const countriesByCode = countries.features.reduce((acc, curr) => {
    acc[curr.properties.sov_a3] = curr;
    return acc;
  }, {} as Record<string, Feature>);

  return (
    <AppContext.Provider
      value={{
        countries,
        countriesByCode,
        setCountries,
        selectedCountry,
        setSelectedCountry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
