// src/helpers/constants.ts
export const CursorStyle = {
    EW_RESIZE: 'ew-resize',
    NS_RESIZE: 'ns-resize',
    NWSE_RESIZE: 'nwse-resize',
    NESW_RESIZE: 'nesw-resize',
    POINTER: 'pointer',
} as const;

export const ExternalId = {
    LEFT_HANDLE: 'left-handle',
    RIGHT_HANDLE: 'right-handle',
    TOP_HANDLE: 'top-handle',
    BOTTOM_HANDLE: 'bottom-handle',
    TOP_LEFT_HANDLE: 'top-left-handle',
    TOP_RIGHT_HANDLE: 'top-right-handle',
    BOTTOM_LEFT_HANDLE: 'bottom-left-handle',
    BOTTOM_RIGHT_HANDLE: 'bottom-right-handle',
        BODY: 'body',
    DELETE_BUTTON: 'delete-button',
} as const;
