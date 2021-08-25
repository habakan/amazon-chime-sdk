import {
  TargetDisplaySize,
  VideoPreference,
  VideoPreferences,
  VideoSource,
} from 'amazon-chime-sdk-js';
import { priorityBasedPolicy } from '../../meetingConfig';
import { VideoGridMode } from '../../types';

interface AttendeeState {
  attendeeId: string;
  name: string;
  videoEnabled: boolean;
  bandwidthConstrained: boolean;
}

interface GridState {
  hasLocalVideoTile: boolean;
  hasLocalContentSharingTile: boolean;
}

interface PaginationState {
  currentPage: number;
  isZoomed: boolean;
  zoomedLevel: number;
  zoomedLevelIndex: number;
}

export type State = {
  attendeeStates: { [attendeeId: string]: AttendeeState };
  availableVideoSources: string[];
  activeSpeakers: string[];
  viewMode: VideoGridMode;
  localTileState: GridState;
  paginationState: PaginationState;
};

export type RosterAttendeeType = {
  chimeAttendeeId: string;
  externalUserId?: string;
  name?: string;
};

export type RosterType = {
  [attendeeId: string]: RosterAttendeeType;
};

export type Controls = {
  zoomIn: () => void;
  zoomOut: () => void;
  prevPage: () => void;
  nextPage: () => void;
};

export enum VideoGridAction {
  ResetVideoGridState,
  UpdateViewMode,
  UpdateVideoSources,
  UpdateActiveSpeakers,
  UpdateAttendeeStates,
  UpdateLocalTileState,
  PauseVideoTile,
  UnpauseVideoTile,
  ZoomIn,
  ZoomOut,
  PrevPage,
  NextPage,
}

type ResetVideoGridState = {
  type: VideoGridAction.ResetVideoGridState;
  payload?: any;
};

type UpdateVideoSources = {
  type: VideoGridAction.UpdateVideoSources;
  payload: {
    videoSources: VideoSource[];
  };
};

type UpdateActiveSpeakers = {
  type: VideoGridAction.UpdateActiveSpeakers;
  payload: {
    activeSpeakers: string[];
  };
};

type UpdateViewMode = {
  type: VideoGridAction.UpdateViewMode;
  payload: {
    videoGridMode: VideoGridMode;
  };
};

type UpdateAttendeeStates = {
  type: VideoGridAction.UpdateAttendeeStates;
  payload: {
    roster: RosterType;
  };
};

type UpdateLocalTileState = {
  type: VideoGridAction.UpdateLocalTileState;
  payload: {
    isVideoEnabled: boolean;
    isLocalUserSharing: boolean;
  };
};

type PauseVideoTile = {
  type: VideoGridAction.PauseVideoTile;
  payload: {
    attendeeId: string;
  };
};

type UnpauseVideoTile = {
  type: VideoGridAction.UnpauseVideoTile;
  payload: {
    attendeeId: string;
  };
};

type ZoomIn = {
  type: VideoGridAction.ZoomIn;
  payload?: any;
};

type ZoomOut = {
  type: VideoGridAction.ZoomOut;
  payload?: any;
};

type PreviousPage = {
  type: VideoGridAction.PrevPage;
  payload?: any;
};

type NextPage = {
  type: VideoGridAction.NextPage;
  payload?: any;
};

export type Action =
  | UpdateVideoSources
  | ResetVideoGridState
  | UpdateViewMode
  | UpdateAttendeeStates
  | UpdateLocalTileState
  | UpdateActiveSpeakers
  | PauseVideoTile
  | UnpauseVideoTile
  | ZoomIn
  | ZoomOut
  | PreviousPage
  | NextPage;

export const initialState: State = {
  attendeeStates: {},
  availableVideoSources: [],
  activeSpeakers: [],
  viewMode: VideoGridMode.GalleryView,
  localTileState: {
    hasLocalVideoTile: false,
    hasLocalContentSharingTile: false,
  },
  paginationState: {
    currentPage: 1,
    isZoomed: false,
    zoomedLevel: 0,
    zoomedLevelIndex: 0,
  },
};

const zoomedLevels: number[] = [0, 1, 2, 4, 8, 16, 25];

