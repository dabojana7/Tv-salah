
import { N8N_WEBHOOK_URL } from '../constants';
import { LeadData } from '../types';

export const sendLeadToN8N = async (lead: LeadData) => {
  try {
    // In a real scenario, we would POST to the webhook.
    // For this demo, we log to console and simulate a successful send.
    console.log('Sending lead to n8n:', lead);
    
    // const response = await fetch(N8N_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     ...lead,
    //     source: 'Asiri AI Agent',
    //     timestamp: new Date().toISOString()
    //   })
    // });
    // return response.ok;

    return true;
  } catch (error) {
    console.error('Failed to send to n8n:', error);
    return false;
  }
};
