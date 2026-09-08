import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold } from '@expo-google-fonts/golos-text';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import * as SplashScreen from 'expo-splash-screen';
import { digestStats, phrases, todayLabel } from '@headboard/core';
import { useStore } from './src/store/useStore';
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
import { TaskSheet } from './src/sheets/TaskSheet';
import { CaptureSheet } from './src/sheets/CaptureSheet';
import { SnoozeSheet } from './src/sheets/SnoozeSheet';
import { ProfileSheet } from './src/sheets/ProfileSheet';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  const { t, theme } = useTheme();
  const { T, lang } = useT();
  const now = useNow();
  const user = useStore(s => s.user);
  const mView = useStore(s => s.mView);
  const tasks = useStore(s => s.tasks);
  const stats = digestStats(tasks, now);
  const openN = tasks.filter(x => x.status !== 'done' && x.status !== 'archived').length;
  const titles = { board: T.board, review: T.resurface, digest: T.digTitle, calendar: T.calendar };
  const subs = { board: phrases.openTasks(openN, lang), review: phrases.forgottenN(stats.staleN, lang), digest: todayLabel(now, lang), calendar: T.gcal };
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
          </ScrollView>
          <TabBar reviewBadge={stats.staleN} />
          <TaskSheet />
          <CaptureSheet />
          <SnoozeSheet />
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
