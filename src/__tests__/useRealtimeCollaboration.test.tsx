import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeCollaboration } from '../hooks/useRealtimeCollaboration';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('useRealtimeCollaboration Hook', () => {
  const defaultProps = {
    roomId: 'test-room',
    userId: 'test-user',
    userName: 'Test User',
  };

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(defaultProps));

    expect(result.current.connected).toBe(false);
    expect(result.current.collaborators).toEqual([]);
  });

  test('should expose expected methods', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(defaultProps));

    expect(typeof result.current.sendCodeChange).toBe('function');
    expect(typeof result.current.sendCursorMove).toBe('function');
  });

  test('should call sendCodeChange when function is invoked', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(defaultProps));

    // Since socket is mocked, we're mainly testing that the function exists and can be called
    expect(() => {
      result.current.sendCodeChange('test code');
    }).not.toThrow();
  });

  test('should call sendCursorMove when function is invoked', () => {
    const { result } = renderHook(() => useRealtimeCollaboration(defaultProps));

    const position = { x: 100, y: 200 };
    expect(() => {
      result.current.sendCursorMove(position);
    }).not.toThrow();
  });
});