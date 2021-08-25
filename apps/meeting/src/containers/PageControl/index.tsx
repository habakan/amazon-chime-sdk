import {
  Caret,
  IconButton,
  useUserActivityState,
} from 'amazon-chime-sdk-component-library-react';
import React from 'react';
import { useAppState } from '../../providers/AppStateProvider';
import { useVideoGridControls } from '../../providers/VideoGridProvider';
import { PageControlMode, VideoGridMode } from '../../types';
import { StyledControl } from './Styled';

const PageControl = (props: { mode: PageControlMode }) => {
  const { mode } = props;
  const { isUserActive } = useUserActivityState();
  const { videoGridMode } = useAppState();
  const { prevPage, nextPage } = useVideoGridControls();

  const handleClick = (): void => {
    switch (mode) {
      case PageControlMode.PrevPage:
        prevPage();
        break;
      case PageControlMode.NextPage:
        nextPage();
        break;
      // no default
    }
  };

  let icon;
  let label;

  switch (mode) {
    case PageControlMode.PrevPage:
      icon = <Caret direction="left" />;
      label = 'Prev Page';
      break;
    case PageControlMode.NextPage:
      icon = <Caret direction="right" />;
      label = 'Next Page';
      break;
    // no default
  }
  return (
    <StyledControl
      className={
        mode === PageControlMode.PrevPage
          ? 'page-control-left'
          : 'page-control-right'
      }
      active={!!isUserActive}
      style={{
        display: videoGridMode === VideoGridMode.GalleryView ? 'flex' : 'none',
      }}
    >
      <IconButton
        icon={icon}
        onClick={handleClick}
        label={label}
        iconSize="md"
      />
    </StyledControl>
  );
};

export default PageControl;
