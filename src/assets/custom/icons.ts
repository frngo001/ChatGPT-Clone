/**
 * ============================================================================
 * CUSTOM ICONS BARREL EXPORT
 * ============================================================================
 * 
 * @file icons.ts
 * @description 
 * Centralized export for all custom icon components.
 * Reduces initial bundle size by allowing tree-shaking when icons are
 * imported from this barrel export instead of individual files.
 * 
 * @author ChatGPT-Clone Team
 * @since 1.0.0
 */

// Layout Icons
export { IconDir } from './icon-dir'
export { IconLayoutCompact } from './icon-layout-compact'
export { IconLayoutDefault } from './icon-layout-default'
export { IconLayoutFull } from './icon-layout-full'

// Sidebar Icons
export { IconSidebarFloating } from './icon-sidebar-floating'
export { IconSidebarInset } from './icon-sidebar-inset'
export { IconSidebarSidebar } from './icon-sidebar-sidebar'

// Theme Icons
export { IconThemeDark } from './icon-theme-dark'
export { IconThemeLight } from './icon-theme-light'
export { IconThemeSystem } from './icon-theme-system'

