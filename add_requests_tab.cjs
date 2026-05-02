const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/Dashboard.tsx', 'utf8');

// Replace the pendingUsers length check in the trigger with pending items sum
const triggerTarget = `                <UserCheck className="h-3.5 w-3.5" />
                Solicitudes
                {pendingUsers.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{pendingUsers.length}</Badge>}
              </TabsTrigger>`;

const pendingNotifsCountCode = `  const pendingEducators = useMemo(() => notifications.filter((n: any) => n.type === "message" && n.data?.kind === "educator_permission_request" && !n.read_at), [notifications]);
  const totalPending = pendingUsers.length + pendingEducators.length;`;

// We inject pendingEducators in extraStats block or right before return
content = content.replace(
  '  return (\n    <div className="min-h-screen',
  `  const pendingEducators = useMemo(() => notifications.filter((n: any) => n.type === "message" && n.data?.kind === "educator_permission_request" && n.data?.status === "pending" && !n.read_at), [notifications]);\n  const totalPending = pendingUsers.length + pendingEducators.length;\n\n  return (\n    <div className="min-h-screen`
);

const triggerReplacement = `                <UserCheck className="h-3.5 w-3.5" />
                Solicitudes
                {totalPending > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{totalPending}</Badge>}
              </TabsTrigger>`;

content = content.replace(triggerTarget, triggerReplacement);

const newTabContent = `
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <UserCheck className="w-4 h-4" />
                  Solicitudes Pendientes ({totalPending})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Registros Pendientes */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Registros de Usuario ({pendingUsers.length})</h3>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {pendingUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay cuentas pendientes.</p>
                    ) : (
                      pendingUsers.map((user) => (
                        <div key={user.user_id} className="rounded-lg border bg-background/80 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{user.nombre_completo || user.email || user.user_id}</p>
                              <p className="text-xs text-muted-foreground">{user.email} · {user.account_status}</p>
                            </div>
                            <Badge variant="outline">{user.account_classification || "sin clasificación"}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.account_review_reason || "Sin motivo de revisión"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => handleReviewPendingUser(user.user_id, "activo")}>
                              Aprobar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReviewPendingUser(user.user_id, "rechazado", "Rechazado por administración") }>
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Educadores Pendientes */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Permisos de Educador ({pendingEducators.length})</h3>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {pendingEducators.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay solicitudes de educador.</p>
                    ) : (
                      pendingEducators.map((n: any) => {
                        const d = n.data || {};
                        const units = Array.isArray(d.requested_units) ? d.requested_units.join(", ") : "";
                        return (
                          <div key={n.id} className="rounded-lg border bg-background/80 p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{d.requester_name || "Educador/a"}</p>
                                <p className="text-xs text-muted-foreground">Unidades: {units}</p>
                              </div>
                              <Badge variant="secondary">Pendiente</Badge>
                            </div>
                            {d.note && (
                              <p className="text-xs text-muted-foreground italic">
                                "{d.note}"
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {/* Estos botones requeririan una funcion handleReviewEducator... para simplificar, usamos la UI existente en campana o agregamos funcion */}
                              <Button size="sm" onClick={async () => {
                                const { supabase } = require("@/integrations/supabase/client");
                                await supabase.rpc("review_educator_permission_request", {
                                  p_notification_id: n.id,
                                  p_requester_id: n.actor_id,
                                  p_approve: true,
                                  p_units: d.requested_units || [],
                                  p_note: "Aprobado por panel admin"
                                });
                                window.location.reload();
                              }}>
                                Aprobar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={async () => {
                                const { supabase } = require("@/integrations/supabase/client");
                                await supabase.rpc("review_educator_permission_request", {
                                  p_notification_id: n.id,
                                  p_requester_id: n.actor_id,
                                  p_approve: false,
                                  p_units: [],
                                  p_note: "Rechazado por panel admin"
                                });
                                window.location.reload();
                              }}>
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
`;

content = content.replace('          <TabsContent value="users">', newTabContent + '\\n          <TabsContent value="users">');

fs.writeFileSync('src/pages/admin/Dashboard.tsx', content, 'utf8');
console.log('Update Admin Dashboard done.');
