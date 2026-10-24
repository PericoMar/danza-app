import React, { useState } from 'react';
import { AccessibilityInfo, Pressable, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ToastProvider, useToast, type ToastRequest } from '@/providers/ToastProvider';
import { TOAST_DEFAULT_DURATION_MS, ToastTone } from '@/constants/toast';

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const icon = ({ name }: any) => <Text>{name}</Text>;
  return new Proxy({}, { get: () => icon });
});

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// Longer than the exit animation, so a toast that has gone is really gone.
const AFTER_EXIT_MS = 500;

function renderWithToasts(children: React.ReactNode) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PaperProvider>
        <ToastProvider>{children}</ToastProvider>
      </PaperProvider>
    </SafeAreaProvider>,
  );
}

/** A button that shows a toast, then runs `after` (e.g. navigating away). */
function ShowButton({ label, toast, after }: { label: string; toast: ToastRequest; after?: () => void }) {
  const { showToast } = useToast();
  return (
    <Pressable
      onPress={() => {
        showToast(toast);
        after?.();
      }}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

const UNDO_TOAST: ToastRequest = {
  message: 'Removed from favorites',
  tone: ToastTone.INFO,
  action: { label: 'Undo', onPress: () => {} },
};

describe('ToastProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('keeps a toast on screen after the screen that showed it goes away', () => {
    // Login shows "Login successful." and is replaced by Companies straight
    // away, the way AuthNavigator does once the session lands.
    function App() {
      const [isOnLogin, setIsOnLogin] = useState(true);
      return isOnLogin ? (
        <ShowButton
          label="Log in"
          toast={{ message: 'Login successful.', tone: ToastTone.SUCCESS }}
          after={() => setIsOnLogin(false)}
        />
      ) : (
        <Text>Companies</Text>
      );
    }

    renderWithToasts(<App />);
    fireEvent.press(screen.getByText('Log in'));

    expect(screen.getByText('Companies')).toBeTruthy();
    expect(screen.getByText('Login successful.')).toBeTruthy();
  });

  it('goes away by itself once its time is up', () => {
    renderWithToasts(
      <ShowButton label="Save" toast={{ message: 'Saved.', tone: ToastTone.SUCCESS }} />,
    );
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('Saved.')).toBeTruthy();

    act(() => jest.advanceTimersByTime(TOAST_DEFAULT_DURATION_MS + AFTER_EXIT_MS));

    expect(screen.queryByText('Saved.')).toBeNull();
  });

  it('replaces the toast on screen, and the old one never closes the new one', () => {
    renderWithToasts(
      <>
        <ShowButton label="First" toast={{ message: 'First toast', tone: ToastTone.INFO }} />
        <ShowButton label="Second" toast={{ message: 'Second toast', tone: ToastTone.ERROR }} />
      </>,
    );

    fireEvent.press(screen.getByText('First'));
    act(() => jest.advanceTimersByTime(TOAST_DEFAULT_DURATION_MS - AFTER_EXIT_MS));
    fireEvent.press(screen.getByText('Second'));

    expect(screen.queryByText('First toast')).toBeNull();
    expect(screen.getByText('Second toast')).toBeTruthy();

    // Past the moment the first toast would have expired: the second one,
    // with its own clock, is still up.
    act(() => jest.advanceTimersByTime(AFTER_EXIT_MS * 2));
    expect(screen.getByText('Second toast')).toBeTruthy();
  });

  it('runs its action and goes away when the action is pressed', () => {
    const undo = jest.fn();
    renderWithToasts(
      <ShowButton
        label="Remove"
        toast={{
          message: 'Removed from favorites',
          tone: ToastTone.INFO,
          action: { label: 'Undo', onPress: undo },
        }}
      />,
    );
    fireEvent.press(screen.getByText('Remove'));

    fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    act(() => jest.advanceTimersByTime(AFTER_EXIT_MS));

    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Removed from favorites')).toBeNull();
  });

  it('runs its action only once, however fast it is pressed again', () => {
    const undo = jest.fn();
    renderWithToasts(<ShowButton label="Remove" toast={{ ...UNDO_TOAST, action: { label: 'Undo', onPress: undo } }} />);
    fireEvent.press(screen.getByText('Remove'));

    // The second press lands during the exit animation, while the button is still there.
    fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('is read out by a screen reader, and one with an action stays until it is used', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
    renderWithToasts(<ShowButton label="Remove" toast={UNDO_TOAST} />);
    fireEvent.press(screen.getByText('Remove'));
    await act(async () => {});

    expect(announce).toHaveBeenCalledWith('Removed from favorites. Undo is available.');
    act(() => jest.advanceTimersByTime(TOAST_DEFAULT_DURATION_MS * 10));
    expect(screen.getByText('Removed from favorites')).toBeTruthy();
  });
});
