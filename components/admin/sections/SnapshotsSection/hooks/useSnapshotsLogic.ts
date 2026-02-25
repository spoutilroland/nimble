'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import type { SnapshotMeta } from '@/lib/schemas';

export function useSnapshotsLogic() {
  const { t } = useI18n();
  const { message, show } = useFlashMessage();

  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/snapshots');
      const data = await res.json();
      setSnapshots(data.snapshots ?? []);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName('');
        setShowForm(false);
        show(t('snapshots.created').replace('{name}', newName.trim()), 'success');
        await load();
      } else {
        show(t('snapshots.createError'), 'error');
      }
    } catch {
      show(t('snapshots.createError'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (snapshot: SnapshotMeta) => {
    if (!confirm(t('snapshots.confirmRestore').replace('{name}', snapshot.name))) return;
    try {
      const res = await fetch(`/api/admin/snapshots/${snapshot.id}/restore`, { method: 'POST' });
      if (res.ok) {
        show(t('snapshots.restored').replace('{name}', snapshot.name), 'success');
        // Recharge la page pour vider le cache Zustand de toutes les sections
        setTimeout(() => window.location.reload(), 800);
      } else {
        show(t('snapshots.restoreError'), 'error');
      }
    } catch {
      show(t('snapshots.restoreError'), 'error');
    }
  };

  const handleDelete = async (snapshot: SnapshotMeta) => {
    if (!confirm(t('snapshots.confirmDelete').replace('{name}', snapshot.name))) return;
    try {
      const res = await fetch(`/api/admin/snapshots/${snapshot.id}`, { method: 'DELETE' });
      if (res.ok) {
        show(t('snapshots.deleted'), 'success');
        await load();
      } else {
        show(t('snapshots.deleteError'), 'error');
      }
    } catch {
      show(t('snapshots.deleteError'), 'error');
    }
  };

  return {
    t,
    snapshots,
    loading,
    creating,
    newName,
    setNewName,
    showForm,
    setShowForm,
    message,
    handleCreate,
    handleRestore,
    handleDelete,
  };
}
