// Temporary Step 1 screen: proves the dev server runs and the env variable loads.
// This file is replaced by the real layout in Steps 4-5.
export default function App() {
  return (
    <main>
      <h1>DocMind</h1>
      <p>Frontend scaffold is running.</p>
      <p>API base URL: {import.meta.env.VITE_API_BASE_URL}</p>
    </main>
  );
}