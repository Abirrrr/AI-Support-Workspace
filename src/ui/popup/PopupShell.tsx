export function PopupShell() {
  return (
    <main className="w-80 bg-slate-950 p-6 text-slate-50">
      <h1 className="text-lg font-semibold">AI Support Workspace</h1>
      <p className="mt-2 text-sm text-slate-300">
        Your local support workspace is ready.
      </p>
      <a
        className="mt-5 block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
        href="/options.html"
        rel="noreferrer"
        target="_blank"
      >
        Open Knowledge Library
      </a>
    </main>
  );
}
