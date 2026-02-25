export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { writeAdminHash } from '@/lib/data';

export const POST = withAuth(async (req: NextRequest) => {
  const { current, newPassword } = await req.json();
  if (!current || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Nouveau mot de passe trop court (8 caracteres min)' },
      { status: 400 }
    );
  }

  const isMatch = await verifyPassword(current);
  if (!isMatch) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await writeAdminHash(newHash);
  return NextResponse.json({ success: true });
});
