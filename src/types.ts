import type { DOMAIN_SPECIFIC_CHANGE_EVENT } from './constants';

export interface ChangeMessage {
    message: 'change';
    value: {
        on: boolean;
        boldness: number;
    };
}

export interface SpecificDomainChangeMessage {
    message: typeof DOMAIN_SPECIFIC_CHANGE_EVENT;
    value: {
        on: boolean;
        domain: string;
        boldness: number;
    };
}

export interface BoldItStorage {
    isActive: boolean;
    additionalBoldness: number;
    specificDomains: Record<string, number>;
}
