// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  ControlBar,
  ControlBarButton,
  useUserActivityState,
  Dots,
} from 'amazon-chime-sdk-component-library-react';

import { useNavigation } from '../../providers/NavigationProvider';
import { StyledControls } from './Styled';
import GridControl from '../GridControl';
import { GridControlMode } from '../../types';

const GridControls = (): ReactElement => {
  const { toggleNavbar, closeRoster, showRoster } = useNavigation();
  const { isUserActive } = useUserActivityState();

  const handleToggle = (): void => {
    if (showRoster) {
      closeRoster();
    }

    toggleNavbar();
  };

  return (
    <StyledControls className="grid-controls" active={!!isUserActive}>
      <ControlBar className="controls-menu" layout="right" showLabels={false}>
        <ControlBarButton
          className="mobile-toggle"
          icon={<Dots />}
          onClick={handleToggle}
          label="Menu"
        />
        <GridControl mode={GridControlMode.PrevPage} />
        <GridControl mode={GridControlMode.ZoomIn} />
        <GridControl mode={GridControlMode.ZoomOut} />
        <GridControl mode={GridControlMode.NextPage} />
      </ControlBar>
    </StyledControls>
  );
};

export default GridControls;
