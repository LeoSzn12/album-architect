import type { ChallengeTheme } from '../types/draft.ts';

export interface DailyThemeInfo {
  theme: ChallengeTheme;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  accentColor: string;
  dayOfWeek?: number;
}

const DAILY_THEMES: Record<number, DailyThemeInfo> = {
  0: {
    dayOfWeek: 0,
    theme: 'era-2010s',
    title: 'Sunday Soul & Introspective Cuts',
    subtitle: 'Sunday Drop',
    description: 'Curate a contemplative, late-night deep cut masterclass from the 2010s.',
    iconName: 'Moon',
    accentColor: 'from-indigo-500 to-purple-600',
  },
  1: {
    dayOfWeek: 1,
    theme: 'era-2010s',
    title: '2010s Nostalgia Blueprint',
    subtitle: 'Monday Drop',
    description: 'The golden streaming decade. Modern classics, stadium hooks, and moody 808s.',
    iconName: 'Sparkles',
    accentColor: 'from-cyan-500 to-blue-600',
  },
  2: {
    dayOfWeek: 2,
    theme: 'genre-rnb',
    title: 'Late Night R&B Lounge',
    subtitle: 'Tuesday Drop',
    description: 'Velvety falsettos, toxic confessions, and 2 AM atmospheric soundscapes.',
    iconName: 'Heart',
    accentColor: 'from-pink-500 to-rose-600',
  },
  3: {
    dayOfWeek: 3,
    theme: 'era-2020s',
    title: 'Modern Trap & Rage Gauntlet',
    subtitle: 'Wednesday Drop',
    description: 'Heavyweight distorted 808s, high-octane rage drops, and future rap titans.',
    iconName: 'Zap',
    accentColor: 'from-amber-500 to-red-600',
  },
  4: {
    dayOfWeek: 4,
    theme: 'year-2016',
    title: 'Class of 2016 Time Capsule',
    subtitle: 'Thursday Drop',
    description: 'Blonde, Pablo, Views, Birds. Draft strictly from hip-hop’s greatest year.',
    iconName: 'Trophy',
    accentColor: 'from-yellow-400 to-amber-600',
  },
  5: {
    dayOfWeek: 5,
    theme: 'era-2000s',
    title: '2000s Bling Era Flashback',
    subtitle: 'Friday Drop',
    description: 'Oversized tees, Neptunes bounce, Timbaland beats, and timeless hook anthems.',
    iconName: 'Flame',
    accentColor: 'from-orange-500 to-pink-600',
  },
  6: {
    dayOfWeek: 6,
    theme: 'genre-hiphop',
    title: 'Hip-Hop Dynasty Showcase',
    subtitle: 'Saturday Drop',
    description: 'Sample chops, lyrical masterclasses, and untouchable heavyweight verses.',
    iconName: 'Crown',
    accentColor: 'from-purple-500 to-indigo-600',
  },
};

/**
 * Formats a given or current date into the universal Daily Drop seed string: DAILY-YYYY-MM-DD.
 */
export function getDailySeed(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `DAILY-${y}-${m}-${d}`;
}

/**
 * Returns the curated challenge theme and narrative metadata for a specific date.
 */
export function getDailyTheme(date: Date = new Date()): DailyThemeInfo {
  const day = date.getDay();
  const theme = DAILY_THEMES[day] ?? DAILY_THEMES[1];
  return { ...theme, dayOfWeek: day };
}

/**
 * Calculates updated streak when a player completes the daily drop.
 */
export function calculateDailyStreak(
  lastDailyCompletedDate: string | null,
  currentStreak: number,
  todaySeed: string = getDailySeed()
): { newStreak: number; wasAlreadyCompleted: boolean; streakBroken: boolean } {
  if (lastDailyCompletedDate === todaySeed) {
    return { newStreak: currentStreak, wasAlreadyCompleted: true, streakBroken: false };
  }

  if (!lastDailyCompletedDate) {
    return { newStreak: 1, wasAlreadyCompleted: false, streakBroken: false };
  }

  // Parse dates to check if yesterday
  try {
    const lastDateStr = lastDailyCompletedDate.replace('DAILY-', '');
    const todayDateStr = todaySeed.replace('DAILY-', '');
    const lastDate = new Date(lastDateStr);
    const todayDate = new Date(todayDateStr);

    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return { newStreak: currentStreak + 1, wasAlreadyCompleted: false, streakBroken: false };
    } else if (diffDays === 0) {
      return { newStreak: currentStreak, wasAlreadyCompleted: true, streakBroken: false };
    } else {
      // Missed a day
      return { newStreak: 1, wasAlreadyCompleted: false, streakBroken: true };
    }
  } catch {
    return { newStreak: 1, wasAlreadyCompleted: false, streakBroken: true };
  }
}
