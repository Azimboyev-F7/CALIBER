import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

export function PasswordRecoveryView() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('Checking your reset link…');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) { setMessage('Password recovery is unavailable.'); return; }
    let active = true;
    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setReady(!error && Boolean(data.session));
      setMessage(!error && data.session ? '' : 'This reset link is invalid or expired. Request a new link.');
    }).catch(() => { if (active) setMessage('Unable to verify your reset link. Please try again.'); });
    return () => { active = false; };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Password recovery is unavailable.');
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setComplete(true);
      setMessage('Your password has been updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your password.');
    } finally { setBusy(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-6">
    <form onSubmit={submit} className="glass-card rounded-2xl p-8 w-full max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Reset your password</h1>
      {message && <p role="status">{message}</p>}
      {ready && !complete && <>
        <label className="block">New password<input className="input-minimal w-full p-3" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label className="block">Confirm password<input className="input-minimal w-full p-3" type="password" autoComplete="new-password" minLength={6} required value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
        <button className="glass-btn-primary p-3 rounded-xl w-full" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
      </>}
      <a className="block text-indigo-300" href="/">Return to Caliber</a>
    </form>
  </main>;
}
