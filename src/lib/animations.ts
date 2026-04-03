export const ANIMATIONS = {
  FADE_IN: 'animate-fade-in',
  SLIDE_UP: 'animate-slide-up',
  SCALE_IN: 'animate-scale-in',
  BOUNCE: 'animate-bounce',
  PULSE: 'animate-pulse',
  SPIN: 'animate-spin',
} as const

export const TRANSITION_DURATIONS = {
  FAST: 'duration-150',
  NORMAL: 'duration-300',
  SLOW: 'duration-500',
} as const

export const EASING = {
  DEFAULT: 'ease-in-out',
  EASE_OUT: 'ease-out',
  EASE_IN: 'ease-in',
  LINEAR: 'linear',
} as const
