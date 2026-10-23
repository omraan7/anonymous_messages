import Link from "next/link";
export default function NotFound() {
  return (
    <div className="glass mx-auto max-w-md p-9 text-center">
      <h1 className="text-3xl font-semibold">Profile not found</h1>
      <p className="mt-2 muted">This link doesn&apos;t belong to anyone. Check it for typos.</p>
      <Link href="/" className="btn btn-primary mt-6">Go home</Link>
    </div>
  );
}
