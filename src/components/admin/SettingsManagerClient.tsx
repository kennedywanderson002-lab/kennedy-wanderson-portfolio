"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import type { CmsSiteSettings } from "@/lib/cms/types";
import {
  saveSiteContentAction,
  changeAdminPasswordAction,
} from "@/lib/cms/actions";

interface SettingsManagerClientProps {
  initialSettings: CmsSiteSettings;
}

export function SettingsManagerClient({
  initialSettings,
}: SettingsManagerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [contactEmail, setContactEmail] = useState(
    initialSettings.contactEmail
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSettings.whatsappNumber
  );
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(
    initialSettings.whatsappDefaultMessage
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialSettings.instagramUrl
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleSaveChannels = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setStatusNotice(null);

    startTransition(async () => {
      try {
        await saveSiteContentAction({
          translationsJson: initialSettings.translations,
          showAboutPortrait: initialSettings.showAboutPortrait,
          aboutPortraitUrl: initialSettings.aboutPortraitUrl,
          aboutPortraitBlobPathname: initialSettings.aboutPortraitBlobPathname,
          aboutPortraitFocalPoint: initialSettings.aboutPortraitFocalPoint,
          contactEmail: contactEmail.trim(),
          whatsappNumber: whatsappNumber.replace(/[^\d]/g, ""),
          whatsappDefaultMessage: whatsappDefaultMessage.trim(),
          instagramUrl: instagramUrl.trim(),
        });

        setStatusNotice(
          "Canais de WhatsApp, E-mail e Instagram atualizados em todo o site!"
        );
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao salvar canais."
        );
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setStatusNotice(null);

    if (newPassword.length < 8) {
      setErrorNotice("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorNotice("A confirmação da nova senha não confere.");
      return;
    }

    startTransition(async () => {
      try {
        await changeAdminPasswordAction({
          currentPassword,
          newPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatusNotice("Sua senha administrativa foi alterada com sucesso!");
      } catch (err) {
        setErrorNotice(
          err instanceof Error
            ? err.message
            : "Não foi possível alterar a senha. Verifique a senha atual."
        );
      }
    });
  };

  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-[#E5E1DA]">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
          Canais Diretos &amp; Segurança
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
          Configurações do Estúdio
        </h1>
      </div>

      <div aria-live="polite">
        {statusNotice && (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-950 flex items-center gap-2">
            <Check size={15} className="text-emerald-700" />
            <span>{statusNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
            {errorNotice}
          </div>
        )}
      </div>

      {/* Direct Channels Form */}
      <form
        onSubmit={handleSaveChannels}
        className="bg-white border border-[#E5E1DA] p-6 sm:p-9 space-y-6"
      >
        <div>
          <h2 className="font-serif text-2xl font-light text-[#181716]">
            Links de WhatsApp, E-mail &amp; Instagram
          </h2>
          <p className="text-xs text-[#6B6660] font-light mt-1">
            Esses dados atualizam automaticamente o menu, a seção de contato e o
            rodapé do site.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="cfg-email"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              E-mail Público de Contato
            </label>
            <input
              id="cfg-email"
              type="email"
              required
              autoComplete="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-whatsapp"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              Número do WhatsApp (com DDI, apenas números)
            </label>
            <input
              id="cfg-whatsapp"
              type="tel"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="ex: 33612345678 ou 5511999999999"
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="cfg-insta"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              URL Completa do Instagram
            </label>
            <input
              id="cfg-insta"
              type="url"
              required
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-wamsg"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              Mensagem Automática ao Clicar no WhatsApp
            </label>
            <input
              id="cfg-wamsg"
              type="text"
              required
              value={whatsappDefaultMessage}
              onChange={(e) => setWhatsappDefaultMessage(e.target.value)}
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-6 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Salvar Canais Diretos</span>
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white border border-[#E5E1DA] p-6 sm:p-9 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-light text-[#181716]">
              Alterar Senha de Acesso
            </h2>
            <p className="text-xs text-[#6B6660] font-light mt-1">
              Ao trocar a senha, outros dispositivos conectados serão
              encerrados automaticamente por segurança.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            aria-pressed={showPasswords}
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#6B6660] hover:text-[#181716] cursor-pointer"
          >
            {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPasswords ? "Ocultar" : "Mostrar"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="pwd-current"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              Senha Atual
            </label>
            <input
              id="pwd-current"
              type={showPasswords ? "text" : "password"}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor="pwd-new"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              Nova Senha (mín. 8 caracteres)
            </label>
            <input
              id="pwd-new"
              type={showPasswords ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor="pwd-confirm"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5"
            >
              Confirmar Nova Senha
            </label>
            <input
              id="pwd-confirm"
              type={showPasswords ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 border border-[#181716] text-[#181716] hover:bg-[#181716] hover:text-white px-6 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer disabled:opacity-60"
          >
            <KeyRound size={14} />
            <span>Atualizar Senha</span>
          </button>
        </div>
      </form>
    </div>
  );
}

