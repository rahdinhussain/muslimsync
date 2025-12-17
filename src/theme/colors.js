export const lightColors = {
  background: '#ffffff',
  surface: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#000000',
  primaryDark: '#000000',
  primaryLight: '#000000',
  header: '#ffffff',
  card: '#ffffff',
  cardSecondary: '#f5f5f5', // For secondary card backgrounds
  border: 'transparent',
  borderVisible: '#e0e0e0', // For visible borders when needed
  icon: '#000000',
  iconBackground: '#f5f5f5', // For icon containers
  white: '#ffffff',
  black: '#000000',
  shadow: '#000000', // Shadow color for light mode
};

export const darkColors = {
  background: '#0d0d0d', // ~5% brighter than pure black
  surface: '#0d0d0d', // ~5% brighter than pure black
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  primary: '#ffffff',
  primaryDark: '#ffffff',
  primaryLight: '#ffffff',
  header: '#0d0d0d', // ~5% brighter than pure black
  card: '#262626', // ~15% brighter than background (15% of 255 = ~38)
  cardSecondary: '#262626', // Same as card for consistency
  border: 'transparent',
  borderVisible: '#333333', // For visible borders when needed
  icon: '#ffffff',
  iconBackground: '#262626', // For icon containers (matching card color)
  white: '#ffffff',
  black: '#000000',
  shadow: '#ffffff', // Shadow color for dark mode (light shadow on dark background)
};

export const getColors = (isDark) => (isDark ? darkColors : lightColors);

