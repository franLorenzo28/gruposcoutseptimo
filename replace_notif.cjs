const fs = require('fs');

let content = fs.readFileSync('src/context/Notifications.tsx', 'utf8');

// 1. Update type AppNotification
content = content.replace(
  /\| "gallery_upload";/,
  '| "gallery_upload"\n    | "new_follower"\n    | "rama_broadcast";'
);

// 2. Clear persistNotification body
content = content.replace(
  /const persistNotification = useCallback\([\s\S]*?\[effectiveUserId\],\r?\n\s+\);/m,
  `const persistNotification = useCallback(
    async (args: any) => {
      // Obsoleto: la base de datos ahora se encarga mediante triggers
    },
    [],
  );`
);

// 3. Update realtime channel
const newChannelCode = `    // Realtime listeners (simplificado por DB triggers)
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: \`recipient_id=eq.\${user.id}\` },
      (payload: any) => {
        const row = payload.new;
        const notif: AppNotification = { id: row.id, type: normalizePersistentNotification(row).type, created_at: row.created_at, read: false, data: { ...(row.data || {}), _persistent: true } };
        if (!isNotificationEnabled(notif.type)) return;
        addNotification(notif);
        
        const d = notif.data;
        const kind = d.kind || notif.type;
        const actor = d.display || (d.username ? \`@\${d.username}\` : "Alguien");
        
        if (kind === "follow_request") {
          notifyViaPush("Nueva solicitud", \`\${actor} quiere seguirte\`);
        } else if (kind === "follow_accepted" || kind === "new_follower") {
          notifyViaPush("Nuevo seguidor", \`\${actor} ahora te sigue\`);
        } else if (kind === "message") {
          notifyViaPush("Nuevo mensaje", \`\${actor}: \${(d.content || "").slice(0, 70)}\`);
        } else if (kind === "rama_broadcast") {
          notifyViaPush(\`Difusión en \${d.rama || "unidad"}\`, \`\${actor}: \${(d.content || "").slice(0, 70)}\`);
        } else if (notif.type === "thread_comment") {
          notifyViaPush("Nuevo comentario en tu hilo", (d.content || "").slice(0, 80));
        } else if (notif.type === "mention") {
          notifyViaPush("Te mencionaron", \`\${actor} \${(d.content || "").slice(0, 70)}\`.trim());
        }
      }
    );

    channel.subscribe();`;

content = content.replace(
  /\/\/ 1\. Follows - INSERT[\s\S]*?channel\.subscribe\(\);/m,
  newChannelCode
);

// 4. Remove polling interval
content = content.replace(
  /void syncPendingFollowRequests\(user\.id\);\s+const timer = setInterval\(\(\) => \{\s+void syncPendingFollowRequests\(user\.id\);\s+\}, 15000\);\s+return \(\) => \{\s+clearInterval\(timer\);\s+\};/m,
  `void syncPendingFollowRequests(user.id);`
);

fs.writeFileSync('src/context/Notifications.tsx', content, 'utf8');
console.log('Modifications done.');
