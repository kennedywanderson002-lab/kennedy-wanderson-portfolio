"use client";

import React from "react";
import type { BillingDocumentConfig, BillingLineItem } from "@/db/schema";
import {
  calculateBillingTotals,
  formatCurrencyFR,
  type BillingDocType,
} from "@/lib/cms/billing";

export type BillingEditorZone =
  | "identity"
  | "emitter"
  | "client"
  | "event"
  | "items"
  | "totals"
  | "payment"
  | "signatures"
  | "footer";

interface BillingA4DocumentSheetProps {
  docType: BillingDocType;
  docNumber: string;
  clientName: string;
  items: BillingLineItem[];
  discountAmount: number;
  taxRate: number;
  fixedDepositAmount?: number;
  config: BillingDocumentConfig;
  activeZone?: BillingEditorZone;
  onSelectZone?: (zone: BillingEditorZone) => void;
  printMode?: boolean;
}

export function BillingA4DocumentSheet({
  docType,
  docNumber,
  clientName,
  items,
  discountAmount,
  taxRate,
  fixedDepositAmount,
  config,
  activeZone,
  onSelectZone,
  printMode = false,
}: BillingA4DocumentSheetProps) {
  const isDevis = docType === "devis";
  const currency = config.currencySymbol || "€";
  const totals = calculateBillingTotals(
    items,
    discountAmount,
    taxRate,
    config,
    fixedDepositAmount
  );

  const zoneInteractiveClass = (zone: BillingEditorZone) => {
    if (printMode || !onSelectZone) return "";
    const isActive = activeZone === zone;
    return `cursor-pointer transition-all rounded-xs ${
      isActive
        ? "ring-1 ring-[#9E8765] bg-[#FAF9F6]/60"
        : "hover:ring-1 hover:ring-[#9E8765]/50"
    }`;
  };

  const handleZoneClick = (
    e: React.MouseEvent,
    zone: BillingEditorZone
  ) => {
    if (printMode || !onSelectZone) return;
    e.stopPropagation();
    onSelectZone(zone);
  };

  return (
    <section
      className={`billing-a4-sheet bg-white text-[#181716] relative flex flex-col justify-between mx-auto select-text ${
        printMode
          ? "w-[210mm] h-[297mm] p-[12mm_16mm_10mm_16mm] shadow-none overflow-hidden"
          : "w-[794px] h-[1123px] p-[45px_60px_38px_60px] shadow-[0_20px_60px_rgba(24,23,22,0.16)] border border-[#E5E1DA] overflow-hidden"
      }`}
      style={{
        fontFamily: "var(--font-sans), Plus Jakarta Sans, sans-serif",
      }}
    >
      {/* Top Decorative Fine Art Hairline */}
      <div
        className="absolute top-0 left-[16mm] right-[16mm] h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #181716 0%, #9E8765 50%, #181716 100%)",
        }}
      />

      <div>
        {/* 1 & 2. HEADER: Brand Block + Document Type Badge */}
        <header className="flex justify-between items-start pb-[4.5mm] border-b border-[#E5E1DA] gap-4">
          <div
            onClick={(e) => handleZoneClick(e, "emitter")}
            title={
              !printMode ? "Clique para editar o Cabeçalho & Emissor" : undefined
            }
            className={`p-1 -m-1 ${zoneInteractiveClass("emitter")}`}
          >
            {config.atelierTag && (
              <p className="text-[7pt] uppercase tracking-[0.34em] text-[#9E8765] font-medium mb-[3px]">
                {config.atelierTag}
              </p>
            )}
            <h1
              className="text-[21pt] font-light tracking-[0.16em] uppercase text-[#181716] leading-[1.05]"
              style={{
                fontFamily: "var(--font-serif), Cormorant Garamond, Georgia, serif",
              }}
            >
              {config.brandName || "Kennedy Wanderson"}
            </h1>
            {config.brandSubtitle && (
              <p className="text-[6.5pt] uppercase tracking-[0.32em] text-[#8C867E] mt-[4px]">
                {config.brandSubtitle}
              </p>
            )}
          </div>

          <div
            onClick={(e) => handleZoneClick(e, "identity")}
            title={
              !printMode
                ? "Clique para editar o Tipo, Número e Status"
                : undefined
            }
            className={`text-right shrink-0 p-1 -m-1 ${zoneInteractiveClass(
              "identity"
            )}`}
          >
            <span
              className={`inline-block px-[11px] py-[3.5px] text-white text-[7.5pt] uppercase tracking-[0.28em] font-medium mb-[4px] ${
                isDevis ? "bg-[#9E8765]" : "bg-[#181716]"
              }`}
            >
              {config.docBadgeLabel ||
                (isDevis ? "Devis / Proposition" : "Facture")}
            </span>
            <p
              className="text-[15pt] italic text-[#181716] font-normal whitespace-nowrap"
              style={{
                fontFamily: "var(--font-serif), Cormorant Garamond, Georgia, serif",
              }}
            >
              {config.docNumberPrefix ?? "N° "}
              {docNumber}
            </p>
            {config.docStatusBadge && (
              <span className="inline-block mt-[3px] text-[6.5pt] uppercase tracking-[0.16em] px-[8px] py-[2px] border border-[#9E8765] text-[#9E8765] bg-[#F6F3EE] whitespace-nowrap">
                {config.docStatusBadge}
              </span>
            )}
          </div>
        </header>

        {/* 3 & 4. PARTIES GRID: Prestataire / Émetteur & Client */}
        <div className="grid grid-cols-2 gap-[8mm] py-[4.5mm] border-b border-[#E5E1DA]">
          <div
            onClick={(e) => handleZoneClick(e, "emitter")}
            title={
              !printMode ? "Clique para editar os Dados do Fotógrafo" : undefined
            }
            className={`text-[8pt] leading-[1.5] text-[#5E5952] p-1 -m-1 ${zoneInteractiveClass(
              "emitter"
            )}`}
          >
            <p className="text-[6.5pt] uppercase tracking-[0.26em] text-[#9E8765] font-semibold mb-[3px]">
              {config.emitterSectionLabel || "Prestataire / Émetteur"}
            </p>
            <p
              className="text-[12.5pt] font-medium text-[#181716] mb-[2px]"
              style={{
                fontFamily: "var(--font-serif), Cormorant Garamond, Georgia, serif",
              }}
            >
              {config.emitterName}
            </p>
            {config.emitterRole && <p>{config.emitterRole}</p>}
            {config.emitterLocation && <p>{config.emitterLocation}</p>}
            {config.emitterEmail && <p>{config.emitterEmail}</p>}
            {config.emitterWebsite && <p>{config.emitterWebsite}</p>}
            {config.emitterPhone && <p>{config.emitterPhone}</p>}
            {config.emitterLegalLine && (
              <p className="text-[7pt] text-[#8C867E] mt-[3px]">
                {config.emitterLegalLine}
              </p>
            )}
          </div>

          <div
            onClick={(e) => handleZoneClick(e, "client")}
            title={
              !printMode ? "Clique para editar os Dados do Cliente" : undefined
            }
            className={`text-[8pt] leading-[1.5] text-[#5E5952] bg-[#FAF9F6] border border-[#E5E1DA] p-[3.5mm_4.5mm] ${zoneInteractiveClass(
              "client"
            )}`}
          >
            <p className="text-[6.5pt] uppercase tracking-[0.26em] text-[#9E8765] font-semibold mb-[3px]">
              {config.clientSectionLabel || "Facturé à / Client"}
            </p>
            <p
              className="text-[12.5pt] font-medium text-[#181716] mb-[2px]"
              style={{
                fontFamily: "var(--font-serif), Cormorant Garamond, Georgia, serif",
              }}
            >
              {clientName || "Nom des Mariés / Client"}
            </p>
            {config.clientAddressLine1 && <p>{config.clientAddressLine1}</p>}
            {config.clientAddressLine2 && <p>{config.clientAddressLine2}</p>}
            {config.clientEmailLine && (
              <p className="mt-[3px]">{config.clientEmailLine}</p>
            )}
            {config.clientPhoneLine && <p>{config.clientPhoneLine}</p>}
            {config.clientExtraLine && (
              <p className="text-[7.5pt] text-[#8C867E] mt-[2px]">
                {config.clientExtraLine}
              </p>
            )}
          </div>
        </div>

        {/* 5. EVENT & DATES STRIP (4 Columns) */}
        <div
          onClick={(e) => handleZoneClick(e, "event")}
          title={
            !printMode
              ? "Clique para editar as 4 colunas da Faixa do Evento"
              : undefined
          }
          className={`grid grid-cols-4 gap-[4mm] p-[3.2mm_4.5mm] bg-[#FAF9F6] border-b border-[#E5E1DA] mb-[4.5mm] ${zoneInteractiveClass(
            "event"
          )}`}
        >
          <div>
            <p className="text-[6.2pt] uppercase tracking-[0.2em] text-[#8C867E] mb-[2px]">
              {config.metaCol1Label}
            </p>
            <p className="text-[8pt] font-medium text-[#181716]">
              {config.metaCol1Value || "—"}
            </p>
          </div>
          <div>
            <p className="text-[6.2pt] uppercase tracking-[0.2em] text-[#8C867E] mb-[2px]">
              {config.metaCol2Label}
            </p>
            <p className="text-[8pt] font-medium text-[#181716]">
              {config.metaCol2Value || "—"}
            </p>
          </div>
          <div>
            <p className="text-[6.2pt] uppercase tracking-[0.2em] text-[#8C867E] mb-[2px]">
              {config.metaCol3Label}
            </p>
            <p className="text-[8pt] font-medium text-[#181716]">
              {config.metaCol3Value || "—"}
            </p>
          </div>
          <div>
            <p className="text-[6.2pt] uppercase tracking-[0.2em] text-[#8C867E] mb-[2px]">
              {config.metaCol4Label}
            </p>
            <p className="text-[8pt] font-medium text-[#181716]">
              {config.metaCol4Value || "—"}
            </p>
          </div>
        </div>

        {/* 6. LINE ITEMS TABLE */}
        <div
          onClick={(e) => handleZoneClick(e, "items")}
          title={
            !printMode
              ? "Clique para editar os Serviços e Prestações"
              : undefined
          }
          className={`mb-[4.5mm] ${zoneInteractiveClass("items")}`}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  style={{ width: "56%" }}
                  className="text-left text-[6.8pt] uppercase tracking-[0.22em] text-[#5E5952] p-[2.2mm_2mm] border-b-[1.5px] border-[#181716] font-semibold"
                >
                  {config.tableColDesignation}
                </th>
                <th
                  style={{ width: "12%" }}
                  className="text-center text-[6.8pt] uppercase tracking-[0.22em] text-[#5E5952] p-[2.2mm_2mm] border-b-[1.5px] border-[#181716] font-semibold whitespace-nowrap"
                >
                  {config.tableColQty}
                </th>
                <th
                  style={{ width: "16%" }}
                  className="text-right text-[6.8pt] uppercase tracking-[0.22em] text-[#5E5952] p-[2.2mm_2mm] border-b-[1.5px] border-[#181716] font-semibold whitespace-nowrap"
                >
                  {config.tableColUnitPrice}
                </th>
                <th
                  style={{ width: "16%" }}
                  className="text-right text-[6.8pt] uppercase tracking-[0.22em] text-[#5E5952] p-[2.2mm_2mm] border-b-[1.5px] border-[#181716] font-semibold whitespace-nowrap"
                >
                  {config.tableColTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const lineTotal =
                  (Number.isFinite(item.quantity) ? item.quantity : 1) *
                  (Number.isFinite(item.unitPrice) ? item.unitPrice : 0);
                return (
                  <tr key={item.id} className="border-b border-[#E5E1DA]">
                    <td className="p-[2.8mm_2mm] align-top">
                      <p
                        className="text-[11pt] font-medium text-[#181716] mb-[2px]"
                        style={{
                          fontFamily:
                            "var(--font-serif), Cormorant Garamond, Georgia, serif",
                        }}
                      >
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[7.4pt] text-[#5E5952] leading-[1.42] font-light whitespace-pre-line">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="p-[2.8mm_2mm] align-top text-center text-[8pt] text-[#181716] whitespace-nowrap">
                      {item.quantityLabel || String(item.quantity)}
                    </td>
                    <td className="p-[2.8mm_2mm] align-top text-right text-[8pt] text-[#181716] whitespace-nowrap">
                      {formatCurrencyFR(item.unitPrice, currency)}
                    </td>
                    <td className="p-[2.8mm_2mm] align-top text-right text-[8pt] text-[#181716] whitespace-nowrap">
                      {formatCurrencyFR(lineTotal, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 7 & 8. PAYMENT BOX & TOTALS SUMMARY GRID */}
        <div className="grid grid-cols-[1.12fr_0.88fr] gap-[6mm] items-start mt-[1mm]">
          {/* Left: Payment & Bank Box */}
          <div
            onClick={(e) => handleZoneClick(e, "payment")}
            title={
              !printMode
                ? "Clique para editar os Dados Bancários SEPA & Condições"
                : undefined
            }
            className={`border border-[#E5E1DA] bg-[#FAF9F6] p-[3.5mm_4.5mm] text-[7.6pt] leading-[1.48] text-[#5E5952] ${zoneInteractiveClass(
              "payment"
            )}`}
          >
            <p className="text-[6.8pt] uppercase tracking-[0.22em] text-[#181716] font-semibold mb-[5px] pb-[3px] border-b border-[#E5E1DA]">
              {config.paymentBoxTitle}
            </p>
            {config.paymentIntroText && (
              <p className="whitespace-pre-line">{config.paymentIntroText}</p>
            )}

            {config.showBankDetails && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-[10px] gap-y-[2px] mt-[4px] text-[7.4pt]">
                {config.bankHolder && (
                  <>
                    <dt className="text-[#8C867E] uppercase text-[6.5pt] tracking-[0.14em]">
                      {config.bankLabelHolder || "Titulaire"}
                    </dt>
                    <dd className="font-mono text-[#181716] text-[7.4pt]">
                      {config.bankHolder}
                    </dd>
                  </>
                )}
                {config.bankName && (
                  <>
                    <dt className="text-[#8C867E] uppercase text-[6.5pt] tracking-[0.14em]">
                      {config.bankLabelBank || "Banque"}
                    </dt>
                    <dd className="font-mono text-[#181716] text-[7.4pt]">
                      {config.bankName}
                    </dd>
                  </>
                )}
                {config.bankIban && (
                  <>
                    <dt className="text-[#8C867E] uppercase text-[6.5pt] tracking-[0.14em]">
                      {config.bankLabelIban || "IBAN"}
                    </dt>
                    <dd className="font-mono text-[#181716] text-[7.4pt]">
                      {config.bankIban}
                    </dd>
                  </>
                )}
                {config.bankBic && (
                  <>
                    <dt className="text-[#8C867E] uppercase text-[6.5pt] tracking-[0.14em]">
                      {config.bankLabelBic || "BIC / SWIFT"}
                    </dt>
                    <dd className="font-mono text-[#181716] text-[7.4pt]">
                      {config.bankBic}
                    </dd>
                  </>
                )}
              </dl>
            )}

            {config.paymentConditionsText && (
              <p className="mt-[5px] text-[7pt] text-[#8C867E] whitespace-pre-line">
                {config.paymentConditionsText}
              </p>
            )}
          </div>

          {/* Right: Totals Box */}
          <div
            onClick={(e) => handleZoneClick(e, "totals")}
            title={
              !printMode
                ? "Clique para editar os Totais, TVA, Sinal (Acompte) e Saldo"
                : undefined
            }
            className={zoneInteractiveClass("totals")}
          >
            <div className="border border-[#E5E1DA] p-[3.5mm_4.5mm] bg-white">
              <div className="flex justify-between items-center gap-2 py-[1.5mm] text-[8pt] text-[#5E5952] border-b border-[#F2EFE9]">
                <span>{config.subtotalLabel}</span>
                <span className="whitespace-nowrap shrink-0">
                  {formatCurrencyFR(totals.subtotal, currency)}
                </span>
              </div>

              {config.showDiscount && totals.discountAmount > 0 && (
                <div className="flex justify-between items-center gap-2 py-[1.5mm] text-[8pt] text-[#9E8765] border-b border-[#F2EFE9]">
                  <span>{config.discountLabel}</span>
                  <span className="whitespace-nowrap shrink-0">
                    - {formatCurrencyFR(totals.discountAmount, currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center gap-2 py-[1.5mm] text-[8pt] text-[#5E5952] border-b border-[#F2EFE9]">
                <span>{config.taxLabel}</span>
                <span className="whitespace-nowrap shrink-0">
                  {formatCurrencyFR(totals.taxAmount, currency)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 pt-[2.5mm] mt-[1mm] border-t-[1.5px] border-[#181716] text-[#181716]">
                <span className="text-[7.5pt] uppercase tracking-[0.2em] font-semibold">
                  {config.grandTotalLabel}
                </span>
                <span
                  className="text-[15pt] font-semibold text-[#181716] whitespace-nowrap shrink-0"
                  style={{
                    fontFamily:
                      "var(--font-serif), Cormorant Garamond, Georgia, serif",
                  }}
                >
                  {formatCurrencyFR(totals.totalAmount, currency)}
                </span>
              </div>

              {config.showDeposit && (
                <div className="flex justify-between items-center gap-2 mt-[2mm] p-[2mm_2.5mm] bg-[#F6F3EE] border border-[#E2D9C8] text-[#181716] text-[7.6pt]">
                  <span>{config.depositLabel}</span>
                  <strong className="whitespace-nowrap shrink-0">
                    {config.deductDepositFromTotal ? "- " : ""}
                    {formatCurrencyFR(totals.depositAmount, currency)}
                  </strong>
                </div>
              )}

              {config.showBalanceDue && (
                <div className="flex justify-between items-center gap-2 pt-[2.5mm] font-semibold text-[#181716] text-[8pt]">
                  <span>{config.balanceDueLabel}</span>
                  <span
                    className="text-[13pt] whitespace-nowrap shrink-0"
                    style={{
                      fontFamily:
                        "var(--font-serif), Cormorant Garamond, Georgia, serif",
                    }}
                  >
                    {formatCurrencyFR(totals.balanceDue, currency)}
                  </span>
                </div>
              )}
            </div>

            {config.taxNoticeText && (
              <p className="text-[6.8pt] italic text-[#8C867E] text-right mt-[1.5mm]">
                {config.taxNoticeText}
              </p>
            )}
          </div>
        </div>

        {/* 9. SIGNATURE BLOCK (Optional — enabled by default on Devis) */}
        {config.showSignatures && (
          <div
            onClick={(e) => handleZoneClick(e, "signatures")}
            title={
              !printMode
                ? "Clique para editar o Quadro de Assinaturas (Bon pour Accord)"
                : undefined
            }
            className={`grid grid-cols-2 gap-[6mm] mt-[3.5mm] pt-[3mm] border-t border-dashed border-[#E5E1DA] ${zoneInteractiveClass(
              "signatures"
            )}`}
          >
            <div className="border border-[#E5E1DA] p-[2.8mm_4mm] min-h-[18mm] flex flex-col justify-between">
              <div>
                <p className="text-[6.5pt] uppercase tracking-[0.2em] text-[#9E8765] font-semibold">
                  {config.photographerSigTitle}
                </p>
                {config.photographerSigSubtitle && (
                  <p className="text-[6.8pt] text-[#8C867E] mt-[1px]">
                    {config.photographerSigSubtitle}
                  </p>
                )}
              </div>
              <p
                className="italic text-[13pt] text-[#181716] mt-[2mm]"
                style={{
                  fontFamily:
                    "var(--font-serif), Cormorant Garamond, Georgia, serif",
                }}
              >
                {config.photographerSigName}
              </p>
            </div>

            <div className="border border-[#E5E1DA] p-[2.8mm_4mm] min-h-[18mm] flex flex-col justify-between">
              <div>
                <p className="text-[6.5pt] uppercase tracking-[0.2em] text-[#9E8765] font-semibold">
                  {config.clientSigTitle}
                </p>
                {config.clientSigSubtitle && (
                  <p className="text-[6.8pt] text-[#8C867E] mt-[1px]">
                    {config.clientSigSubtitle}
                  </p>
                )}
              </div>
              <p className="text-[7.2pt] text-[#8C867E] mt-[2mm]">
                {config.clientSigDatePrompt}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 10. LEGAL FOOTER */}
      <footer
        onClick={(e) => handleZoneClick(e, "footer")}
        title={!printMode ? "Clique para editar o Rodapé Legal" : undefined}
        className={`pt-[2.5mm] border-t border-[#E5E1DA] text-center text-[6.4pt] text-[#8C867E] leading-[1.45] ${zoneInteractiveClass(
          "footer"
        )}`}
      >
        {config.footerLine1 && (
          <p className="font-medium text-[#5E5952]">{config.footerLine1}</p>
        )}
        {config.footerLine2 && <p>{config.footerLine2}</p>}
      </footer>
    </section>
  );
}

