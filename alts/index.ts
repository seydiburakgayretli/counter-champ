import { ALTS } from './list';

const grid = document.getElementById('grid');
for (const a of ALTS) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = `./${a.id}/`;
  const top = document.createElement('div');
  top.className = 'top';
  const kind = document.createElement('span');
  kind.textContent = `${a.id.slice(0, 2)} · ${a.kind}`;
  const status = document.createElement('span');
  status.className = `s-${a.status}`;
  status.textContent = a.status;
  top.append(kind, status);
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = a.name;
  const line = document.createElement('div');
  line.textContent = a.line;
  card.append(top, name, line);
  grid?.appendChild(card);
}
