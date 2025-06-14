/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

export const ColorModeContext = createContext(undefined);

export const ColorModeManagerProvider = ({ children }) => {
  const [mode, setMode] = useState('light'); // Default to light

  useEffect(() => {
    const storedMode = localStorage.getItem('chakra-color-mode');
    if (storedMode) {
      setMode(storedMode);
    }
  }, []);

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('chakra-color-mode', mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ColorModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ColorModeContext.Provider>
  );
};

export const useColorModeManager = () => {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorModeManager must be used within a ColorModeManagerProvider');
  }
  return context;
};

ColorModeManagerProvider.propTypes = {
    children: PropTypes.node.isRequired
};
