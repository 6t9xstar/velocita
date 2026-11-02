// Copy-to-clipboard button. Loaded on first hover/focus/touch of the install box.
export default function copy(el, { text }) {
  const button = el.querySelector('button');
  button.disabled = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied ✓';
    } catch {
      // Clipboard blocked (permissions, insecure context): select the command instead.
      const code = el.parentElement.querySelector('code');
      if (code) getSelection().selectAllChildren(code);
      button.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 1800);
  });
}
