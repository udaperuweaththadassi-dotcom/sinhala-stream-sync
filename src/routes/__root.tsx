import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppProvider } from "@/lib/app-context";
import { AuthProvider } from "@/lib/auth-context";
import { EdgeBar, EdgeDock } from "@/components/EdgeBar";
import { FeedbackFooter } from "@/components/FeedbackFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold neon-text font-display">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border border-input px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Sintype Studio is a web application for real-time Sinhala text conversion and mobile syncing." },
      { name: "author", content: "Sintype.lk" },
      { name: "keywords", content: "Singlish to Sinhala, Sinhala Unicode, FM font converter, Sinhala typing, සිංහල type" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Sintype Studio is a web application for real-time Sinhala text conversion and mobile syncing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Sintype Studio is a web application for real-time Sinhala text conversion and mobile syncing." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/afabe525-cb56-4e52-9fcc-1a9bd6c2471d/id-preview-d0570c39--2c84f77d-400e-471e-b13c-94a3a11e3dcf.lovable.app-1778946798346.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/afabe525-cb56-4e52-9fcc-1a9bd6c2471d/id-preview-d0570c39--2c84f77d-400e-471e-b13c-94a3a11e3dcf.lovable.app-1778946798346.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Orbitron:wght@600;800&family=JetBrains+Mono&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = path.startsWith("/m/");
  return (
    <div className="min-h-screen flex flex-col">
      {!isMobile && <EdgeBar />}
      {!isMobile && <EdgeDock />}
      <main className={`flex-1 ${!isMobile ? "sm:pl-20" : ""}`}>{children}</main>
      {!isMobile && <FeedbackFooter />}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Layout>
            <Outlet />
          </Layout>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
