export interface ChangeMessage {
    message: 'change';
    value: {
        on: boolean;
        boldness: number;
    };
}

export interface BoldItStorage {
    isActive: boolean;
    additionalBoldness: number;
}
