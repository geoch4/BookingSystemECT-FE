import { Link } from 'react-router-dom';
export default function ForbiddenPage() {
  return <section role="alert" className="mx-auto max-w-xl rounded-xl border p-8">
    <p className="text-sm font-semibold">403 – Åtkomst nekad</p>
    <h1 className="mt-2 text-2xl font-bold">Du saknar behörighet</h1>
    <p className="my-4">Din roll eller vårdenhet ger inte åtkomst till den här vyn. Kontakta administratören om din behörighet behöver ändras.</p>
    <Link to="/">Till startsidan</Link>
  </section>;
}
