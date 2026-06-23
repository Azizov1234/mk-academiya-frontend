if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

if (typeof global === 'object' && typeof global.self === 'undefined') {
  global.self = globalThis;
}
