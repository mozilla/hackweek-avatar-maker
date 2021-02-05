export function dispatch(eventName, detail) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
}
