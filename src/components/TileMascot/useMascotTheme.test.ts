import { getAccessoryForTheme } from './useMascotTheme';

describe('getAccessoryForTheme seasonal windows', () => {
  it('shows the Halloween accessory Oct 15-31', () => {
    expect(getAccessoryForTheme('current', new Date(2026, 9, 15))).toBe('halloween');
    expect(getAccessoryForTheme('current', new Date(2026, 9, 31))).toBe('halloween');
  });

  it('does not show Halloween just before/after its window', () => {
    expect(getAccessoryForTheme('current', new Date(2026, 9, 14))).not.toBe('halloween');
    expect(getAccessoryForTheme('current', new Date(2026, 10, 1))).not.toBe('halloween');
  });

  it('shows the winter accessory for all of December', () => {
    expect(getAccessoryForTheme('current', new Date(2026, 11, 1))).toBe('winter');
    expect(getAccessoryForTheme('current', new Date(2026, 11, 31))).toBe('winter');
  });

  it('shows the valentine accessory Feb 7-14', () => {
    expect(getAccessoryForTheme('current', new Date(2026, 1, 7))).toBe('valentine');
    expect(getAccessoryForTheme('current', new Date(2026, 1, 14))).toBe('valentine');
  });

  it('does not show valentine just before/after its window', () => {
    expect(getAccessoryForTheme('current', new Date(2026, 1, 6))).not.toBe('valentine');
    expect(getAccessoryForTheme('current', new Date(2026, 1, 15))).not.toBe('valentine');
  });

  it('falls back to the theme accessory outside any seasonal window', () => {
    const midMarch = new Date(2026, 2, 15);
    expect(getAccessoryForTheme('desert', midMarch)).toBe('desert');
    expect(getAccessoryForTheme('ice', midMarch)).toBe('ice');
    expect(getAccessoryForTheme('candy', midMarch)).toBe('candy');
    expect(getAccessoryForTheme('current', midMarch)).toBeNull();
  });

  it('prioritizes a seasonal accessory over the theme accessory when both would apply', () => {
    // "ice" would normally render its own beanie -- Halloween should win.
    expect(getAccessoryForTheme('ice', new Date(2026, 9, 20))).toBe('halloween');
  });
});
