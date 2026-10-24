import { act, renderHook } from '@testing-library/react-native';
import { useToastLifecycle } from '@/hooks/useToastLifecycle';

const DURATION_MS = 3000;

describe('useToastLifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps the clock stopped until every reason to wait has gone', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useToastLifecycle({ duration: DURATION_MS, onClose }));

    // Keyboard on a button, then the pointer passes over and leaves.
    act(() => result.current.pause('focus'));
    act(() => result.current.pause('hover'));
    act(() => result.current.resume('hover'));
    act(() => jest.advanceTimersByTime(DURATION_MS * 2));
    expect(onClose).not.toHaveBeenCalled();

    act(() => result.current.resume('focus'));
    act(() => jest.advanceTimersByTime(DURATION_MS * 2));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
