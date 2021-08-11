import {
  Arrow,
  ControlBarButton,
  // useRosterState,
  ZoomIn,
  ZoomOut,
} from 'amazon-chime-sdk-component-library-react';
import React from 'react';
import { useVideoGridControls } from '../../providers/VideoGridProvider';
import { GridControlMode } from '../../types';

const GridControl = (props: { mode: GridControlMode }) => {
  const { mode } = props;
  const { zoomIn, zoomOut, prevPage, nextPage } = useVideoGridControls();

  const handleClick = (): void => {
    switch (mode) {
      case GridControlMode.PrevPage:
        prevPage();
        break;
      case GridControlMode.NextPage:
        nextPage();
        break;
      case GridControlMode.ZoomIn:
        zoomIn();
        break;
      case GridControlMode.ZoomOut:
        zoomOut();
        break;
      // no default
    }
  };

  let icon;
  switch (mode) {
    case GridControlMode.PrevPage:
      icon = <Arrow direction="left" />;
      break;
    case GridControlMode.NextPage:
      icon = <Arrow direction="right" />;
      break;
    case GridControlMode.ZoomIn:
      icon = <ZoomIn />;
      break;
    case GridControlMode.ZoomOut:
      icon = <ZoomOut />;
      break;
    // no default
  }

  let label;
  switch (mode) {
    case GridControlMode.PrevPage:
      label = 'Prev';
      break;
    case GridControlMode.NextPage:
      label = 'Next';
      break;
    case GridControlMode.ZoomIn:
      label = 'Zoom In';
      break;
    case GridControlMode.ZoomOut:
      label = 'Zoom Out';
      break;
    // no default
  }

  return <ControlBarButton icon={icon} onClick={handleClick} label={label} />;
};

export default GridControl;
