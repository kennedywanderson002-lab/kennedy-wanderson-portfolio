import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOptionalAdminSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Atelier Admin · Kennedy Wanderson",
  robots: {
    index: false,
    follow: false,
  },
};

async function AuthenticatedGuard() {
  const session = await getOptionalAdminSession();
  if (session?.user) {
    redirect("/admin");
  }
  return null;
}

async function SetupStatusBanner() {
  // Reading connection state dynamically at request time inside Suspense
  await connection();
  const connected = isDatabaseConfigured();
  if (connected) return null;

  return (
    <div
      role="status"
      className="mb-8 border border-[#D8CBB8] bg-[#FAF6F0] p-4 text-xs text-[#59534B] leading-relaxed"
    >
      <p className="font-medium uppercase tracking-[0.2em] text-[10px] text-[#9E8765] mb-1">
        Configuração Inicial Pendente
      </p>
      <p>
        O banco de dados <strong>Neon Postgres</strong> ainda não está conectado
        neste ambiente (<code className="text-[11px]">DATABASE_URL</code>). O
        site público segue online normalmente em modo estático seguro. Conecte o
        Storage no painel da Vercel para liberar o login administrativo.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#181716] flex flex-col justify-between px-6 py-10 sm:px-12">
      <Suspense fallback={null}>
        <AuthenticatedGuard />
      </Suspense>

      {/* Top Return Link */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#6B6660] hover:text-[#181716] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span>Voltar ao Site Público</span>
        </Link>

        <span className="text-[10px] uppercase tracking-[0.3em] text-[#9C968F]">
          Acesso Restrito
        </span>
      </div>

      {/* Centered Editorial Login Card */}
      <div className="w-full max-w-md mx-auto my-12 bg-white border border-[#EAE6DE] p-8 sm:p-12 shadow-[0_12px_40px_rgba(24,23,22,0.04)]">
        <div className="text-center mb-10">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#9E8765] mb-3">
            Atelier Privé
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.18em] uppercase font-light text-[#181716]">
            Kennedy Wanderson
          </h1>
          <p className="font-serif italic text-sm text-[#6B6660] mt-2">
            Curadoria Visual &amp; Gestão do Portfólio
          </p>
        </div>

        <Suspense fallback={null}>
          <SetupStatusBanner />
        </Suspense>

        <LoginForm />
      </div>

      {/* Subtle Footer */}
      <div className="text-center text-[10px] uppercase tracking-[0.25em] text-[#9C968F]">
        © 2026 Kennedy Wanderson · Área Administrativa Protegida
      </div>
    </main>
  );
}

