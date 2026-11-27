const share = document.querySelector('.share');
const label = share.querySelector('.share-label');
const status = document.querySelector('#share-status');
let resetTimer;

if (navigator.clipboard?.writeText) {
  share.hidden = false;
  share.addEventListener('click', async () => {
    const url = new URL('/', location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      share.dataset.copied = '';
      label.textContent = 'Kopiert';
      status.textContent = 'Link wurde kopiert.';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        delete share.dataset.copied;
        label.textContent = 'Link kopieren';
        status.textContent = '';
      }, 2400);
    } catch {
      window.prompt('Link zum Kopieren', url);
    }
  });
}
