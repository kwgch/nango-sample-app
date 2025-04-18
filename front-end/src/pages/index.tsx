import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Link from 'next/link';
import { IntegrationsGrid } from '../components/IntegrationGrid';
import Spinner from '../components/Spinner';
import { listConnections, listIntegrations } from '../api';
import { ContactsTable } from '../components/ContactsTable';
import type { Integration } from '../types';
import { cn } from '../utils';

export default function IndexPage() {
  const { data: resIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: listIntegrations,
  });
  const { data: resConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: listConnections,
  });

  const integrations = useMemo<Integration[] | undefined>(() => {
    if (!resIntegrations || !resConnections) {
      return;
    }

    console.log('Building integrations with connections:', resConnections);
    
    return resIntegrations.integrations.map((integration) => {
      const isConnected = resConnections.connections.some((connection) => {
        return connection.provider_config_key === integration.unique_key;
      });
      
      console.log(`Integration ${integration.unique_key} connected:`, isConnected);
      
      return {
        ...integration,
        connected: isConnected,
      };
    });
  }, [resIntegrations, resConnections]);

  const connectedTo = useMemo(() => {
    console.log('Connections data:', resConnections);
    console.log('Integrations data:', resIntegrations);
    console.log('Mapped integrations:', integrations);
    return integrations?.find((value) => value.connected);
  }, [integrations, resConnections, resIntegrations]);

  if (!integrations) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Spinner size={2} />
      </main>
    );
  }

  return (
    <div className="w-full h-screen grid grid-rows-[auto_1fr]">
      <header className="px-10 py-5 border-b">
        <h1 className="text-2xl font-bold">Team Settings</h1>
      </header>
      <div className="overflow-y-scroll px-10 py-10">
        <div
          className={cn(
            'flex justify-center',
            !connectedTo && 'items-center h-full'
          )}
        >
          <div className="flex flex-col gap-16">
            <div className="w-[540px] rounded shadow-2xl px-16 py-10 pb-16 h-auto">
              <h2 className="text-center text-2xl mb-10 font-semibold">
                Invite team members
              </h2>
              {connectedTo && <ContactsTable />}
              {!connectedTo && <IntegrationsGrid integrations={integrations} />}
              {integrations.length <= 0 && (
                <div>
                  <button
                    className={cn(
                      'relative transition-colors inline-flex w-full items-center justify-center gap-x-3 py-3 text-sm font-semibold rounded-md bg-black text-white hover:bg-gray-900',
                      'bg-opacity-80'
                    )}
                  >
                    <img
                      src={
                        'https://app.nango.dev/images/template-logos/slack.svg'
                      }
                      alt=""
                      className="w-5"
                    />
                    Import from Slack
                  </button>
                  <div className="text-red-500 text-xs text-center mt-1">
                    <Link href="https://app.nango.dev/dev/integrations">
                      Activate this provider in your Nango account
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {connectedTo && <IntegrationsGrid integrations={[connectedTo]} />}
          </div>
        </div>
      </div>
    </div>
  );
}
