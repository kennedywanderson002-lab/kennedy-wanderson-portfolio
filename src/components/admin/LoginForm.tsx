"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.status === 503) {
          setErrorMessage(
            "O banco de dados ainda não foi conectado (DATABASE_URL). Ative o Neon Postgres na Vercel e rode o seed inicial."
          );
        } else if (error.status === 429) {
          setErrorMessage(
            "Muitas tentativas seguidas. Aguarde um minuto antes de tentar novamente."
          );
        } else {
          setErrorMessage(
            "E-mail ou senha incorretos. Verifique suas credenciais de administrador."
          );
        }
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao servidor de autenticação. Verifique a configuração do banco."
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7" noValidate={false}>
      <div aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <div
            role="alert"
            className="border border-red-200 bg-red-50/70 px-4 py-3 text-xs text-red-900 leading-relaxed"
          >
            {errorMessage}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="admin-email"
          className="block text-[10px] uppercase tracking-[0.25em] text-[#6B6660] mb-2"
        >
          E-mail do Administrador
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@kennedywanderson.com"
          className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-4 py-3 text-sm text-[#181716] placeholder:text-[#A8A29A] focus:border-[#181716] focus:bg-white focus:outline-hidden transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-[10px] uppercase tracking-[0.25em] text-[#6B6660] mb-2"
        >
          Senha de Acesso
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full border border-[#D8D3CB] bg-[#FAF9F6] pl-4 pr-11 py-3 text-sm text-[#181716] placeholder:text-[#A8A29A] focus:border-[#181716] focus:bg-white focus:outline-hidden transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#8C8780] hover:text-[#181716] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 bg-[#181716] text-white hover:bg-[#9E8765] px-6 py-4 text-[10px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Autenticando...</span>
          </>
        ) : (
          <>
            <Lock size={13} />
            <span>Entrar no Painel</span>
          </>
        )}
      </button>
    </form>
  );
}

