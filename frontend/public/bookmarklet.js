(function () {
  var text = window.getSelection ? window.getSelection().toString().trim() : '';
  if (!text) {
    alert('Select some text on the page first, then click the Veritas bookmarklet.');
    return;
  }
  var base = 'https://veritas.ai';
  try {
    if (document.currentScript && document.currentScript.src) {
      var origin = new URL(document.currentScript.src).origin;
      if (origin && origin !== 'null') base = origin;
    }
  } catch (e) {}
  var url = base + '/app?q=' + encodeURIComponent(text.slice(0, 8000));
  window.open(url, '_blank', 'noopener,noreferrer');
})();
