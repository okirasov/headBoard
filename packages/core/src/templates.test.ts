import { newTask } from './model';
import { newTemplate, templatePlaceholders, fillPlaceholders, applyTemplate, templateFromTask } from './templates';

const now = new Date(2026, 8, 9, 12).getTime();

describe('templates', () => {
  it('newTemplate defaults and normalizes', () => {
    const t = newTemplate({ name: '  Call prep ', tags: ['#Sales', 'sales'] }, 5);
    expect(t).toMatchObject({ name: 'Call prep', title: 'Call prep', pr: 1, tags: ['sales'], dueInDays: null, usedCount: 0 });
    expect(t.id.startsWith('t5')).toBe(true);
  });
  it('placeholders are collected and filled, unknown ones stay', () => {
    const t = newTemplate({ name: 'x', title: 'Prep call with {client}', note: 'Agenda for {client} on {topic}' });
    expect(templatePlaceholders(t)).toEqual(['client', 'topic']);
    expect(fillPlaceholders(t.title, { client: 'Acme' })).toBe('Prep call with Acme');
    expect(fillPlaceholders(t.note, { client: 'Acme' })).toBe('Agenda for Acme on {topic}');
  });
  it('applyTemplate builds a task with relative due and reminder', () => {
    const t = newTemplate({ name: 'Release retro', title: 'Retro after {release}', proj: 'p2', pr: 0, tags: ['ops'], note: '- what went well', dueInDays: 3, remindDays: 1 });
    const task = applyTemplate(t, { release: 'v2' }, now);
    expect(task).toMatchObject({ title: 'Retro after v2', proj: 'p2', pr: 0, tags: ['ops'], status: 'inbox', remindDays: 1 });
    expect(new Date(task.due!).getDate()).toBe(12);
    expect(new Date(task.due!).getHours()).toBe(12);
    const undated = applyTemplate(newTemplate({ name: 'n', remindDays: 0 }), {}, now);
    expect(undated.due).toBeNull();
    expect(undated.remindDays).toBeNull();
  });
  it('templateFromTask copies the task fields', () => {
    const task = newTask({ title: 'Onboard contractor', proj: 'p4', pr: 1, tags: ['hr'], note: 'checklist', remindDays: 0 }, now);
    const t = templateFromTask(task);
    expect(t).toMatchObject({ name: 'Onboard contractor', title: 'Onboard contractor', proj: 'p4', tags: ['hr'], note: 'checklist', remindDays: 0, dueInDays: null });
  });
});
