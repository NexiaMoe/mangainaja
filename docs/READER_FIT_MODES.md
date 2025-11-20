# Reader Fit Modes

## Overview

The manga reader supports two image scaling modes that control how manga pages are displayed within the viewport.

## Fit Modes

### Fit to Screen (Default)
- **Icon**: Maximize2 (expand icon)
- **Behavior**: Contains the entire image within the viewport while maintaining aspect ratio
- **Best for**: 
  - Reading on smaller screens
  - Pages with varying aspect ratios
  - When you want to see the full page without scrolling
- **CSS**: Uses `object-contain` with `max-w-[100vw] max-h-[100vh]`

### Fit to Width
- **Icon**: Minimize2 (compress icon)
- **Behavior**: Stretches image to full screen width, allowing vertical scrolling for tall pages
- **Best for**: 
  - Reading on desktop/large screens
  - Long vertical pages (webtoon style)
  - When you want maximum detail
- **CSS**: Uses `w-screen` with `overflow-y-auto` on the container

## User Interface

### Quick Toggle Button
- Located in the top toolbar, between the chapter title and settings icon
- Shows **Maximize2** icon when in "Fit to Screen" mode (clicking switches to Fit to Width)
- Shows **Minimize2** icon when in "Fit to Width" mode (clicking switches to Fit to Screen)
- Includes tooltip and aria-label for accessibility

### Settings Panel
- Found in Reader Settings sheet under "Image Fit"
- Dropdown selector with two options:
  - "Fit to Screen"
  - "Fit to Width"
- Includes helper text explaining each mode
- Changes take effect immediately without closing the settings panel

## Persistence

The selected fit mode is:
- Persisted to localStorage via Zustand
- Maintained across browser sessions
- Applied to all chapters and manga
- Included in the reader settings backup/restore flow

## Technical Implementation

### Store
```typescript
// stores/reader-store.ts
export type FitMode = 'screen' | 'width';

interface ReaderStore {
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
}
```

### Image Styling
The reader applies conditional classes based on `fitMode`:

```typescript
// Fit to Screen
fitMode === 'screen' ? [
  "w-full h-full object-contain",
  "max-w-[100vw] max-h-[100vh] mx-auto"
]

// Fit to Width
: [
  "w-screen object-top",
  "max-h-none"
]
```

### Container Styling
The main container adapts its layout:

```typescript
fitMode === 'screen' 
  ? "flex items-center justify-center"  // Center content
  : "overflow-y-auto overflow-x-hidden"  // Enable scrolling
```

## Compatibility

- ✅ Works with RTL (Right-to-Left) reading direction
- ✅ Compatible with all page transition modes (slide, fade, none)
- ✅ Maintains image preloading functionality
- ✅ Supports keyboard navigation
- ✅ Touch-friendly on mobile devices
- ✅ Accessible via keyboard (Tab to focus, Enter/Space to toggle)

## Testing

To test the fit modes feature:

1. Open any manga chapter in the reader
2. Click the fit mode toggle button in the top toolbar
3. Verify the image scaling changes immediately
4. Test with different page sizes (tall, wide, square)
5. Verify persistence by closing and reopening the reader
6. Test accessibility using keyboard navigation
7. Test on different screen sizes and orientations

## Future Enhancements

Possible improvements for future iterations:
- Add "Fit to Height" mode for ultra-wide displays
- Smart fit mode that auto-detects optimal scaling per page
- Custom zoom levels with pinch-to-zoom support
- Page-by-page fit mode overrides
