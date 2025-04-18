import type { RouteHandler } from 'fastify';
import type { GetPublicConnections } from '@nangohq/types';
import { nango } from '../nango.js';
import { getUserFromDatabase, db } from '../db.js';

export type GetConnectionsSuccess = {
  connections: GetPublicConnections['Success']['connections'];
};
export type GetConnections = GetConnectionsSuccess | { error: string };

/**
 * List available connection for one user.
 * A connection is a link between an integration and a user (e.g: oauth token)
 */
export const getConnections: RouteHandler<{
  Reply: GetConnections;
}> = async (_, reply) => {
  const user = await getUserFromDatabase();
  if (!user) {
    await reply.status(400).send({ error: 'invalid_user' });
    return;
  }
  if (!user.connectionId) {
    await reply.status(200).send({ connections: [] });
    return;
  }

  // We list all the connections for our user
  console.log('Listing connections for user:', user);
  
  try {
    const localConnections = await db.connections.findMany();
    console.log('Local connections:', localConnections);
    
    if (localConnections.length > 0) {
      const formattedConnections = localConnections.map(conn => ({
        id: conn.id,
        provider_config_key: conn.provider_config_key,
        created_at: conn.created_at.toISOString(),
        updated_at: conn.updated_at.toISOString(),
        connection_id: conn.id,
        connection_config: {},
        credentials_status: 'VALID',
      }));
      
      console.log('Formatted connections:', formattedConnections);
      await reply.status(200).send({ connections: formattedConnections });
      return;
    }
    
    const list = await nango.listConnections(user.connectionId);
    console.log('Nango API connections list:', list);
    
    await reply.status(200).send({ connections: list.connections });
  } catch (error) {
    console.error('Error getting connections:', error);
    await reply.status(200).send({ connections: [] });
  }
};
