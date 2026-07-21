/// SMS body templates for queue-lifecycle notifications. Kept intentionally
/// short — Semaphore/Twilio bill per 160-char segment. Each template maps to a
/// stable id persisted on Message.templateId for audit / replay.
///
/// Variables are simple `{name}` placeholders resolved by `renderTemplate`.

export type SmsTemplateId =
  | 'queue.confirmed'
  | 'queue.you_are_next'
  | 'queue.now_serving'
  | 'queue.recall'
  | 'queue.skipped'
  | 'queue.cancelled'
  | 'queue.transferred';

interface TemplateDef {
  readonly id: SmsTemplateId;
  readonly render: (vars: Record<string, string | number>) => string;
}

const TEMPLATES: Record<SmsTemplateId, TemplateDef> = {
  'queue.confirmed': {
    id: 'queue.confirmed',
    render: (v) =>
      `${v.businessName}: You're booked! Your number is #${v.ticketNumber}. ~${v.peopleAhead} ahead of you.`,
  },
  'queue.you_are_next': {
    id: 'queue.you_are_next',
    render: (v) =>
      `${v.businessName}: You're next (#${v.ticketNumber})! Please make your way to the counter.`,
  },
  'queue.now_serving': {
    id: 'queue.now_serving',
    render: (v) =>
      `${v.businessName}: Now serving #${v.ticketNumber}, ${v.customerName}. Please proceed to the counter.`,
  },
  'queue.recall': {
    id: 'queue.recall',
    render: (v) =>
      `${v.businessName}: Final call for #${v.ticketNumber}, ${v.customerName}. Please come to the counter now.`,
  },
  'queue.skipped': {
    id: 'queue.skipped',
    render: (v) =>
      `${v.businessName}: We missed you (#${v.ticketNumber}). Please see staff to rejoin the queue.`,
  },
  'queue.cancelled': {
    id: 'queue.cancelled',
    render: (v) =>
      `${v.businessName}: Your booking #${v.ticketNumber} has been cancelled.${v.reason ? ` (${v.reason})` : ''}`,
  },
  'queue.transferred': {
    id: 'queue.transferred',
    render: (v) =>
      `${v.businessName}: Your booking is now for ${v.serviceName}. New number #${v.ticketNumber}.`,
  },
};

export function renderSmsTemplate(
  templateId: SmsTemplateId,
  vars: Record<string, string | number>,
): string {
  const def = TEMPLATES[templateId];
  if (!def) {
    throw new Error(`Unknown SMS template '${templateId}'`);
  }
  return def.render(vars);
}
