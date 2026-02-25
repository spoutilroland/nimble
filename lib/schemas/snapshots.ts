import { z } from 'zod';

export const SnapshotMetaSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  createdAt: z.string(), // ISO 8601
  fileCount: z.number(),
});

export const SnapshotsIndexSchema = z.object({
  snapshots: z.array(SnapshotMetaSchema),
});

export const CreateSnapshotBodySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
});

export type SnapshotMeta = z.infer<typeof SnapshotMetaSchema>;
export type SnapshotsIndex = z.infer<typeof SnapshotsIndexSchema>;
export type CreateSnapshotBody = z.infer<typeof CreateSnapshotBodySchema>;
