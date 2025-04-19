import type { RouteHandler } from 'fastify';
import { db } from '../db.js';

export type PostManualConnectionBody = {
  connectionId: string;
  providerConfigKey: string;
};

export type PostManualConnectionSuccess = {
  success: boolean;
};

export type PostManualConnection = PostManualConnectionSuccess | { error: string };

/**
 * Create a manual connection record when webhooks aren't working
 */
export const postManualConnection: RouteHandler<{
  Body: PostManualConnectionBody;
  Reply: PostManualConnection;
}> = async (req, reply) => {
  const { connectionId, providerConfigKey } = req.body;

  if (!connectionId || !providerConfigKey) {
    await reply.status(400).send({ error: 'missing_parameters' });
    return;
  }

  try {
    console.log(`Creating manual connection for ${providerConfigKey} with ID ${connectionId}`);
    
    await db.connections.upsert({
      where: {
        id: connectionId,
      },
      update: {
        provider_config_key: providerConfigKey,
        updated_at: new Date(),
      },
      create: {
        id: connectionId,
        provider_config_key: providerConfigKey,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    
    const user = await db.users.findFirst();
    if (user) {
      await db.users.update({
        data: {
          connectionId: connectionId,
        },
        where: {
          id: user.id,
        },
      });
    }
    
    console.log('Manual connection created successfully');
    await reply.status(200).send({ success: true });
  } catch (error) {
    console.error('Error creating manual connection:', error);
    await reply.status(500).send({ error: 'internal_server_error' });
  }
};
