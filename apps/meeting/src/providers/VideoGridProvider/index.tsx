// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  useAudioVideo,
  useRosterState,
} from 'amazon-chime-sdk-component-library-react';
import { AudioVideoObserver, VideoSource } from 'amazon-chime-sdk-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  Controls,
  initialState,
  reducer,
  State,
  VideoGridAction,
} from './state';

const VideoGridStateContext = createContext<State | null>(null);
const VideoGridControlsContext = createContext<Controls | null>(null);

const VideoGridProvider: React.FC = ({ children }) => {
  const audioVideo = useAudioVideo();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { roster } = useRosterState();

  useEffect(() => {
    if (!audioVideo) {
      return;
    }

    dispatch({
      type: VideoGridAction.UpdateRoster,
      payload: { roster },
    });
  }, [audioVideo, roster]);

  useEffect(() => {
    if (!audioVideo) {
      return;
    }

    return (): void => dispatch({ type: VideoGridAction.ResetVideoGridState });
  }, [audioVideo]);

  useEffect(() => {
    if (!audioVideo) {
      return;
    }

    const observer: AudioVideoObserver = {
      remoteVideoSourcesDidChange: (videoSources: VideoSource[]) => {
        dispatch({
          type: VideoGridAction.UpdateVideoSources,
          payload: { videoSources },
        });
      },
    };

    audioVideo.addObserver(observer);

    return (): void => audioVideo.removeObserver(observer);
  }, [audioVideo]);

  const zoomIn = useCallback(() => {
    dispatch({ type: VideoGridAction.ZoomIn });
  }, []);

  const zoomOut = useCallback(() => {
    dispatch({ type: VideoGridAction.ZoomOut });
  }, []);

  const prevPage = useCallback(() => {
    dispatch({ type: VideoGridAction.PrevPage });
  }, []);

  const nextPage = useCallback(() => {
    dispatch({ type: VideoGridAction.NextPage });
  }, []);

  const controls: Controls = useMemo(
    () => ({
      zoomIn,
      zoomOut,
      prevPage,
      nextPage,
    }),
    [nextPage, prevPage, zoomIn, zoomOut]
  );

  return (
    <VideoGridStateContext.Provider value={state}>
      <VideoGridControlsContext.Provider value={controls}>
        {children}
      </VideoGridControlsContext.Provider>
    </VideoGridStateContext.Provider>
  );
};

const useVideoGridState = (): State => {
  const state = useContext(VideoGridStateContext);

  if (!state) {
    throw new Error(
      'useVideoGridState must be used within a VideoGridStateProvider'
    );
  }

  return state;
};
const useVideoGridControls = (): Controls => {
  const context = useContext(VideoGridControlsContext);

  if (!context) {
    throw new Error(
      'useVideoGridControls must be used within VideoGridProvider'
    );
  }
  return context;
};
export { VideoGridProvider, useVideoGridState, useVideoGridControls };
