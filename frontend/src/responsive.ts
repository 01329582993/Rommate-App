import { useWindowDimensions } from 'react-native';

/** Screen-size helpers so one layout adapts from small phones to tablets / web. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWide = width >= 1024;
  const gutter = isTablet ? 28 : 20;
  const contentWidth = Math.min(width, isWide ? 1040 : 720);
  return { width, height, isTablet, isWide, gutter, contentWidth, isSmall: width < 360 };
}
