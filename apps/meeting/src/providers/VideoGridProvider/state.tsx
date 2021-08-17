import {
  TargetDisplaySize,
  VideoPreference,
  VideoPreferences,
  VideoSource,
} from 'amazon-chime-sdk-js';
import { priorityBasedPolicy } from '../../meetingConfig';

interface AttendeeStatus {
  attendeeId: string;
  name: string;
  videoEnabled: boolean;
  bandwidthConstrained: boolean;
  // sharingContent: boolean;
}

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

export type State = {
  // Keep the order of attendees based on Roster
  attendees: { [attendeeId: string]: AttendeeStatus };
  // Remote video sources sorted in the order of roster
  availableVideoSources: string[];
  // Pagination state
  currentPage: number;
  isZoomed: boolean;
  zoomedLevel: number;
  zoomedLevelIndex: number;
};

export enum VideoGridAction {
  UpdateVideoSources,
  ResetVideoGridState,
  UpdateRoster,
  PauseVideoTile,
  UnpauseVideoTile,
  ZoomIn,
  ZoomOut,
  PrevPage,
  NextPage,
}

type UpdateVideoSources = {
  type: VideoGridAction.UpdateVideoSources;
  payload: {
    videoSources: VideoSource[];
  };
};

type ResetVideoGridState = {
  type: VideoGridAction.ResetVideoGridState;
  payload?: any;
};

type UpdateRoster = {
  type: VideoGridAction.UpdateRoster;
  payload: {
    roster: RosterType;
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
  | UpdateRoster
  | PauseVideoTile
  | UnpauseVideoTile
  | ZoomIn
  | ZoomOut
  | PreviousPage
  | NextPage;

export const initialState: State = {
  attendees: {},
  availableVideoSources: [],
  currentPage: 1,
  isZoomed: false,
  zoomedLevel: 0,
  zoomedLevelIndex: 0,
};

const zoomedLevels: number[] = [0, 1, 2, 4, 8, 16, 25];

export function reducer(state: State, { type, payload }: Action): State {
  const { attendees } = state;
  let {
    availableVideoSources,
    currentPage,
    isZoomed,
    zoomedLevel,
    zoomedLevelIndex,
  } = state;

  const updateZoomStatus = (): void => {
    const size = availableVideoSources.length;
    for (let i = 1; i < zoomedLevels.length - 1; i += 1) {
      if (zoomedLevels[i] === size) {
        zoomedLevelIndex = i;
      } else if (zoomedLevels[i] < size) {
        zoomedLevelIndex = i + 1;
      }
    }
    zoomedLevel = zoomedLevels[zoomedLevelIndex];
  };

  const calculateVideoSourcesToBeRendered = (): string[] => {
    const left = (currentPage - 1) * zoomedLevel;
    const right = currentPage * zoomedLevel;
    return availableVideoSources.slice(left, right);
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
    case VideoGridAction.UpdateVideoSources: {
      const { videoSources } = payload;

      // Reset the `videoEnabled` of all attendees
      for (const attendee of Object.values(attendees)) {
        attendee.videoEnabled = false;
      }

      // Update the `videoEnabled` based on `videoSources`
      for (const videoSource of videoSources) {
        const { attendee } = videoSource;
        const { attendeeId } = attendee;

        // To do: check if this triggers only by content sharing
        if (!(attendeeId in attendees)) {
          attendees[attendeeId] = { attendeeId } as AttendeeStatus;
        }
        attendees[attendeeId].videoEnabled = true;
      }

      // Populate the `availableVideoSources` based on the order of attendees
      const newAvailableVideoSources: string[] = [];
      for (const attendee of Object.values(attendees)) {
        if (attendee.videoEnabled) {
          newAvailableVideoSources.push(attendee.attendeeId);
        }
      }

      availableVideoSources = newAvailableVideoSources;

      if (availableVideoSources.length === 0) {
        currentPage = 1;
        isZoomed = false;
        zoomedLevel = 0;
        zoomedLevelIndex = 0;
      } else {
        if (!isZoomed) {
          // If not manually zoomed in, change the zoomLevel accordingly
          updateZoomStatus();
        }
        updateDownlinkPreferences();
      }

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.UpdateRoster: {
      const { roster } = payload;
      const attendeeIds = Object.keys(roster);
      const newAttendees: { [attendeeID: string]: AttendeeStatus } = {};

      for (const attendeeId of attendeeIds) {
        const { name } = roster[attendeeId];
        newAttendees[attendeeId] =
          attendeeId in attendees
            ? attendees[attendeeId]
            : ({
                attendeeId,
                name,
                videoEnabled: false,
                bandwidthConstrained: false,
              } as AttendeeStatus);
      }

      return {
        attendees: newAttendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.PauseVideoTile: {
      const { attendeeId } = payload;
      attendees[attendeeId].bandwidthConstrained = true;

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.UnpauseVideoTile: {
      const { attendeeId } = payload;
      attendees[attendeeId].bandwidthConstrained = false;

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.ZoomIn: {
      if (zoomedLevelIndex > 1) {
        zoomedLevelIndex -= 1;
        zoomedLevel = zoomedLevels[zoomedLevelIndex];
        isZoomed = true;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not zoom in');
      }

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.ZoomOut: {
      if (
        zoomedLevel < availableVideoSources.length &&
        zoomedLevelIndex < zoomedLevels.length - 2
      ) {
        zoomedLevelIndex += 1;
        zoomedLevel = zoomedLevels[zoomedLevelIndex];
        currentPage = 1;
        isZoomed = true;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not zoom out');
      }

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.PrevPage: {
      if (currentPage > 1) {
        currentPage -= 1;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not prev page');
      }

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    case VideoGridAction.NextPage: {
      if (zoomedLevel * currentPage < availableVideoSources.length) {
        currentPage += 1;
        updateDownlinkPreferences();
      } else {
        console.debug('Can not next page');
      }

      return {
        attendees,
        availableVideoSources,
        currentPage,
        isZoomed,
        zoomedLevel,
        zoomedLevelIndex,
      };
    }
    default:
      throw new Error('Incorrect type in VideoGridStateProvider');
  }
}
