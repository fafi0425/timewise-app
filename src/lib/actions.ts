'use server';

import { checkOverbreaksAndAlert, CheckOverbreaksAndAlertInput } from '@/ai/flows/automated-overbreak-alerts';
import type { ActivityLog } from './types';

export async function getOverbreakAlertsAction(activityData: ActivityLog[]) {
  try {
    const input: CheckOverbreaksAndAlertInput = {
      activityData: activityData.map(log => ({
          employeeName: log.employeeName,
          date: log.date,
          time: log.time,
          action: log.action,
          duration: log.duration,
      })),
      breakTimeLimit: 15,
      lunchTimeLimit: 60,
    };
    
    // The AI flow might not find overbreaks that our simple logic does, because it analyzes patterns.
    // We will use the AI response if available.
    const result = await checkOverbreaksAndAlert(input);
    
    if (result && result.overbreaks) {
        return result.overbreaks.map(o => ({...o, id: `overbreak_${Math.random()}`}));
    }

    // Fallback to simple logic if AI fails or returns empty
    return activityData.filter(log => 
        (log.action === 'Break In' && (log.duration || 0) > 15) ||
        (log.action === 'Lunch In' && (log.duration || 0) > 60)
    );

  } catch (error) {
    console.error("Error in getOverbreakAlertsAction:", error);
    // Fallback to simple logic on error
    return activityData.filter(log => 
        (log.action === 'Break In' && (log.duration || 0) > 15) ||
        (log.action === 'Lunch In' && (log.duration || 0) > 60)
    );
  }
}
