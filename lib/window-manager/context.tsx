'use client';

import React, { createContext, useCallback, useReducer, ReactNode } from 'react';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
}

export interface WindowManagerState {
  windows: Record<string, WindowState>;
  focusedWindowId: string | null;
  nextZIndex: number;
}

type WindowAction =
  | { type: 'OPEN_WINDOW'; payload: Omit<WindowState, 'zIndex'> }
  | { type: 'CLOSE_WINDOW'; payload: string }
  | { type: 'FOCUS_WINDOW'; payload: string }
  | { type: 'MINIMIZE_WINDOW'; payload: string }
  | { type: 'MAXIMIZE_WINDOW'; payload: string }
  | { type: 'UPDATE_POSITION'; payload: { windowId: string; position: WindowPosition } }
  | { type: 'UPDATE_SIZE'; payload: { windowId: string; size: WindowSize } };

const initialState: WindowManagerState = {
  windows: {},
  focusedWindowId: null,
  nextZIndex: 100,
};

function windowManagerReducer(
  state: WindowManagerState,
  action: WindowAction
): WindowManagerState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const newZIndex = state.nextZIndex + 1;
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.id]: {
            ...action.payload,
            zIndex: newZIndex,
          },
        },
        focusedWindowId: action.payload.id,
        nextZIndex: newZIndex,
      };
    }

    case 'CLOSE_WINDOW': {
      const { [action.payload]: _, ...restWindows } = state.windows;
      return {
        ...state,
        windows: restWindows,
        focusedWindowId: state.focusedWindowId === action.payload ? null : state.focusedWindowId,
      };
    }

    case 'FOCUS_WINDOW': {
      if (!(action.payload in state.windows)) {
        return state;
      }
      const newZIndex = state.nextZIndex + 1;
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: {
            ...state.windows[action.payload],
            zIndex: newZIndex,
          },
        },
        focusedWindowId: action.payload,
        nextZIndex: newZIndex,
      };
    }

    case 'MINIMIZE_WINDOW': {
      if (!(action.payload in state.windows)) {
        return state;
      }
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: {
            ...state.windows[action.payload],
            isMinimized: true,
          },
        },
      };
    }

    case 'MAXIMIZE_WINDOW': {
      if (!(action.payload in state.windows)) {
        return state;
      }
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: {
            ...state.windows[action.payload],
            isMinimized: false,
          },
        },
      };
    }

    case 'UPDATE_POSITION': {
      if (!(action.payload.windowId in state.windows)) {
        return state;
      }
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.windowId]: {
            ...state.windows[action.payload.windowId],
            position: action.payload.position,
          },
        },
      };
    }

    case 'UPDATE_SIZE': {
      if (!(action.payload.windowId in state.windows)) {
        return state;
      }
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload.windowId]: {
            ...state.windows[action.payload.windowId],
            size: action.payload.size,
          },
        },
      };
    }

    default:
      return state;
  }
}

interface WindowManagerContextType {
  state: WindowManagerState;
  openWindow: (window: Omit<WindowState, 'zIndex'>) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: WindowPosition) => void;
  updateWindowSize: (windowId: string, size: WindowSize) => void;
}

export const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(windowManagerReducer, initialState);

  const openWindow = useCallback((window: Omit<WindowState, 'zIndex'>) => {
    dispatch({ type: 'OPEN_WINDOW', payload: window });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: windowId });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: windowId });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MINIMIZE_WINDOW', payload: windowId });
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MAXIMIZE_WINDOW', payload: windowId });
  }, []);

  const updateWindowPosition = useCallback((windowId: string, position: WindowPosition) => {
    dispatch({ type: 'UPDATE_POSITION', payload: { windowId, position } });
  }, []);

  const updateWindowSize = useCallback((windowId: string, size: WindowSize) => {
    dispatch({ type: 'UPDATE_SIZE', payload: { windowId, size } });
  }, []);

  return (
    <WindowManagerContext.Provider
      value={{
        state,
        openWindow,
        closeWindow,
        focusWindow,
        minimizeWindow,
        maximizeWindow,
        updateWindowPosition,
        updateWindowSize,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}
