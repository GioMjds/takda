import React from 'react';
import { PositionCard } from '@/views/[lang]/b/[businessSlug]/sections/_PositionCard';
import { useQueuePosition } from '@/views/[lang]/b/[businessSlug]/hooks/_useQueuePosition';

jest.mock('@/views/[lang]/b/[businessSlug]/hooks/_useQueuePosition');

describe('PositionCard component unit tests', () => {
  const mockTapToRejoin = jest.fn();

  const defaultProps = {
    bookingId: 'b_123',
    businessId: 'biz_456',
    businessName: "Pedro's Barbershop",
    businessAddress: '123 Palengke St, Manila',
    initialPosition: {
      bookingId: 'b_123',
      position: 3,
      peopleAhead: 2,
      estimatedWaitMin: 30,
      slotStart: '2026-07-20T09:00:00.000Z',
      status: 'CONFIRMED' as const,
      priorityTier: 'STANDARD' as const,
    },
    queueToken: 'test_token_123',
    queueTokenExpiresAt: '2026-07-21T09:00:00.000Z',
    refreshPhone: '+639171234567',
    dict: {
      positionCard: {
        yourSlot: 'Your Slot',
        yourNumber: 'Your Queue Number',
        estimatedWait: 'Estimated Wait',
        peopleAhead: '{count} people ahead of you',
        youAreNext: "You're next!",
        reconnecting: 'Reconnecting...',
        expired: 'Session expired',
        tapToRejoin: 'Tap to rejoin queue',
        terminalState: 'Your booking is no longer active',
      },
    },
  };

  function stringifyTree(node: any): string {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(stringifyTree).join(' ');
    if (node.props && node.props.children) {
      return stringifyTree(node.props.children);
    }
    return '';
  }

  function findElements(node: any, predicate: (el: any) => boolean, results: any[] = []): any[] {
    if (!node || typeof node !== 'object') return results;
    if (predicate(node)) results.push(node);
    if (Array.isArray(node)) {
      node.forEach((child) => findElements(child, predicate, results));
    } else if (node.props && node.props.children) {
      findElements(node.props.children, predicate, results);
    }
    return results;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueuePosition as jest.Mock).mockReturnValue({
      position: defaultProps.initialPosition,
      totalActive: 10,
      status: 'live',
      onTapToRejoin: mockTapToRejoin,
    });
  });

  it('invokes useQueuePosition with correct parameters and renders initial position', () => {
    const el = PositionCard(defaultProps);
    const text = stringifyTree(el);

    expect(useQueuePosition).toHaveBeenCalledWith({
      bookingId: 'b_123',
      businessId: 'biz_456',
      initialToken: 'test_token_123',
      initialPosition: defaultProps.initialPosition,
      refreshPhone: '+639171234567',
    });

    expect(text).toContain("Pedro's Barbershop");
    expect(text).toContain('#3');
    expect(text).toContain('2 people ahead of you');
    expect(text).toContain('~30 min');
    expect(text).toContain('10 total active bookings today');
  });

  it('renders "You\'re next!" when peopleAhead is 0', () => {
    (useQueuePosition as jest.Mock).mockReturnValue({
      position: {
        ...defaultProps.initialPosition,
        position: 1,
        peopleAhead: 0,
        estimatedWaitMin: 0,
      },
      totalActive: 5,
      status: 'live',
      onTapToRejoin: mockTapToRejoin,
    });

    const el = PositionCard(defaultProps);
    const text = stringifyTree(el);

    expect(text).toContain('#1');
    expect(text).toContain("You're next!");
  });

  it('renders live queue position updates', () => {
    (useQueuePosition as jest.Mock).mockReturnValue({
      position: {
        ...defaultProps.initialPosition,
        position: 2,
        peopleAhead: 1,
        estimatedWaitMin: 15,
      },
      totalActive: 8,
      status: 'live',
      onTapToRejoin: mockTapToRejoin,
    });

    const el = PositionCard(defaultProps);
    const text = stringifyTree(el);

    expect(text).toContain('#2');
    expect(text).toContain('1 people ahead of you');
    expect(text).toContain('~15 min');
    expect(text).toContain('8 total active bookings today');
  });

  it('renders reconnecting pill when status is reconnecting', () => {
    (useQueuePosition as jest.Mock).mockReturnValue({
      position: defaultProps.initialPosition,
      totalActive: 10,
      status: 'reconnecting',
      onTapToRejoin: mockTapToRejoin,
    });

    const el = PositionCard(defaultProps);
    const text = stringifyTree(el);

    expect(text).toContain('Reconnecting...');
  });

  it('renders tap to rejoin button when status is expired and handles click', () => {
    (useQueuePosition as jest.Mock).mockReturnValue({
      position: defaultProps.initialPosition,
      totalActive: 10,
      status: 'expired',
      onTapToRejoin: mockTapToRejoin,
    });

    const el = PositionCard(defaultProps);
    const text = stringifyTree(el);

    expect(text).toContain('Tap to rejoin queue');

    const buttonEls = findElements(el, (node) => node.type === 'button');
    expect(buttonEls.length).toBeGreaterThan(0);
    buttonEls[0].props.onClick();
    expect(mockTapToRejoin).toHaveBeenCalledTimes(1);
  });
});
