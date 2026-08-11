/**
 * Generic placeholder for sections that are actively being built next
 * (Accounts, Subscriptions, Invoices, Payments, Admin, ...). Not to be
 * confused with the Locked components, which mark features that are not
 * yet planned to be worked on.
 */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Coming soon.</p>
    </div>
  );
}
