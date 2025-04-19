import type { GetContactsSuccess } from 'back-end';
type ExtendedContact = GetContactsSuccess['contacts'][0] & {
  email?: string | null;
  displayName?: string | null;
  timezone?: string | null;
  isAdmin?: boolean | null;
  teamId?: string | null;
};
import { useEffect, useState } from 'react';
import { Button } from '@headlessui/react';
import { IconCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { baseUrl, cn, queryClient } from '../utils';
import { listContacts } from '../api';
import Spinner from './Spinner';

const Row: React.FC<{ contact: ExtendedContact }> = ({
  contact,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<boolean>(false);

  async function sendMessage(slackUserId: string) {
    setLoading(true);
    setPosted(false);
    setError(null);

    try {
      await fetch(`${baseUrl}/send-slack-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration: 'slack',
          slackUserId: slackUserId,
        }),
      });
      setPosted(true);
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="transition-colors flex flex-col px-5 py-5 text-sm border-b hover:bg-gray-50">
      <div className="flex gap-2 justify-between items-center mb-2">
        <div className="whitespace-nowrap text-[#292d32] flex gap-4 items-center">
          <img src={contact.avatar} alt="" className="rounded-full w-7" />
          <div>
            <div className="font-medium">{contact.fullName}</div>
            {contact.email && <div className="text-xs text-gray-500">{contact.email}</div>}
          </div>
        </div>
        <div className="whitespace-nowrap text-gray-500">
          <div className="flex gap-4 items-center">
            <Button
              onClick={() => sendMessage(contact.id)}
              className={cn(
                'transition-all flex gap-2 items-center rounded py-1.5 px-3 text-xs font-medium bg-[#635cff] hover:bg-opacity-80 text-white',
                posted && 'text-[#0e6245] bg-[#cbf4c9]'
              )}
              disabled={loading}
            >
              {posted ? 'Invited' : 'Invite'}
              {loading && <Spinner size={1} className="text-gray-800" />}
              {posted && <IconCheck className="text-[#0e6245]" size={16} />}
            </Button>
            {error && <div className="text-xs text-red-400">{error}</div>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-1">
        {contact.displayName && (
          <div>
            <span className="font-medium">Display Name:</span> {contact.displayName}
          </div>
        )}
        {contact.timezone && (
          <div>
            <span className="font-medium">Timezone:</span> {contact.timezone}
          </div>
        )}
        {contact.teamId && (
          <div>
            <span className="font-medium">Team ID:</span> {contact.teamId}
          </div>
        )}
        {contact.isAdmin && (
          <div className="col-span-3">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Admin</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ContactsTable: React.FC = () => {
  const { data: resContacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: listContacts,
  });
  useEffect(() => {
    const interval = setInterval(
      () => {
        void queryClient.refetchQueries({ queryKey: ['contacts'] });
      },
      resContacts !== undefined && resContacts.contacts.length > 0
        ? 10000
        : 1000
    );

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resContacts]);

  if (isLoading || !resContacts?.contacts) {
    return (
      <div className="w-full flex justify-center">
        <Spinner size={1} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {!resContacts.contacts.length ? (
        <div className="mt-8 text-center h-20">No contacts found</div>
      ) : (
        resContacts.contacts.map((contact) => (
          <Row key={contact.id} contact={contact as ExtendedContact} />
        ))
      )}
    </div>
  );
};
