import React, { createContext, useContext, useState, useEffect } from 'react';

const CityContext = createContext(null);

export const CityProvider = ({ children }) => {
  const [city, setCity] = useState(() => localStorage.getItem('sc_city') || '');

  const changeCity = (newCity) => {
    setCity(newCity);
    localStorage.setItem('sc_city', newCity);
  };

  return (
    <CityContext.Provider value={{ city, changeCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
};
