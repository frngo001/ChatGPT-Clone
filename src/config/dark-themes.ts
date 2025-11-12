export interface DarkTheme {
  id: string
  name: string
  description?: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    border: string
    input: string
    ring: string
    chart1: string
    chart2: string
    chart3: string
    chart4: string
    chart5: string
    sidebar: string
    sidebarForeground: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarAccent: string
    sidebarAccentForeground: string
    sidebarBorder: string
    sidebarRing: string
  }
}

export const darkThemes: DarkTheme[] = [
  {
    id: 'default',
    name: 'Standard',
    description: 'Das Standard-Dark-Theme',
    colors: {
      background: 'oklch(0.145 0 0)',
      foreground: 'oklch(0.985 0 0)',
      card: 'oklch(0.205 0 0)',
      cardForeground: 'oklch(0.985 0 0)',
      popover: 'oklch(0.205 0 0)',
      popoverForeground: 'oklch(0.985 0 0)',
      primary: 'oklch(0.922 0 0)',
      primaryForeground: 'oklch(0.205 0 0)',
      secondary: 'oklch(0.269 0 0)',
      secondaryForeground: 'oklch(0.985 0 0)',
      muted: 'oklch(0.269 0 0)',
      mutedForeground: 'oklch(0.708 0 0)',
      accent: 'oklch(0.269 0 0)',
      accentForeground: 'oklch(0.985 0 0)',
      destructive: 'oklch(0.704 0.191 22.216)',
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: 'oklch(0.556 0 0)',
      chart1: 'oklch(0.488 0.243 264.376)',
      chart2: 'oklch(0.696 0.17 162.48)',
      chart3: 'oklch(0.769 0.188 70.08)',
      chart4: 'oklch(0.627 0.265 303.9)',
      chart5: 'oklch(0.645 0.246 16.439)',
      sidebar: 'oklch(0.205 0 0)',
      sidebarForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.488 0.243 264.376)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarAccent: 'oklch(0.269 0 0)',
      sidebarAccentForeground: 'oklch(0.985 0 0)',
      sidebarBorder: 'oklch(1 0 0 / 10%)',
      sidebarRing: 'oklch(0.556 0 0)',
    },
  },
  {
    id: 'blue',
    name: 'Blau',
    description: 'Dunkles Theme mit blauen Akzenten',
    colors: {
      background: 'oklch(0.129 0.042 264.695)',
      foreground: 'oklch(0.984 0.003 247.858)',
      card: 'oklch(0.14 0.04 259.21)',
      cardForeground: 'oklch(0.984 0.003 247.858)',
      popover: 'oklch(0.208 0.042 265.755)',
      popoverForeground: 'oklch(0.984 0.003 247.858)',
      primary: 'oklch(0.929 0.013 255.508)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 260.031)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 260.031)',
      mutedForeground: 'oklch(0.704 0.04 256.788)',
      accent: 'oklch(0.279 0.041 260.031)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      destructive: 'oklch(0.704 0.191 22.216)',
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: 'oklch(0.551 0.027 264.364)',
      chart1: 'oklch(0.488 0.243 264.376)',
      chart2: 'oklch(0.696 0.17 162.48)',
      chart3: 'oklch(0.769 0.188 70.08)',
      chart4: 'oklch(0.627 0.265 303.9)',
      chart5: 'oklch(0.645 0.246 16.439)',
      sidebar: 'oklch(0.14 0.04 259.21)',
      sidebarForeground: 'oklch(0.984 0.003 247.858)',
      sidebarPrimary: 'oklch(0.488 0.243 264.376)',
      sidebarPrimaryForeground: 'oklch(0.984 0.003 247.858)',
      sidebarAccent: 'oklch(0.279 0.041 260.031)',
      sidebarAccentForeground: 'oklch(0.984 0.003 247.858)',
      sidebarBorder: 'oklch(1 0 0 / 10%)',
      sidebarRing: 'oklch(0.551 0.027 264.364)',
    },
  },
  {
    id: 'slate',
    name: 'Schiefer',
    description: 'Dunkles Theme mit schiefergrauen Tönen',
    colors: {
      background: 'oklch(0.15 0.01 250)',
      foreground: 'oklch(0.98 0.01 250)',
      card: 'oklch(0.18 0.01 250)',
      cardForeground: 'oklch(0.98 0.01 250)',
      popover: 'oklch(0.20 0.01 250)',
      popoverForeground: 'oklch(0.98 0.01 250)',
      primary: 'oklch(0.92 0.01 250)',
      primaryForeground: 'oklch(0.15 0.01 250)',
      secondary: 'oklch(0.25 0.01 250)',
      secondaryForeground: 'oklch(0.98 0.01 250)',
      muted: 'oklch(0.25 0.01 250)',
      mutedForeground: 'oklch(0.70 0.01 250)',
      accent: 'oklch(0.25 0.01 250)',
      accentForeground: 'oklch(0.98 0.01 250)',
      destructive: 'oklch(0.704 0.191 22.216)',
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: 'oklch(0.55 0.01 250)',
      chart1: 'oklch(0.488 0.243 264.376)',
      chart2: 'oklch(0.696 0.17 162.48)',
      chart3: 'oklch(0.769 0.188 70.08)',
      chart4: 'oklch(0.627 0.265 303.9)',
      chart5: 'oklch(0.645 0.246 16.439)',
      sidebar: 'oklch(0.18 0.01 250)',
      sidebarForeground: 'oklch(0.98 0.01 250)',
      sidebarPrimary: 'oklch(0.488 0.243 264.376)',
      sidebarPrimaryForeground: 'oklch(0.98 0.01 250)',
      sidebarAccent: 'oklch(0.25 0.01 250)',
      sidebarAccentForeground: 'oklch(0.98 0.01 250)',
      sidebarBorder: 'oklch(1 0 0 / 10%)',
      sidebarRing: 'oklch(0.55 0.01 250)',
    },
  },
  {
    id: 'purple-dark',
    name: 'Lila Dunkel',
    description: 'Dunkles Theme mit lila/blauen Akzenten',
    colors: {
      background: 'oklch(0 0 0)',
      foreground: 'oklch(0.9328 0.0025 228.7857)',
      card: 'oklch(0.2097 0.0080 274.5332)',
      cardForeground: 'oklch(0.8853 0 0)',
      popover: 'oklch(0 0 0)',
      popoverForeground: 'oklch(0.9328 0.0025 228.7857)',
      primary: 'oklch(0.6692 0.1607 245.0110)',
      primaryForeground: 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.9622 0.0035 219.5331)',
      secondaryForeground: 'oklch(0.1884 0.0128 248.5103)',
      muted: 'oklch(0.2090 0 0)',
      mutedForeground: 'oklch(0.5637 0.0078 247.9662)',
      accent: 'oklch(0.1928 0.0331 242.5459)',
      accentForeground: 'oklch(0.6692 0.1607 245.0110)',
      destructive: 'oklch(0.6188 0.2376 25.7658)',
      border: 'oklch(0.2674 0.0047 248.0045)',
      input: 'oklch(0.3020 0.0288 244.8244)',
      ring: 'oklch(0.6818 0.1584 243.3540)',
      chart1: 'oklch(0.6723 0.1606 244.9955)',
      chart2: 'oklch(0.6907 0.1554 160.3454)',
      chart3: 'oklch(0.8214 0.1600 82.5337)',
      chart4: 'oklch(0.7064 0.1822 151.7125)',
      chart5: 'oklch(0.5919 0.2186 10.5826)',
      sidebar: 'oklch(0.2097 0.0080 274.5332)',
      sidebarForeground: 'oklch(0.8853 0 0)',
      sidebarPrimary: 'oklch(0.6818 0.1584 243.3540)',
      sidebarPrimaryForeground: 'oklch(1.0000 0 0)',
      sidebarAccent: 'oklch(0.1928 0.0331 242.5459)',
      sidebarAccentForeground: 'oklch(0.6692 0.1607 245.0110)',
      sidebarBorder: 'oklch(0.3795 0.0220 240.5943)',
      sidebarRing: 'oklch(0.6818 0.1584 243.3540)',
    },
  },
  {
    id: 'violet-dark',
    name: 'Violett Dunkel',
    description: 'Dunkles Theme mit violetten Akzenten',
    colors: {
      background: 'oklch(0.2223 0.0060 271.1393)',
      foreground: 'oklch(0.9551 0 0)',
      card: 'oklch(0.2568 0.0076 274.6528)',
      cardForeground: 'oklch(0.9551 0 0)',
      popover: 'oklch(0.2568 0.0076 274.6528)',
      popoverForeground: 'oklch(0.9551 0 0)',
      primary: 'oklch(0.6132 0.2294 291.7437)',
      primaryForeground: 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.2940 0.0130 272.9312)',
      secondaryForeground: 'oklch(0.9551 0 0)',
      muted: 'oklch(0.2940 0.0130 272.9312)',
      mutedForeground: 'oklch(0.7058 0 0)',
      accent: 'oklch(0.2795 0.0368 260.0310)',
      accentForeground: 'oklch(0.7857 0.1153 246.6596)',
      destructive: 'oklch(0.7106 0.1661 22.2162)',
      border: 'oklch(0.3289 0.0092 268.3843)',
      input: 'oklch(0.3289 0.0092 268.3843)',
      ring: 'oklch(0.6132 0.2294 291.7437)',
      chart1: 'oklch(0.8003 0.1821 151.7110)',
      chart2: 'oklch(0.6132 0.2294 291.7437)',
      chart3: 'oklch(0.8077 0.1035 19.5706)',
      chart4: 'oklch(0.6691 0.1569 260.1063)',
      chart5: 'oklch(0.7058 0 0)',
      sidebar: 'oklch(0.2011 0.0039 286.0396)',
      sidebarForeground: 'oklch(0.9551 0 0)',
      sidebarPrimary: 'oklch(0.6132 0.2294 291.7437)',
      sidebarPrimaryForeground: 'oklch(1.0000 0 0)',
      sidebarAccent: 'oklch(0.2940 0.0130 272.9312)',
      sidebarAccentForeground: 'oklch(0.6132 0.2294 291.7437)',
      sidebarBorder: 'oklch(0.3289 0.0092 268.3843)',
      sidebarRing: 'oklch(0.6132 0.2294 291.7437)',
    },
  },
]

export const getDarkThemeById = (id: string): DarkTheme | undefined => {
  return darkThemes.find((theme) => theme.id === id)
}

export const getDefaultDarkTheme = (): DarkTheme => {
  return darkThemes[0]
}

