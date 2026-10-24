/** One entry per alternative; the /alts/ index page renders these cards. Status: wip | ready | keep | kill | merged. */
export interface Alt {
  id: string;
  name: string;
  kind: 'base' | 'model' | 'meta' | 'art' | 'design' | 'engine';
  line: string;
  status: 'wip' | 'ready' | 'keep' | 'kill' | 'merged';
}

export const ALTS: Alt[] = [
  { id: '00-base', name: 'Base game', kind: 'base', line: 'The current Counter Champ, for comparison.', status: 'ready' },
  { id: '01-dodge', name: 'Dodge & Counter', kind: 'model', line: 'Red punches can\'t be blocked: tap the other side to slip, then punish for double.', status: 'ready' },
  { id: '02-rhythm', name: 'Rhythm Fighter', kind: 'model', line: 'A beat plays; every punch lands on it. Counter on the beat, tempo rises per rival.', status: 'ready' },
];
