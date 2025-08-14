import React, { useEffect, useState, useRef } from 'react';
import { Keyboard, EmitterSubscription, Platform } from 'react-native';

const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

export const useKeyboardStatus = () => {
  const [isKeyboardFullyShown, setIsKeyboardFullyShown] = useState(false);

  // 使用防抖包裝狀態更新函數
  const debouncedSetKeyboardShown = useRef(
    debounce((value: boolean) => {
      console.log('KeyboardManager: Setting keyboard status to', value);
      setIsKeyboardFullyShown(value);
    }, 300)
  ).current;

  useEffect(() => {
    let keyboardWillShowListener: EmitterSubscription;
    let keyboardDidShowListener: EmitterSubscription;
    let keyboardWillHideListener: EmitterSubscription;
    let keyboardDidHideListener: EmitterSubscription;

    if (Platform.OS === 'ios') {
      keyboardWillShowListener = Keyboard.addListener(
        'keyboardWillShow',
        () => {
          debouncedSetKeyboardShown(false);
        }
      );
      keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          debouncedSetKeyboardShown(true);
        }
      );
      keyboardWillHideListener = Keyboard.addListener(
        'keyboardWillHide',
        () => {
          debouncedSetKeyboardShown(false);
        }
      );
      keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          debouncedSetKeyboardShown(false);
        }
      );
    } else {
      keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          debouncedSetKeyboardShown(true);
        }
      );
      keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          debouncedSetKeyboardShown(false);
        }
      );
    }

    return () => {
      if (Platform.OS === 'ios') {
        keyboardWillShowListener?.remove();
      }
      keyboardDidShowListener?.remove();
      if (Platform.OS === 'ios') {
        keyboardWillHideListener?.remove();
      }
      keyboardDidHideListener?.remove();
    };
  }, []);

  return isKeyboardFullyShown;
};
