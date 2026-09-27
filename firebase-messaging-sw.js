/* Bunny's Planner - background push handler.
   Must be served from the SAME origin/folder as index.html, at this exact path:
   https://yourdomain.com/firebase-messaging-sw.js
   (it cannot live in a subfolder - browsers only look at the root for scope reasons
   unless you explicitly widen scope at registration time, which index.html does not do) */
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAUT_k7_uBgG2w7XilarQmcYRW952IPsKw",
  authDomain: "bunnybuddy-6622c.firebaseapp.com",
  projectId: "bunnybuddy-6622c",
  storageBucket: "bunnybuddy-6622c.firebasestorage.app",
  messagingSenderId: "826013636032",
  appId: "1:826013636032:web:2ff1b7dd82a8754dcf2425"
});

var messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || "Bunny's Planner";
  var body = (payload.notification && payload.notification.body) || "Time to check in.";
  self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "bunny-reminder"
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow("/index.html");
    })
  );
});
