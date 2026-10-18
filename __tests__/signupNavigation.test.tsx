/**
 * Repro: on Android, tapping "Create account" leaves a white screen.
 *
 * Signing up returns a session, which changes `sessionKey` in the root layout
 * and remounts the whole tree below it (RoleProvider + AppShell + the root
 * <Stack>). AuthNavigator then has to move the user from /register to
 * /companies. This test drives exactly that sequence.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

// ---- supabase double: signUp emits SIGNED_IN before it resolves, the way
// supabase-js does, so the session lands while handleRegister is still awaiting.
type AuthListener = (event: string, session: any) => void;
const mockListeners: AuthListener[] = [];
let mockCurrentSession: any = null;

const mockEmitSession = (session: any) => {
  mockCurrentSession = session;
  mockListeners.forEach((l) => l('SIGNED_IN', session));
};

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: mockCurrentSession }, error: null })),
      onAuthStateChange: (cb: AuthListener) => {
        mockListeners.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signUp: jest.fn(async () => {
        const session = { user: { id: 'u1' }, access_token: 't' };
        mockEmitSession(session);
        return { data: { user: { id: 'u1' }, session }, error: null };
      }),
      exchangeCodeForSession: jest.fn(),
    },
    rpc: jest.fn(async () => ({ data: false, error: null })),
    from: jest.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    })),
    channel: jest.fn(() => ({ on: () => ({ subscribe: () => ({}) }) })),
    removeChannel: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const icon = ({ name }: any) => <Text>{name}</Text>;
  return new Proxy({}, { get: () => icon });
});

jest.mock('@/components/modals/NewsletterModal', () => () => null);
jest.mock('@/components/common/RouteSeo', () => () => null);

const RootLayout = require('@/app/_layout').default;
const RegisterScreen = require('@/app/register/index').default;

const screenStub = (label: string) => () => (
  <View>
    <Text>{label}</Text>
  </View>
);

beforeEach(() => {
  mockListeners.length = 0;
  mockCurrentSession = null;
});

const renderApp = (initialUrl: string) =>
  renderRouter(
    {
      _layout: RootLayout,
      index: screenStub('index'),
      register: RegisterScreen,
      login: screenStub('login'),
      companies: screenStub('companies'),
    },
    { initialUrl }
  );

it('lands on /companies after tapping "Create account"', async () => {
  renderApp('/register');

  await act(async () => {});
  expect(screen).toHavePathname('/register');

  fireEvent.changeText(screen.getByLabelText('Email address'), 'dancer@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'supersecret');
  fireEvent.changeText(screen.getByLabelText('Confirm password'), 'supersecret');
  fireEvent.press(screen.getByLabelText('Accept terms and conditions'));

  await act(async () => {
    fireEvent.press(screen.getByText('Create account'));
  });
  await act(async () => {});

  expect(screen).toHavePathname('/companies');
  expect(screen.getByText('companies')).toBeTruthy();
});


it('lands on /companies when /register sits on top of a real history', async () => {
  const { getRouterState } = renderApp('/companies');
  await act(async () => {});

  await act(async () => {
    require('expo-router').router.push('/login');
  });
  await act(async () => {
    require('expo-router').router.push('/register');
  });
  expect(screen).toHavePathname('/register');
  expect((getRouterState() as any).routes.length).toBe(3);

  fireEvent.changeText(screen.getByLabelText('Email address'), 'dancer@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'supersecret');
  fireEvent.changeText(screen.getByLabelText('Confirm password'), 'supersecret');
  fireEvent.press(screen.getByLabelText('Accept terms and conditions'));

  await act(async () => {
    fireEvent.press(screen.getByText('Create account'));
  });
  await act(async () => {});

  expect(screen).toHavePathname('/companies');
  expect(screen.getByText('companies')).toBeTruthy();
});
