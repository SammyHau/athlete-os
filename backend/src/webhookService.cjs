class InMemoryWebhookQueue {
  constructor() { this.events = []; }
  async enqueue(event) { this.events.push({ ...event, receivedAt: new Date().toISOString() }); }
}

function validateWebhookEvent(value) {
  if (!value || !["activity", "athlete"].includes(value.object_type) || !["create", "update", "delete"].includes(value.aspect_type)) return null;
  return { objectType: value.object_type, aspectType: value.aspect_type, objectId: String(value.object_id), ownerId: String(value.owner_id), subscriptionId: String(value.subscription_id), eventTime: Number(value.event_time), updates: value.updates && typeof value.updates === "object" ? value.updates : {} };
}

module.exports = { InMemoryWebhookQueue, validateWebhookEvent };
