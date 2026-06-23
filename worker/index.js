var _ref = function (payload) {
  const response = payload && payload.response;

  if (response && response.type === "opaqueredirect") {
    return new Response(response.body, {
      status: 200,
      statusText: "OK",
      headers: response.headers,
    });
  }

  return response;
};

self._ref = _ref;

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const route =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.route === 'string'
      ? event.notification.data.route
      : '/notifications';

  const targetUrl = new URL(route, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (!client || !('focus' in client)) {
            continue;
          }

          return client.navigate(targetUrl).then(() => client.focus());
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});
