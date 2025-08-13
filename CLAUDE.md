# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native library that provides an auto-positioned popup component with search functionality and flexible styling options. The component is designed for dropdowns, autocomplete inputs, and selection lists with automatic position adjustment based on available screen space.

## Development Commands

### Building and Development
- `npm run build` - Clean and compile TypeScript to lib/ directory
- `npm run watch` - Watch mode for development with automatic rebuilding
- `npm run dev` - Alias for watch mode
- `npm run clean` - Remove compiled lib/ directory

### Code Quality
- `npm run lint` - Run ESLint on TypeScript source files
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run type-check` - Run TypeScript type checking without emitting files

### Publishing and Release
- `npm run prepare` - Automatically builds before npm install (runs on install)
- `npm run prepublishOnly` - Build and lint before publishing
- `npm run pack-test` - Test package creation without publishing
- `npm run release:patch|minor|major` - Version bump and publish

## Code Architecture

### File Structure
- `src/` - Source TypeScript files
  - `AutoPositionedPopup.tsx` - Main component implementation with RootView integration
  - `AutoPositionedPopupProps.ts` - TypeScript interfaces and props definitions
  - `AutoPositionedPopup.style.ts` - Component styles using StyleSheet
  - `RootViewContext.tsx` - Context provider for dynamic view management
  - `index.ts` - Main entry point with exports
- `lib/` - Compiled JavaScript and declaration files (generated)

### Key Components Architecture
- **Main Component**: `AutoPositionedPopup` - Forwardable React component with imperative methods
- **ListItem**: Memoized component for individual list items with selection state
- **PopupList**: Memoized AdvancedFlatList wrapper for efficient rendering
- **RootViewProvider**: Context provider for dynamic popup view management
- **Theme System**: Default light theme with customizable colors

### Core Features Implementation
- **Auto-positioning**: Uses screen dimensions and component layout to determine optimal popup position
- **Search functionality**: Debounced search with 300ms delay, supports both local and remote filtering
- **Performance optimization**: Uses React.memo, useMemo, useCallback, and AdvancedFlatList for efficient rendering
- **Dynamic view management**: Uses RootViewContext for modal-like popup display without React Native Modal
- **TypeScript support**: Full type definitions with strict typing enabled

### Data Flow
- Data fetching through `fetchData` prop with pagination support
- Selected item state management through `selectedItem` and `onItemSelected` props
- Search query debouncing and filtering logic
- RootView-based popup display with automatic positioning
- Dynamic view management through RootViewContext for overlay display

### Styling System
- Uses React Native StyleSheet for performance
- Supports custom theming through color overrides
- Flexible styling props: `style`, `AutoPositionedPopupBtnStyle`, `inputStyle`, `labelStyle`, `popUpViewStyle`
- Default styles provide consistent cross-platform appearance

### TypeScript Configuration
- Target: ES2017 with DOM libraries
- Strict type checking enabled
- Declaration files generated for consumers
- Source maps included for debugging

## Code Standards

### ESLint Configuration
- Extends @react-native-community and @typescript-eslint/recommended
- Key rules enforced:
  - No shadow variables (TypeScript-specific)
  - Unused variables as warnings
  - React Native inline styles as warnings
  - React hooks exhaustive deps as warnings

### Component Patterns
- Use forwardRef for imperative methods (clearSelectedItem, showPopup, hidePopup)
- Memoize components and callbacks for performance
- Separate style definitions in .style.ts files
- Export types alongside components from index.ts

### Development Notes
- Library requires react-native-advanced-flatlist as dependency
- Peer dependencies: react >=16.8.0, react-native >=0.60.0
- Cross-platform compatible (iOS/Android)
- Uses AdvancedFlatList for enhanced list rendering performance
- Requires wrapping app with RootViewProvider for popup functionality
- Supports both controlled and uncontrolled usage patterns
- Supports forceRemoveAllRootViewOnItemSelected for clearing all popups
- Supports centerDisplay option for centered modal display