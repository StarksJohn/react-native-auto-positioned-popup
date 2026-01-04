import React, { useEffect, useState, useRef } from 'react';
import { Keyboard, EmitterSubscription, Platform, KeyboardEvent } from 'react-native';

// DEBUG FLAG: Set to false to disable all console logs for better performance
const KEYBOARD_DEBUG = false;
const debugLog = (...args: any[]) => {
  if (KEYBOARD_DEBUG) {
    console.log(...args);
  }
};

// Debounce function
const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// V19: Return type for keyboard status hook - includes height for accurate positioning
interface KeyboardStatus {
  isShown: boolean;
  height: number;
}

export const useKeyboardStatus = (): KeyboardStatus => {
  const [isKeyboardFullyShown, setIsKeyboardFullyShown] = useState(false);
  // V19: Track keyboard height for popup positioning
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Add state cache to avoid repeatedly setting the same state
  const currentKeyboardStatusRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingValueRef = useRef<boolean | null>(null);

  // Wrapper function: check state before debounce
  const safeSetKeyboardShown = useRef((value: boolean) => {
    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastUpdateTimeRef.current;

    // ✅ FIX: Check state before debounce
    if (currentKeyboardStatusRef.current === value) {
      debugLog('KeyboardManager: Skip - Keyboard state unchanged (before debounce)', { value, timeSinceLastUpdate });
      return;
    }

    // ✅ FIX: Skip if the same value is already pending
    if (pendingValueRef.current === value) {
      debugLog('KeyboardManager: Skip - Same value already in processing queue', { value });
      return;
    }

    // ✅ FIX: Mark the value being processed
    pendingValueRef.current = value;

    // Call the actual update function
    debouncedSetKeyboardShownInternal(value, currentTime, timeSinceLastUpdate);
  }).current;

  // Internal debounce function
  const debouncedSetKeyboardShownInternal = useRef(
    debounce((value: boolean, currentTime: number, timeSinceLastUpdate: number) => {
      // ✅ FIX: Check state again (in case state was updated during debounce)
      if (currentKeyboardStatusRef.current === value) {
        debugLog('KeyboardManager: Skip - Keyboard state unchanged (after debounce)', { value, timeSinceLastUpdate });
        pendingValueRef.current = null;
        return;
      }

      debugLog('KeyboardManager: Setting keyboard status to', value, {
        previousValue: currentKeyboardStatusRef.current,
        timeSinceLastUpdate
      });

      currentKeyboardStatusRef.current = value;
      lastUpdateTimeRef.current = currentTime;
      pendingValueRef.current = null;
      setIsKeyboardFullyShown(value);
    }, 300)
  ).current;

  // Use the wrapped function
  const debouncedSetKeyboardShown = safeSetKeyboardShown;

  useEffect(() => {
    let keyboardDidShowListener: EmitterSubscription;
    let keyboardDidHideListener: EmitterSubscription;

    // ✅ FIX: Use the same logic for iOS and Android - only listen to Did events
    // Remove Will event listeners to avoid duplicate triggers and state race conditions
    keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        // V19: Capture keyboard height from event for accurate popup positioning
        const height = e.endCoordinates?.height || 0;
        debugLog('KeyboardManager: keyboardDidShow event', { height });
        setKeyboardHeight(height);

        // ✅ FIX: Add protection at event listener level - skip if keyboard is already open
        if (currentKeyboardStatusRef.current === true) {
          debugLog('KeyboardManager: Skip keyboardDidShow event - Keyboard is already open');
          return;
        }
        debouncedSetKeyboardShown(true);
      }
    );
    keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // V19: Reset keyboard height when keyboard hides
        setKeyboardHeight(0);

        // ✅ FIX: Add protection at event listener level - skip if keyboard is already closed
        if (currentKeyboardStatusRef.current === false) {
          debugLog('KeyboardManager: Skip keyboardDidHide event - Keyboard is already closed');
          return;
        }
        debouncedSetKeyboardShown(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // V19: Return both keyboard visibility status and height
  return { isShown: isKeyboardFullyShown, height: keyboardHeight };
};
