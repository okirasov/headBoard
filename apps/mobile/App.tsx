import { useEffect } from 'react';
import { AppState, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold } from '@expo-google-fonts/golos-text';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import * as SplashScreen from 'expo-splash-screen';
import { digestStats, phrases, todayLabel } from '@headboard/core';
import { useStore } from './src/store/useStore';
import { startSync, refreshSettings } from './src/store/sync';
import { devOrMockSignIn } from './src/lib/auth';
import { listenForNotificationTaps } from './src/lib/push';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useT } from './src/lib/useT';
import { useNow } from './src/lib/useNow';
import { Header } from './src/components/Header';
import { TabBar } from './src/components/TabBar';
import { Snack } from './src/components/Snack';
import { FilePreviewM } from './src/components/FilePreviewM';
import { SignInScreen } from './src/screens/SignInScreen';
import { BoardScreen } from './src/screens/BoardScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { DigestScreen } from './src/screens/DigestScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ArchiveScreen } from './src/screens/ArchiveScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { DueScreen } from './src/screens/DueScreen';
import { RecurringScreen } from './src/screens/RecurringScreen';
import { TagsScreen } from './src/screens/TagsScreen';
import { DueSheet } from './src/sheets/DueSheet';
import { TaskSheet } from './src/sheets/TaskSheet';
import { CaptureSheet } from './src/sheets/CaptureSheet';
import { SnoozeSheet } from './src/sheets/SnoozeSheet';
import { ProfileSheet } from './src/sheets/ProfileSheet';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

let devResetDone = false;

/** Dev convenience: EXPO_PUBLIC_DEV_AUTOLOGIN=1 signs in a mock user and seeds sample data on an empty board. */
function useDevAutologin() {
  const user = useStore(s => s.user);
  const tasks = useStore(s => s.tasks);
  useEffect(() => {
    if (!__DEV__ || process.env.EXPO_PUBLIC_DEV_AUTOLOGIN !== '1') return;
    // EXPO_PUBLIC_DEV_RESET=1 wipes persisted state once per launch so the run starts from the sign-in gate.
    if (process.env.EXPO_PUBLIC_DEV_RESET === '1' && !devResetDone) {
      devResetDone = true;
      useStore.persist.clearStorage();
      useStore.setState({ user: null, token: null, tasks: [], projects: [], projFiles: {}, digestText: null });
      return;
    }
    const st = useStore.getState();
    if (!user) { void devOrMockSignIn('Google'); return; }
    if (tasks.length === 0 && !st.token) import('./src/store/devSeed').then(({ buildSeed }) => { const s = buildSeed(); st.loadSeed(s.tasks, s.projects, s.projFiles); });
    // Optional screen/theme/lang presets for screenshot verification.
    const v = process.env.EXPO_PUBLIC_DEV_VIEW; if (v === 'board' || v === 'review' || v === 'digest' || v === 'calendar' || v === 'archive' || v === 'projects' || v === 'stats' || v === 'search' || v === 'due' || v === 'recurring' || v === 'tags') st.set({ mView: v, ...(v === 'search' ? { q: process.env.EXPO_PUBLIC_DEV_QUERY ?? '' } : {}) });
    const th = process.env.EXPO_PUBLIC_DEV_THEME; if (th === 'dark' || th === 'light') st.set({ theme: th });
    const lg = process.env.EXPO_PUBLIC_DEV_LANG; if (lg === 'ru' || lg === 'en') st.set({ lang: lg });
    const sheet = process.env.EXPO_PUBLIC_DEV_SHEET;
    if (tasks.length && sheet === 'task') st.set({ mSel: tasks.find(x => x.files.length && x.comments.length)?.id ?? tasks[0].id });
    if (sheet === 'profile') st.set({ mProfOpen: true });
    if (sheet === 'capture') st.set({ mCapOpen: true, capText: '- urgent: renew domain\n- ask Claude about embeddings #research' });
    if (tasks.length && sheet === 'snooze') st.set({ zTask: tasks[0].id });
  }, [user, tasks.length]);
}

function Root() {
  useDevAutologin();
  useEffect(() => { void startSync(); }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => { if (st === 'active') void refreshSettings(); });
    return () => sub.remove();
  }, []);
  useEffect(() => listenForNotificationTaps(), []);
  const { t, theme } = useTheme();
  const { T, lang } = useT();
  const now = useNow();
  const user = useStore(s => s.user);
  const mView = useStore(s => s.mView);
  const tasks = useStore(s => s.tasks);
  const stats = digestStats(tasks, now);
  const openN = tasks.filter(x => x.status !== 'done' && x.status !== 'archived').length;
  const titles = { board: T.board, review: T.resurface, digest: T.digTitle, calendar: T.calendar, archive: T.archiveTitle, projects: T.projectsTitle, stats: T.statsTitle, search: T.searchTitle, due: T.dueTitle, recurring: T.recurTitle, tags: T.tagsTitle };
  const subs = { board: phrases.openTasks(openN, lang), review: phrases.forgottenN(stats.staleN, lang), digest: todayLabel(now, lang), calendar: T.gcal, archive: phrases.archivedN(tasks.filter(x => x.status === 'archived').length, lang), projects: phrases.projectsN(useStore.getState().projects.length, lang), stats: T.statsSub, search: T.searchSub, due: T.dueSub, recurring: T.recurSub, tags: T.tagsSub };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {!user ? (
        <SignInScreen />
      ) : (
        <>
          <Header title={titles[mView]} sub={subs[mView]} />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 14, paddingBottom: 110 }}>
            {mView === 'board' && <BoardScreen now={now} />}
            {mView === 'review' && <ReviewScreen now={now} />}
            {mView === 'digest' && <DigestScreen now={now} />}
            {mView === 'calendar' && <CalendarScreen now={now} />}
            {mView === 'archive' && <ArchiveScreen now={now} />}
            {mView === 'projects' && <ProjectsScreen />}
            {mView === 'stats' && <StatsScreen now={now} />}
            {mView === 'search' && <SearchScreen now={now} />}
            {mView === 'due' && <DueScreen now={now} />}
            {mView === 'recurring' && <RecurringScreen now={now} />}
            {mView === 'tags' && <TagsScreen />}
          </ScrollView>
          <TabBar reviewBadge={stats.staleN} />
          <TaskSheet />
          <CaptureSheet />
          <SnoozeSheet />
          <DueSheet />
          <ProfileSheet />
          <FilePreviewM />
          <Snack />
        </>
      )}
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold, IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => undefined); }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
