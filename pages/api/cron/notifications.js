import { sendAllReminders } from '../../../utils/sendAllReminders';

export const config = {
  schedule: '0 8 * * *', // tous les jours à 8h UTC
};

export default async function handler(req, res) {
  try {
    const result = await sendAllReminders();
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('Erreur CRON notifications:', err);
    res.status(500).json({ error: err.message });
  }
}