export function reducer(state: State, { type, payload }: Action): State {
  const { attendeeStates } = state;
  let {
    availableVideoSources,
    activeSpeakers,
    viewMode,
    localTileState,
    paginationState,
  } = state;

  const updateZoomState = (): void => {
    const size = availableVideoSources.length;
    for (let i = 1; i < zoomedLevels.length - 1; i += 1) {
      if (zoomedLevels[i] === size) {
        paginationState.zoomedLevelIndex = i;
      } else if (zoomedLevels[i] < size) {
        paginationState.zoomedLevelIndex = i + 1;
      }
    }
    paginationState.zoomedLevel =
      zoomedLevels[paginationState.zoomedLevelIndex];
  };

  const calculateVideoSourcesToBeRendered = (): string[] => {
    const { currentPage, zoomedLevel } = paginationState;

    if (viewMode === VideoGridMode.GalleryView) {
      const start = (currentPage - 1) * zoomedLevel;
      const end = currentPage * zoomedLevel;

      // if (activeSpeakers.length > 0) {
      //   // To Do: Fix missing attendee
      //   return [activeSpeakers[0]].concat(
      //     availableVideoSources.slice(start, end - 1)
      //   );
      // }
      return availableVideoSources.slice(start, end);
    }

    if (viewMode === VideoGridMode.FeaturedView) {
      const maxGridSize = 4;
      // To Do: Prioritize content share
      return activeSpeakers.slice(0, maxGridSize);
    }

    return [];
  };

  const updateDownlinkPreferences = (): void => {
    const videoSourcesToBeRendered = calculateVideoSourcesToBeRendered();
    const videoPreferences = VideoPreferences.prepare();
    const thresholds = 8;
    let targetDisplaySize: TargetDisplaySize;

    if (videoSourcesToBeRendered.length < thresholds) {
      targetDisplaySize = TargetDisplaySize.High;
    } else {
      targetDisplaySize = TargetDisplaySize.Low;
    }

    for (const attendeeId of videoSourcesToBeRendered) {
      videoPreferences.add(
        new VideoPreference(attendeeId, 1, targetDisplaySize)
      );
    }
    priorityBasedPolicy.chooseRemoteVideoSources(videoPreferences.build());
  };

  switch (type) {
    case VideoGridAction.ResetVideoGridState: {
      return initialState;
    }
    case VideoGridAction.UpdateViewMode: {
      const { videoGridMode } = payload;
      viewMode = videoGridMode;
      updateDownlinkPreferences();

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.UpdateVideoSources: {
      const { videoSources } = payload;

      // Reset the `videoEnabled` of all attendeeStates
      for (const attendee of Object.values(attendeeStates)) {
        attendee.videoEnabled = false;
      }

      // Update the `videoEnabled` based on `videoSources`
      for (const videoSource of videoSources) {
        const { attendee } = videoSource;
        const { attendeeId } = attendee;

        // This condition only triggers by content sharing
        if (!(attendeeId in attendeeStates)) {
          attendeeStates[attendeeId] = { attendeeId } as AttendeeState;
        }
        attendeeStates[attendeeId].videoEnabled = true;
      }

      // Populate the `availableVideoSources` based on the order of attendeeStates
      const newAvailableVideoSources: string[] = [];
      for (const attendee of Object.values(attendeeStates)) {
        if (attendee.videoEnabled) {
          newAvailableVideoSources.push(attendee.attendeeId);
        }
      }

      availableVideoSources = newAvailableVideoSources;

      if (availableVideoSources.length === 0) {
        paginationState = {
          currentPage: 1,
          isZoomed: false,
          zoomedLevel: 0,
          zoomedLevelIndex: 0,
        };
      } else {
        if (!paginationState.isZoomed) {
          // If not manually zoomed in, change the zoomLevel accordingly
          updateZoomState();
        }
        updateDownlinkPreferences();
      }
      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.UpdateAttendeeStates: {
      const { roster } = payload;
      const attendeeIds = Object.keys(roster);
      const newAttendeeStates: { [attendeeID: string]: AttendeeState } = {};

      for (const attendeeId of attendeeIds) {
        const name = roster[attendeeId]?.name || '';
        if (attendeeId in attendeeStates) {
          newAttendeeStates[attendeeId] = attendeeStates[attendeeId];
          // Sometimes the `useRosterState` hook doesn't return `name`
          // property at the first time, but will return it later
          newAttendeeStates[attendeeId].name = roster[attendeeId]?.name || '';
        } else {
          newAttendeeStates[attendeeId] = {
            attendeeId,
            name,
            videoEnabled: false,
            bandwidthConstrained: false,
          } as AttendeeState;
        }
      }

      return {
        attendeeStates: newAttendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.UpdateLocalTileState: {
      const { isVideoEnabled, isLocalUserSharing } = payload;
      localTileState.hasLocalVideoTile = isVideoEnabled;
      localTileState.hasLocalContentSharingTile = isLocalUserSharing;

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.UpdateActiveSpeakers: {
      const { activeSpeakers: newActiveSpeakers } = payload;
      updateDownlinkPreferences();

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers: newActiveSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.PauseVideoTile: {
      const { attendeeId } = payload;
      attendeeStates[attendeeId].bandwidthConstrained = true;

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.UnpauseVideoTile: {
      const { attendeeId } = payload;
      attendeeStates[attendeeId].bandwidthConstrained = false;

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.ZoomIn: {
      if (paginationState.zoomedLevelIndex > 1) {
        paginationState.zoomedLevelIndex -= 1;
        paginationState.zoomedLevel =
          zoomedLevels[paginationState.zoomedLevelIndex];
        paginationState.isZoomed = true;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not zoom in');
      }

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.ZoomOut: {
      if (
        paginationState.zoomedLevel < availableVideoSources.length &&
        paginationState.zoomedLevelIndex < zoomedLevels.length - 2
      ) {
        paginationState.zoomedLevelIndex += 1;
        paginationState.zoomedLevel =
          zoomedLevels[paginationState.zoomedLevelIndex];
        paginationState.currentPage = 1;
        paginationState.isZoomed = true;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not zoom out');
      }

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.PrevPage: {
      if (paginationState.currentPage > 1) {
        paginationState.currentPage -= 1;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not prev page');
      }

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    case VideoGridAction.NextPage: {
      if (
        paginationState.zoomedLevel * paginationState.currentPage <
        availableVideoSources.length
      ) {
        paginationState.currentPage += 1;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not next page');
      }

      return {
        attendeeStates,
        availableVideoSources,
        activeSpeakers,
        viewMode,
        localTileState,
        paginationState,
      };
    }
    default:
      throw new Error('Incorrect type in VideoGridStateProvider');
  }
}
