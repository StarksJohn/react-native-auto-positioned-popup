/**
 * Event names used by AutoPositionedPopup component
 * These constants can be used with global event emitters to coordinate
 * search query changes across different components
 */
export const AutoPositionedPopupEventNames = {
  /**
   * Event fired when the search query in AutoPositionedPopup changes
   * Payload: { tag: string; searchQuery: string }
   * - tag: Identifier for which popup instance triggered the event
   * - searchQuery: The current search text
   */
  searchQueryChange: 'AutoPositionedPopup搜索查询变更',
} as const;

/**
 * Type for AutoPositionedPopup event names
 */
export type AutoPositionedPopupEventName = typeof AutoPositionedPopupEventNames[keyof typeof AutoPositionedPopupEventNames];
