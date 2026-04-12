import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { isLocalBackend } from '@/lib/backend';
import { supabase } from '@/integrations/supabase/client';
import { followUser, getFollowRelation, unfollowUser } from '@/lib/follows';

type NotificationRow = {
  id: string;
  type: string;
  entity_type: string | null;
  created_at: string;
};

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

  const testFollowNotification = async () => {
    try {
      setIsRunning(true);
      addLog('Starting follow notification test...');

      if (!user?.id) {
        addLog('ERROR: User not authenticated');
        return;
      }

      // Get a list of users to follow
      addLog('Fetching users list...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo, is_public')
        .neq('user_id', user.id)
        .limit(5);

      if (profilesError) {
        addLog(`ERROR fetching profiles: ${profilesError.message}`);
        return;
      }

      if (!profiles || profiles.length === 0) {
        addLog('No other users found to test');
        return;
      }

      const targetUser = profiles[0];
      addLog(`Found target user: ${targetUser.nombre_completo || targetUser.user_id}`);
      addLog(`Target profile is_public: ${targetUser.is_public}`);

      // Ensure a clean test state: if relationship already exists, remove it first.
      const existingRelation = await getFollowRelation(targetUser.user_id);
      if (existingRelation.error) {
        addLog(`ERROR checking existing relation: ${existingRelation.error.message}`);
        return;
      }
      if (existingRelation.data) {
        addLog(`Existing follow relation detected (${existingRelation.data.status}). Removing it first...`);
        const unfollowResult = await unfollowUser(targetUser.user_id);
        if (unfollowResult.error) {
          addLog(`ERROR removing existing relation: ${unfollowResult.error.message}`);
          return;
        }
        addLog('Previous relation removed');
      }

      // Check notifications BEFORE
      const { data: notificationsBefore } = await supabase
        .from('notifications')
        .select('id, type, created_at')
        .eq('recipient_id', targetUser.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      addLog(`Notifications for target BEFORE: ${notificationsBefore?.length || 0}`);

      // Create follow using the library function
      addLog('Creating follow...');
      let followError = (await followUser(targetUser.user_id)).error;

      // Fallback for stale relation visibility under RLS/cache: remove and retry once.
      if (followError && followError.message.toLowerCase().includes('duplicate key')) {
        addLog('Duplicate relation detected. Trying cleanup + retry...');
        const retryUnfollow = await unfollowUser(targetUser.user_id);
        if (retryUnfollow.error) {
          addLog(`ERROR during duplicate cleanup: ${retryUnfollow.error.message}`);
          return;
        }
        followError = (await followUser(targetUser.user_id)).error;
      }

      if (followError) {
        addLog(`ERROR creating follow: ${followError.message}`);
        return;
      }

      addLog('Follow created successfully');

      // Wait a bit for database processing
      addLog('Waiting for notification processing...');
      await new Promise(r => setTimeout(r, 1000));

      // Check notifications AFTER
      const { data: notificationsAfter } = await supabase
        .from('notifications')
        .select('id, type, entity_type, created_at')
        .eq('recipient_id', targetUser.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      addLog(`Notifications for target AFTER: ${notificationsAfter?.length || 0}`);
      if (notificationsAfter && notificationsAfter.length > 0) {
        (notificationsAfter as NotificationRow[]).forEach((n) => {
          addLog(`  - Type: ${n.type}, Entity: ${n.entity_type}, Created: ${new Date(n.created_at).toLocaleTimeString()}`);
        });
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
