/** Follow a signed Storage URL in the current tab so browsers do not block it as a popup. */
export function startFileDownload(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
