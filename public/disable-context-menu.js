// Disables the browser's right-click context menu site-wide. Shared across
// every static page (index.html, about.html, faq.html, etc.) plus the React
// app that mounts into index.html's #root, since none of those pages share
// a build step or common include -- one script tag per page, one script
// file, instead of duplicating this logic in each page's own inline script.
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});
