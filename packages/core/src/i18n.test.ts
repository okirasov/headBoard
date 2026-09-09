import { EN, RU, dict, priorityLabel, statusLabel, phrases } from './i18n';

describe('i18n', () => {
  it('EN and RU have identical key sets', () => {
    expect(Object.keys(RU).sort()).toEqual(Object.keys(EN).sort());
  });
  it('array keys have equal lengths', () => {
    for (const k of ['DOW', 'DOWS', 'MON', 'MONF', 'prShort', 'prFull'] as const) {
      expect(RU[k].length).toBe(EN[k].length);
    }
  });
  it('dict resolves by lang', () => {
    expect(dict('ru').board).toBe('Доска');
    expect(dict('en').resurface).toBe('Review');
  });
  it('labels', () => {
    expect(priorityLabel(0, 'en')).toBe('High');
    expect(priorityLabel(2, 'ru', false)).toBe('НИЗ');
    expect(statusLabel('waiting', 'en', true)).toBe('Waiting on');
    expect(phrases.addN(1, 'en')).toBe('Add 1 task');
    expect(phrases.addN(3, 'ru')).toBe('Добавить (3)');
  });
});
