import React from "react";
import "./App.css";
import { Map } from "./components/Map";
import { Details } from "./components/Details";
import { AppContextProvider } from "./Context";

export default function App() {
  return (
    <AppContextProvider>
      <div className="App">
        <Map />
        <Details />
      </div>
    </AppContextProvider>
  );
}
