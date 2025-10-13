import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import DoseLogCard from '@/components/DoseLogCard';
import { getDoseLogs, clearDoseLogs } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { DoseLog } from '@/types/reminder';

const HistoryPage = () => {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'taken' | 'missed'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await getDoseLogs();
    setLogs(data);
  };

  const handleClearHistory = async () => {
    if (logs.length === 0) {
      toast({
        title: "No history",
        description: "There's no history to clear",
      });
      return;
    }

    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      await clearDoseLogs();
      setLogs([]);
      toast({
        title: "History cleared",
        description: "All dose logs have been removed",
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const stats = {
    total: logs.length,
    taken: logs.filter(l => l.status === 'taken').length,
    missed: logs.filter(l => l.status === 'missed').length,
  };

  const adherenceRate = stats.total > 0 
    ? Math.round((stats.taken / stats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-sm opacity-90">Track your medication adherence</p>
          </div>
          {logs.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg p-4 text-center border border-border">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{adherenceRate}%</p>
            <p className="text-xs text-muted-foreground">Adherence</p>
          </div>

          <div className="bg-card rounded-lg p-4 text-center border border-border">
            <CheckCircle className="h-5 w-5 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{stats.taken}</p>
            <p className="text-xs text-muted-foreground">Taken</p>
          </div>

          <div className="bg-card rounded-lg p-4 text-center border border-border">
            <XCircle className="h-5 w-5 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{stats.missed}</p>
            <p className="text-xs text-muted-foreground">Missed</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('taken')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'taken'
                ? 'bg-success text-success-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Taken
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'missed'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Missed
          </button>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'No history yet' 
                : `No ${filter} doses recorded`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <DoseLogCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default HistoryPage;
