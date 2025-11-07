import React, {ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, View, ViewStyle, Keyboard} from 'react-native';

interface DynamicViewBase {
  id: string;
  style: ViewStyle;
  component: ReactNode;
  useModal?: boolean;
  onModalClose?: () => void;
  centerDisplay?: boolean;
}

interface RootViewContextType {
  addRootView: (view: DynamicViewBase) => void;
  setRootViewNativeStyle: (id: string, style: ViewStyle) => void;
  updateRootView: (id: string, update: Partial<DynamicViewBase>) => void;
  removeRootView: (id?: string, force?: boolean, _rootViews?: DynamicViewBase[]) => void;
  rootViews: DynamicViewBase[];
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

interface RootViewProviderProps {
  children: ReactNode;
}

const RootViewContext = createContext<RootViewContextType | undefined>(undefined);
/**
 * Dynamically add or remove views on the root view.
 * @param children
 * @constructor
 */
export const RootViewProvider: React.FC<RootViewProviderProps> = ({children}) => {
  const [rootViews, setRootViews] = useState<DynamicViewBase[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const viewRefs = useRef<Record<string, View>>({});
  useEffect(() => {
    console.log('react-native-auto-positioned-popup RootViewProvider rootViews changed:', rootViews);
  }, [rootViews]);
  const addRootView = (view: DynamicViewBase): void => {
    // const id = `dynamic-view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newView: DynamicViewBase = {...view};
    console.log('react-native-auto-positioned-popup RootViewProvider addRootView rootViews=', rootViews);
    console.log('react-native-auto-positioned-popup RootViewProvider addRootView newView=', newView);
    setRootViews((prev) => [...prev, newView]);
  };

  const updateRootView = (id: string, update: Partial<DynamicViewBase>): void => {
    setRootViews((prev) => prev.map((view) => (view.id === id ? {...view, ...update} : view)));
  };

  /**
   * onScrollBeginDrag={() => {
   *                   requestAnimationFrame(() => {
   *                     removeRootView(undefined, true)
   *                   })
   *                 }}
   * @param id
   * @param force
   * @param _rootViews
   */
  const removeRootView = (id?: string, force?: boolean, _rootViews?: DynamicViewBase[]): void => {
    console.log('react-native-auto-positioned-popup RootViewProvider removeRootView=', {id, force, rootViews, _rootViews});
    // Ensure keyboard is dismissed when force removing all root views
    if (force) {
      // Dismiss keyboard first
      Keyboard.dismiss();
      // IMPORTANT: Increased delay from 50ms to 100ms to prevent touch event loss
      // Keyboard dismiss animation takes ~250-300ms, but we don't need to wait for it to fully complete
      // 100ms gives touch event system enough time to process pending events before views are removed
      setTimeout(() => {
        setRootViews((prev) => []);
        console.log('react-native-auto-positioned-popup RootViewProvider removeRootView setRootViews(prev => []) force=true');
      }, 100);
      return;
    }
    if (rootViews.length > 0 && id) {
      setRootViews((prev) => prev.filter((view) => view.id !== id));
      // else {
      //   console.log('RootViewProvider removeRootView setRootViews(prev => [])')
      //   setRootViews(prev => [])
      // }
    } else if (_rootViews && _rootViews.length > 0 && id) {
      setRootViews((prev) => prev.filter((view) => view.id !== id));
    }
  };

  const setRootViewNativeStyle = (id: string, style: ViewStyle): void => {
    const target = viewRefs.current[id];
    if (target) {
      // @ts-ignore - React Native setNativeProps
      target.setNativeProps({style});
    }
  };

  const contextValue = useMemo(
    () => ({
      addRootView,
      setRootViewNativeStyle,
      updateRootView,
      removeRootView,
      rootViews,
      searchQuery,
      setSearchQuery,
    }),
    [addRootView, setRootViewNativeStyle, updateRootView, removeRootView, rootViews, searchQuery, setSearchQuery]
  );

  return (
    <RootViewContext.Provider value={contextValue}>
      <>
        {children}
        {rootViews.map(
          ({id, style, component, useModal, onModalClose, centerDisplay}: DynamicViewBase): React.JSX.Element => {
            console.log('react-native-auto-positioned-popup RootViewProvider rootViews.map=', {id, style, component, useModal, centerDisplay});
            return !useModal ? (
              <View
                key={id}
                ref={(r) => {
                  if (r) viewRefs.current[id] = r;
                }}
                style={[style, {position: 'absolute'}]}
              >
                {component}
              </View>
            ) : (
              <Pressable
                key={id}
                style={[
                  {
                    flex: 1,
                    position: 'absolute',
                    width: '100%',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 99999999999,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  },
                  centerDisplay && {justifyContent: 'center', alignItems: 'center'},
                ]}
                onPress={() => {
                  console.log('react-native-auto-positioned-popup RootViewProvider Pressable onPress rootViews=', rootViews);
                  removeRootView(id, true);
                  onModalClose && onModalClose();
                }}
              >
                <View
                  ref={(r) => {
                    if (r) viewRefs.current[id] = r;
                  }}
                  style={[{position: 'absolute'}, style]}
                >
                  {component}
                </View>
              </Pressable>
            );
            // (<Modal
            //   animationType="none"
            //   transparent={false}
            //   visible={true}
            //   presentationStyle="overFullScreen" // iOS特定属性
            //   onRequestClose={() => {
            //     // Android 返回鍵按下時的回調
            //     onModalClose && onModalClose()
            //   }}
            //   key={id}
            // >
            // </Modal>)
          }
        )}
      </>
    </RootViewContext.Provider>
  );
};
/*
  const { addRootView, updateRootView, removeRootView ,searchQuery } = useRootView();
 */
export const useRootView = (): RootViewContextType => {
  const context = useContext(RootViewContext);
  if (!context) {
    throw new Error('useRootView must be used within a RootViewProvider');
  }
  return context;
};
