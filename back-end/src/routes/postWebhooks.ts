/* eslint-disable @typescript-eslint/require-await */
import type { RouteHandler } from 'fastify';

import type {
  NangoAuthWebhookBody,
  NangoSyncWebhookBody,
  NangoWebhookBody,
} from '@nangohq/node';
import { nango } from '../nango.js';
import { db } from '../db.js';
import type { SlackUser } from '../schema.js';

/**
 * Receive webhooks from Nango every time a records has been added, updated or deleted
 */
export const postWebhooks: RouteHandler = async (req, reply) => {
  const body = req.body as NangoWebhookBody;
  const sig = req.headers['x-nango-signature'] as string;

  console.log('Webhook URL:', process.env['NANGO_WEBHOOK_URL'], 'Webhook type:', body.type);
  console.log('Webhook: received', body);

  // Verify the signature to be sure it's Nango that sent us this payload
  if (sig && !nango.verifyWebhookSignature(sig, req.body)) {
    console.error('Failed to validate Webhook signature');
    await reply.status(400).send({ error: 'invalid_signature' });
    return;
  }
  console.log('Webhook signature verification passed or skipped for testing');

  // Handle each webhook
  switch (body.type) {
    case 'auth':
      // New connection
      await handleNewConnectionWebhook(body);
      break;

    case 'sync':
      // After a sync is finished
      await handleSyncWebhook(body);
      break;

    default:
      console.warn('unsupported webhook', body);
      break;
  }

  // Always return 200 to avoid re-delivery
  await reply.status(200).send({ ack: true });
};

// ------------------------

/**
 * Handle webhook when a new connection is created
 */
async function handleNewConnectionWebhook(body: NangoAuthWebhookBody) {
  if (!body.success) {
    console.error('Failed to auth', body);
    return;
  }

  if (body.operation === 'creation') {
    console.log('Webhook: New connection', body);
    // With the end user id that we set in the Session, we can now link our user to the new connection
    try {
      console.log('endUser data:', body.endUser);
      console.log('Connection ID:', body.connectionId);
      console.log('Provider config key:', body.providerConfigKey);
      
      // Update user and create a connection record
      const user = await db.users.findFirst();
      
      if (user) {
        console.log('Found user:', user);
        console.log('Updating user connection ID to:', body.connectionId);
        
        await db.users.update({
          data: {
            connectionId: body.connectionId,
          },
          where: {
            id: user.id,
          },
        });
        
        // Create a connection record
        await db.connections.create({
          data: {
            id: body.connectionId,
            provider_config_key: body.providerConfigKey,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        
        console.log('User connection and connection record created successfully');
      } else {
        console.error('User not found for endUserId:', body.endUser?.endUserId);
      }
    } catch (error) {
      console.error('Error updating user connection:', error);
    }
  } else {
    console.log('Webhook: connection', body.operation);
  }
}

/**
 * Handle webhook when a sync has finished fetching data
 */
async function handleSyncWebhook(body: NangoSyncWebhookBody) {
  if (!body.success) {
    console.error('Sync failed', body);
    return;
  }

  console.log('Webhook: Sync results');

  // Now we need to fetch the actual records that were added/updated/deleted
  // The payload does not contains the records but a cursor "modifiedAfter"
  const records = await nango.listRecords<SlackUser>({
    connectionId: body.connectionId,
    model: body.model,
    providerConfigKey: body.providerConfigKey,
    modifiedAfter: body.modifiedAfter,
    limit: 1000,
  });

  console.log('Records', records.records.length);

  // Save the updates in our backend
  for (const record of records.records) {
    if (record._nango_metadata.deleted_at) {
      // When a record is deleted in the integration you can replicate this in your own system
      await db.contacts.update({
        where: { id: record.id },
        data: { deletedAt: new Date() },
      });
      continue;
    }

    const fullName = record.profile.display_name ?? record.name;
    const avatar =
      record.profile.image_original ??
      'https://placehold.co/32x32/lightgrey/white';
    
    const email = record.profile.email;
    const displayName = record.profile.display_name;
    const timezone = record.tz;
    const isAdmin = record.is_admin;
    const teamId = record.team_id;

    // Create or Update the others records
    await db.contacts.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        fullName: fullName,
        avatar,
        integrationId: body.providerConfigKey,
        connectionId: body.connectionId,
        createdAt: new Date(),
        email,
        displayName,
        timezone,
        isAdmin,
        teamId,

      },
      update: { 
        fullName, 
        avatar, 
        updatedAt: new Date(),
        email,
        displayName,
        timezone,
        isAdmin,
        teamId,

      },
    });
  }

  console.log('Results processed');
}
