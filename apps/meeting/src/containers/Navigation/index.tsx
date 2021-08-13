// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import {
  Navbar,
  NavbarHeader,
  NavbarItem,
  Attendees,
  Eye,
  SignalStrength,
} from 'amazon-chime-sdk-component-library-react';

import { useNavigation } from '../../providers/NavigationProvider';
import { useAppState } from '../../providers/AppStateProvider';
import { LocalMediaStreamMetrics } from '../LocalMediaStreamMetrics';
import { VideoGridMode } from '../../types';
import GalleryLayout from '../../components/Icons/GalleryLayout';
import SpeakerLayout from '../../components/Icons/SpeakerLayout';

const Navigation = () => {
  const { toggleRoster, closeNavbar } = useNavigation();
  const { theme, toggleTheme, videoGridMode, setVideoGridMode } = useAppState();

  return (
    <Navbar className="nav" flexDirection="column" container>
      <NavbarHeader title="Navigation" onClose={closeNavbar} />
      <NavbarItem
        icon={<Attendees />}
        onClick={toggleRoster}
        label="Attendees"
      />
      <NavbarItem
        icon={
          videoGridMode === VideoGridMode.GalleryView ? (
            <SpeakerLayout />
          ) : (
            <GalleryLayout />
          )
        }
        onClick={(): void => {
          if (videoGridMode === VideoGridMode.GalleryView) {
            setVideoGridMode(VideoGridMode.FeaturedView);
          } else {
            setVideoGridMode(VideoGridMode.GalleryView);
          }
        }}
        label="Switch View"
      />
      <NavbarItem
        icon={<Eye />}
        onClick={toggleTheme}
        label={theme === 'light' ? 'Dark mode' : 'Light mode'}
      />
      <NavbarItem
        icon={<SignalStrength />}
        onClick={() => {}}
        label="Media metrics"
      >
        <LocalMediaStreamMetrics />
      </NavbarItem>
    </Navbar>
  );
};

export default Navigation;
