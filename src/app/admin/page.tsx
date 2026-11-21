export default function AdminHomePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Admin</h1>
      <p className="text-black/60 dark:text-white/60">
        Choose a section from the menu. Access is enforced by the API; a
        non-admin account receives a forbidden response.
      </p>
    </div>
  );
}
