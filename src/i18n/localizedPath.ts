export function localizePath(locale: string, path: string): string {
  void locale;
  return path.startsWith('/') ? path : `/${path}`;
}
