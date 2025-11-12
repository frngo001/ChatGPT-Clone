import type { DarkTheme } from '@/config/dark-themes'

/**
 * Wende ein Dark-Theme dynamisch an, indem CSS-Variablen gesetzt werden
 */
export function applyDarkTheme(theme: DarkTheme) {
  const root = document.documentElement
  
  // Setze alle CSS-Variablen für das Dark-Theme
  root.style.setProperty('--background', theme.colors.background)
  root.style.setProperty('--foreground', theme.colors.foreground)
  root.style.setProperty('--card', theme.colors.card)
  root.style.setProperty('--card-foreground', theme.colors.cardForeground)
  root.style.setProperty('--popover', theme.colors.popover)
  root.style.setProperty('--popover-foreground', theme.colors.popoverForeground)
  root.style.setProperty('--primary', theme.colors.primary)
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground)
  root.style.setProperty('--secondary', theme.colors.secondary)
  root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground)
  root.style.setProperty('--muted', theme.colors.muted)
  root.style.setProperty('--muted-foreground', theme.colors.mutedForeground)
  root.style.setProperty('--accent', theme.colors.accent)
  root.style.setProperty('--accent-foreground', theme.colors.accentForeground)
  root.style.setProperty('--destructive', theme.colors.destructive)
  root.style.setProperty('--border', theme.colors.border)
  root.style.setProperty('--input', theme.colors.input)
  root.style.setProperty('--ring', theme.colors.ring)
  root.style.setProperty('--chart-1', theme.colors.chart1)
  root.style.setProperty('--chart-2', theme.colors.chart2)
  root.style.setProperty('--chart-3', theme.colors.chart3)
  root.style.setProperty('--chart-4', theme.colors.chart4)
  root.style.setProperty('--chart-5', theme.colors.chart5)
  root.style.setProperty('--sidebar', theme.colors.sidebar)
  root.style.setProperty('--sidebar-foreground', theme.colors.sidebarForeground)
  root.style.setProperty('--sidebar-primary', theme.colors.sidebarPrimary)
  root.style.setProperty('--sidebar-primary-foreground', theme.colors.sidebarPrimaryForeground)
  root.style.setProperty('--sidebar-accent', theme.colors.sidebarAccent)
  root.style.setProperty('--sidebar-accent-foreground', theme.colors.sidebarAccentForeground)
  root.style.setProperty('--sidebar-border', theme.colors.sidebarBorder)
  root.style.setProperty('--sidebar-ring', theme.colors.sidebarRing)
}

/**
 * Setze das Dark-Theme zurück auf die Standardwerte aus theme.css
 */
export function resetDarkTheme() {
  const root = document.documentElement
  
  // Entferne alle gesetzten CSS-Variablen, damit die Standardwerte aus theme.css verwendet werden
  const cssVariables = [
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--border',
    '--input',
    '--ring',
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-border',
    '--sidebar-ring',
  ]
  
  cssVariables.forEach((variable) => {
    root.style.removeProperty(variable)
  })
}

