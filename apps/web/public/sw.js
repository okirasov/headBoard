/* Headboard service worker: shows pushes about forgotten tasks and opens Review on tap. */
self.addEventListener('push', event => {
  let data = { title: 'Headboard', body: '', url: '/?view=review', tag: 'stale' };
  try { data = { ...data, ...event.data.json() }; } catch (e) { if (event.data) data.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    tag: data.tag,
    renotify: true,
    data: { url: data.url },
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/?view=review', self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find(c => c.url.startsWith(self.location.origin));
    if (existing) { await existing.focus(); existing.navigate?.(url); return; }
    await self.clients.openWindow(url);
  })());
});
