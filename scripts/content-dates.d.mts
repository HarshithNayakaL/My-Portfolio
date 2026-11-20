export declare const SOURCE_GROUPS: Record<"home" | "work" | "guides" | "legal" | "profile", string[]>;
export declare function contentDates(): Record<"home" | "work" | "guides" | "legal" | "profile", string>;
export declare const PAGE_DATES_FILE: string;
export declare function pageSources(): Record<string, { text: string; file?: string; start?: string; files?: string[] }>;
export declare function fingerprint(text: string): string;
export declare function pageDates(): Record<string, string>;
