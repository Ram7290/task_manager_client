import React from 'react';
import { Clock } from 'lucide-react';

export function SubmitReminder({ reminder }) {
  if (!reminder || !reminder.show) return null;

  const hasEntries = reminder.entry_count > 0;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs">
      <Clock className="w-5 h-5 flex-shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold">
          {hasEntries
            ? "Today's daily report is not submitted yet."
            : "You haven't logged any work for today yet."}
        </p>
        <p className="text-amber-800 mt-0.5">
          {hasEntries
            ? `You have ${reminder.entry_count} ${reminder.entry_count === 1 ? 'entry' : 'entries'} saved. Submit before ${reminder.cutoff}, or it will be submitted automatically and locked.`
            : `Add your entries and submit before ${reminder.cutoff}.`}
        </p>
      </div>
    </div>
  );
}
