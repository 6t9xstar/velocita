// Demo island: hydrated only when scrolled into view.
export default function counter(el, { start = 0 }) {
  let n = start;
  el.innerHTML = '<button type="button"></button>';
  const b = el.firstChild;
  const draw = () => { b.textContent = `Clicked ${n} times`; };
  b.onclick = () => { n++; draw(); };
  draw();
}
