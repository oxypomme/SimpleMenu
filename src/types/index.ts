/**
 * Detailled entry in the menu
 */
export interface SMContent {
  /** The label of the entry */
  label?: string | HTMLElement;
  /** Action triggered when user click on the entry */
  action?: SMHandler;
  /** Icon prefix of the entry */
  prefix?: string | HTMLElement;
  /** Icon suffix of the entry */
  suffix?: string | HTMLElement;
  /** Custom CSS as a `string` passed to the entry (through `emotion`) */
  css?: string;
  /** Custom CSS classes passed to the menu */
  classList?: string[];
  /** Sub-menu content */
  sub?: SMContext;
}
export const SMContentKeys = [
  'label',
  'action',
  'prefix',
  'suffix',
  'css',
  'classList',
  'sub'
];

/**
 * Action triggered when user click on the action
 *
 * @param ev The original event
 * @param origin The parent of the menu
 */
// eslint-disable-next-line no-unused-vars
export type SMHandler = (ev: MouseEvent, origin: HTMLElement) => void;

export type SMContextEntry = SMContent | SMContext | SMHandler | string;

/**
 * Classic interface for menu and sub-menu
 */
export interface SMContext {
  [item: string]: SMContextEntry;
}

export interface SMOptions {
  /** If we need to close the menu after a click (default: `false`) */
  quitAfterClick?: boolean;
  /** Custom CSS as a `string` passed to the menu (through `emotion`) */
  css?: string;
  /** Custom CSS classes passed to the menu */
  classList?: string[];
  /** If no suffix is defined, sub-menu holders will not have a `>` (default: `false`) */
  noPredefinedSuffix?: boolean;
}
