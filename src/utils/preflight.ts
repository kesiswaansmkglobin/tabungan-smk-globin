// Runtime preflight: detect missing critical packages and produce
// actionable install commands for TS2307 / TS2591 / TS2322-style failures.

export interface PreflightIssue {
  module: string;
  reason: string;
  installCmd: string;
}

const REQUIRED_RUNTIME_MODULES = [
  "@tanstack/react-query",
  "lucide-react",
  "date-fns",
  "framer-motion",
  "react-router-dom",
  "@supabase/supabase-js",
];

/**
 * Try to dynamically import each required module. Any failure is reported
 * with the exact bun/npm command to install it.
 */
export async function runPreflight(): Promise<PreflightIssue[]> {
  const issues: PreflightIssue[] = [];

  await Promise.all(
    REQUIRED_RUNTIME_MODULES.map(async (mod) => {
      try {
        await import(/* @vite-ignore */ mod);
      } catch (err: any) {
        issues.push({
          module: mod,
          reason: err?.message ?? "Module failed to load",
          installCmd: `bun add ${mod}    # or: npm i ${mod}`,
        });
      }
    })
  );

  return issues;
}

/**
 * Inspect any thrown Error and return install hints if the message looks
 * like a classic TS2307 ("Cannot find module") or TS2591 ("Cannot find name
 * 'process'") failure.
 */
export function diagnoseError(error: Error): string[] {
  const hints: string[] = [];
  const msg = `${error.name}: ${error.message}`;

  // TS2307 / runtime "Cannot find module 'X'"
  const moduleMatch = msg.match(/Cannot find module ['"`]([^'"`]+)['"`]/i);
  if (moduleMatch) {
    const mod = moduleMatch[1];
    hints.push(
      `Modul "${mod}" tidak ditemukan. Jalankan:  bun add ${mod}   (atau: npm i ${mod})`
    );
  }

  // Failed to resolve module specifier (Vite/ESM)
  const resolveMatch = msg.match(
    /Failed to (?:resolve|fetch).*?['"`]([^'"`]+)['"`]/i
  );
  if (resolveMatch) {
    hints.push(
      `Vite gagal me-resolve "${resolveMatch[1]}". Coba:  bun install   lalu restart dev server.`
    );
  }

  // TS2591: Cannot find name 'process'
  if (/Cannot find name ['"`]?process['"`]?/i.test(msg)) {
    hints.push(
      `Gunakan import.meta.env (Vite-native) sebagai pengganti process.env, atau pasang:  bun add -d @types/node`
    );
  }

  // TS2322: framer-motion props mismatch
  if (
    /framer-motion/i.test(msg) ||
    /(initial|animate|exit|whileHover).*not assignable/i.test(msg)
  ) {
    hints.push(
      `Konflik tipe framer-motion. Pastikan versi sinkron:  bun add framer-motion@latest   dan restart TS server.`
    );
  }

  return hints;
}
