import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { isLocalBackend } from '@/lib/backend';
import { supabase } from '@/integrations/supabase/client';
import { followUser } from '@/lib/follows';

type NotificationRow = {
  id: string;
  type: string;
  entity_type: string | null;
  created_at: string;
};

type ProfileCandidate = {
  user_id: string;
  nombre_completo: string | null;
  is_public: boolean;
};

type FollowAttemptResult = Awaited<ReturnType<typeof followUser>>;

export default function TestDiagnostic() {
  const { user } = useUser();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const addPreventiveHint = (message: string) => {
    const text = String(message || '').toLowerCase();
    if (text.includes('permission denied for table users')) {
      addLog('Sugerencia preventiva: hay una política RLS que depende de users. Evita usar esa consulta para verificar este flujo.');
    } else if (text.includes('duplicate key')) {
      addLog('Sugerencia preventiva: relación ya existente; se salta candidato y se intenta otro automáticamente.');
    } else if (text.includes('no puedes seguirte a ti mismo')) {
      addLog('Sugerencia preventiva: se excluye siempre el usuario autenticado de candidatos.');
    }
  };

  const testFollowNotification = async () => {
    try {
      setIsRunning(true);
      addLog('Starting follow notification test...');

      if (!user?.id) {
        addLog('ERROR: User not authenticated');
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      const currentUserId = authUser?.id || user.id;

      // Get a list of users to follow
      addLog('Fetching users list...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo, is_public')
        .neq('user_id', currentUserId)
        .limit(100);

      if (profilesError) {
        addLog(`ERROR fetching profiles: ${profilesError.message}`);
        addPreventiveHint(profilesError.message);
        return;
      }

      if (!profiles || profiles.length === 0) {
        addLog('No other users found to test');
        return;
      }

      const candidates = [...(profiles as ProfileCandidate[])]
        .filter((candidate) => candidate.user_id !== currentUserId)
        .sort(() => Math.random() - 0.5);

      if (candidates.length === 0) {
        addLog('No hay candidatos válidos después de excluir al usuario actual.');
        return;
      }

      addLog(`Candidates available: ${candidates.length}`);

      let targetUser: ProfileCandidate | null = null;
      let selectedFollowResult: FollowAttemptResult | null = null;
      let notificationsBeforeCount = 0;

      for (const candidate of candidates) {
        if (candidate.user_id === currentUserId) {
          continue;
        }

        addLog(`Trying candidate: ${candidate.nombre_completo || candidate.user_id}`);

        const { data: beforeRows, error: beforeRowsError } = await supabase
          .from('notifications')
          .select('id, type, created_at')
          .eq('recipient_id', candidate.user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (beforeRowsError) {
          addLog(`Warning reading notifications BEFORE: ${beforeRowsError.message}`);
          addPreventiveHint(beforeRowsError.message);
        }

        const beforeCount = beforeRows?.length || 0;
        const followResult = await followUser(candidate.user_id);
        const followError = followResult.error;

        if (!followError) {
          targetUser = candidate;
          selectedFollowResult = followResult;
          notificationsBeforeCount = beforeCount;
          addLog(`Selected target: ${candidate.nombre_completo || candidate.user_id}`);
          addLog(`Target profile is_public: ${candidate.is_public}`);
          addLog(`Notifications for target BEFORE: ${notificationsBeforeCount}`);
          break;
        }

        const message = followError.message.toLowerCase();
        const isExistingRelationError =
          message.includes('ya tienes una solicitud pendiente') ||
          message.includes('ya sigues a este usuario') ||
          message.includes('duplicate key');

        if (isExistingRelationError) {
          addLog(`Skipping candidate (existing relation): ${followError.message}`);
          continue;
        }

        addLog(`ERROR creating follow: ${followError.message}`);
        addPreventiveHint(followError.message);
        return;
      }

      if (!targetUser) {
        addLog('ERROR: No se encontró un usuario disponible para crear un follow nuevo.');
        addLog('Sugerencia: usa otra cuenta de prueba o deja de seguir al menos un usuario para re-ejecutar esta prueba.');
        return;
      }

      addLog('Follow created successfully');

      // Wait a bit for database processing
      addLog('Waiting for notification processing...');
      await new Promise(r => setTimeout(r, 1000));

      // Check notifications AFTER (generic latest view)
      const { data: notificationsAfter, error: notificationsAfterError } = await supabase
        .from('notifications')
        .select('id, type, entity_type, created_at')
        .eq('recipient_id', targetUser.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsAfterError) {
        addLog(`Warning reading notifications AFTER: ${notificationsAfterError.message}`);
        addPreventiveHint(notificationsAfterError.message);
      } else {
        addLog(`Notifications for target AFTER: ${notificationsAfter?.length || 0}`);
        if (notificationsAfter && notificationsAfter.length > 0) {
          (notificationsAfter as NotificationRow[]).forEach((n) => {
            addLog(`  - Type: ${n.type}, Entity: ${n.entity_type}, Created: ${new Date(n.created_at).toLocaleTimeString()}`);
          });
        }
      }

      if (selectedFollowResult?.notificationPersisted === true) {
        addLog('Notification persistence report: OK');
      } else if (selectedFollowResult?.notificationPersisted === false) {
        addLog(`Warning: no se pudo confirmar persistencia de notificación en el flujo de follow (${selectedFollowResult.notificationErrorMessage || 'sin detalle'}).`);
        addPreventiveHint(selectedFollowResult.notificationErrorMessage || '');
        addLog('Sugerencia preventiva: revisar políticas RLS de notifications/create_notification para permitir inserción al crear follow.');
      }

      addLog('✓ Follow notification test complete');
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testEducatorPermission = async () => {
    try {
      setIsRunning(true);
      addLog('Starting educator permission test...');

      if (!user?.id) {
        addLog('ERROR: User not authenticated');
        return;
      }

      addLog(`Current user: ${user.id}`);

      // Check if user has educator role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rol_adulto, nombre_completo')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        addLog(`ERROR fetching profile: ${profileError.message}`);
        return;
      }

      addLog(`User role: ${profile?.rol_adulto || 'none'}`);

      if (!profile?.rol_adulto?.includes('Educador')) {
        addLog('User does not have educator role - test skipped');
        return;
      }

      // Request educator permissions
      addLog('Requesting educator permissions...');
      addLog('Units: [manada, tropa]');

      // Get notification count before
      const { count: countBefore } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('type', 'educator_permission_request');

      addLog(`Permission request notifications before: ${countBefore}`);

      // Call the RPC function directly to test
      const { data: result, error: rpcError } = await supabase.rpc('request_educator_permissions', {
        p_units: ['manada', 'tropa'],
        p_note: 'test from diagnostic',
      });

      if (rpcError) {
        addLog(`ERROR calling RPC: ${rpcError.message}`);
        return;
      }

      addLog(`RPC Result: ${JSON.stringify(result)}`);

      // Wait and check
      await new Promise(r => setTimeout(r, 1000));

      const { count: countAfter } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('type', 'educator_permission_request');

      addLog(`Permission request notifications after: ${countAfter}`);

      if (countAfter && countBefore && countAfter > countBefore) {
        addLog(`✓ ${countAfter - countBefore} new notification(s) created`);
      } else {
        addLog('✗ No notifications created');
      }

      addLog('✓ Educator permission test complete');
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const checkConfigurationBar = () => {
    addLog('Checking configuration...');
    const hasCompletionBar = !!document.querySelector('[class*="completion"]');
    const hasProgressBar = !!document.querySelector('div[role="progressbar"]');
    
    if (hasCompletionBar || hasProgressBar) {
      addLog('✗ Completion bar FOUND - should be removed');
    } else {
      addLog('✓ Completion bar NOT found - correctly removed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-scout-red/5 to-yellow-500/5 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sistema de Diagnóstico</CardTitle>
            <CardDescription>Verifica que los cambios recientes estén funcionando correctamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Backend: <strong>{isLocalBackend() ? 'LOCAL' : 'SUPABASE'}</strong>
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Usuario autenticado: <strong>{user?.id ? 'SÍ' : 'NO'}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={testFollowNotification}
                disabled={isRunning || !user}
                className="w-full"
                variant="outline"
              >
                Prueba 1: Notificación de Follow
              </Button>
              <Button
                onClick={testEducatorPermission}
                disabled={isRunning || !user}
                className="w-full"
                variant="outline"
              >
                Prueba 2: Solicitud de Permisos Educador
              </Button>
              <Button
                onClick={checkConfigurationBar}
                disabled={isRunning}
                className="w-full"
                variant="outline"
              >
                Prueba 3: Barra de Completitud Removida
              </Button>
            </div>

            <div className="border rounded p-4 bg-muted/50 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Los logs aparecerán aquí...</p>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={log.includes('ERROR') ? 'text-red-600' : log.includes('✓') ? 'text-green-600' : 'text-foreground'}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={clearLogs}
              variant="ghost"
              className="w-full"
            >
              Limpiar logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
