import { Mountain } from 'lucide-react';

export function AuthShell({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left visual panel */}
      <div className="relative hidden w-1/2 items-end overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 p-12 lg:flex">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_30%,white_1px,transparent_1px),radial-gradient(circle_at_80%_70%,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative text-white">
          <Mountain className="mb-6 h-12 w-12" />
          <h1 className="text-4xl font-extrabold leading-tight">
            Plan together.
            <br />
            Travel further.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Build itineraries with friends in real time, explore trips shared by other travelers,
            and book everything in one place.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Mountain className="h-7 w-7 text-brand-600" />
            <span className="text-xl font-extrabold">HighPeak</span>
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mb-6 mt-1 text-sm text-gray-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function GoogleButton() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';
  return (
    <a
      href={`${apiUrl}/oauth2/authorization/google`}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      Continue with Google
    </a>
  );
}
