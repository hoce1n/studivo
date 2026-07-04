"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CONTRACT_TEMPLATE, 
  ContractContentBlock, 
  ContractSection } from "@/lib/legal/contract-template";
import { Library, Printer } from "lucide-react";

export interface ContractData {
  contractNumber: string;
  contractDate: string;
  customerName: string;
  managerName: string;
  phoneNumber: string;
  subscriptionPlan: string;
  version?: string;
  status?: string;
}

interface ContractViewProps {
  data: ContractData;
}

/**
 * Replaces template placeholders with actual contract data.
 */
function replacePlaceholders(text: string, data: ContractData): string {
  return text
    .replace(/{{contractNumber}}/g, data.contractNumber)
    .replace(/{{contractDate}}/g, data.contractDate)
    .replace(/{{customerName}}/g, data.customerName)
    .replace(/{{managerName}}/g, data.managerName)
    .replace(/{{phoneNumber}}/g, data.phoneNumber)
    .replace(/{{subscriptionPlan}}/g, data.subscriptionPlan);
}

function renderBlock(block: ContractContentBlock, data: ContractData, index: number): React.ReactNode {
  const processedContent = block.content.map(line => replacePlaceholders(line, data));

  if (block.type === "paragraph") {
    return (
      <React.Fragment key={index}>
        {processedContent.map((text, i) => (
          <p key={i} className="mb-2 text-sm leading-relaxed">
            {text}
          </p>
        ))}
      </React.Fragment>
    );
  } else if (block.type === "list") {
    return (
      <ul key={index} className="mb-2 list-disc pe-5 text-sm leading-relaxed">
        {processedContent.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return null;
}

export function ContractView({ data }: ContractViewProps) {
  const version = data.version || "v1.0";
  const status = data.status || "فعال";

  const printFrameRef = React.useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    const frame = printFrameRef.current;
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  return (
    <>
      {/* Hidden iframe that contains only the contract content for printing */}
      <iframe
        ref={printFrameRef}
        title="contract-print-frame"
        style={{ position: "absolute", width: 0, height: 0, border: 0, left: "-9999px", top: "-9999px" }}
        srcDoc={`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.7;
    color: #111;
    direction: rtl;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 20mm;
    margin: 0 auto;
  }
  h1 { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  .subtitle { font-size: 12px; color: #555; text-align: center; margin-bottom: 24px; }
  hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
  p { margin: 0 0 6px; }
  ul { margin: 0 0 6px; padding-right: 20px; }
  li { margin-bottom: 3px; }
  .section { margin-bottom: 20px; page-break-inside: avoid; }
  .signatures { margin-top: 36px; display: flex; justify-content: space-between; gap: 32px; page-break-inside: avoid; }
  .sig-box { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px; }
  .sig-label { font-size: 12px; font-weight: 600; }
  .sig-sub { font-size: 11px; color: #555; margin-bottom: 6px; }
  .sig-fields { font-size: 11px; color: #333; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #888; }
  @page { size: A4; margin: 0; }
  @media print { html, body { width: 210mm; } .page { padding: 15mm 18mm; } }
</style>
</head>
<body>
<div class="page">
  <h1>${CONTRACT_TEMPLATE.title}</h1>
  <p class="subtitle">${CONTRACT_TEMPLATE.subtitle}</p>
  <hr />
  ${CONTRACT_TEMPLATE.sections.map((section: ContractSection) => `
  <div class="section">
    <h2>${replacePlaceholders(section.title, data)}</h2>
    ${section.blocks.map((block) => {
      const lines = block.content.map(l => replacePlaceholders(l, data));
      if (block.type === "list") {
        return `<ul>${lines.map(item => `<li>${item}</li>`).join("")}</ul>`;
      }
      return lines.map(l => `<p>${l}</p>`).join("");
    }).join("")}
  </div>
  `).join("")}
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <p class="sig-label">امضای ارائه‌دهنده خدمات</p>
      <p class="sig-sub">Service Provider Signature</p>
      <div class="sig-fields">
        <p>نام و امضا: _____________________</p>
        <p>تاریخ: _____________________</p>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <p class="sig-label">امضای مشتری</p>
      <p class="sig-sub">Customer Signature</p>
      <div class="sig-fields">
        <p>نام و امضا: _____________________</p>
        <p>تاریخ: _____________________</p>
      </div>
    </div>
  </div>
  <div class="footer">${CONTRACT_TEMPLATE.footer}</div>
</div>
</body>
</html>`}
      />

      <div className="contract-container flex flex-col gap-8 p-6" dir="rtl">
        {/* Print Button */}
        <div className="contract-no-print flex justify-end">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            چاپ قرارداد
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Library className="h-8 w-8 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">
            {CONTRACT_TEMPLATE.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {CONTRACT_TEMPLATE.subtitle}
          </p>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="contract-no-print flex justify-between text-xs text-muted-foreground">
          <div>
            <span className="font-semibold">نسخه:</span> {version}
          </div>
          <div>
            <span className="font-semibold">وضعیت:</span> {status}
          </div>
        </div>

        {/* Contract Information Card */}
        <Card className="contract-no-print w-full">
          <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">شماره قرارداد</p>
              <p className="font-medium text-foreground">
                {data.contractNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاریخ انعقاد</p>
              <p className="font-medium text-foreground">
                {data.contractDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">نام سالن</p>
              <p className="font-medium text-foreground">
                {data.customerName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مدیر</p>
              <p className="font-medium text-foreground">
                {data.managerName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">شماره تماس</p>
              <p className="font-medium text-foreground">
                {data.phoneNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">پلن</p>
              <p className="font-medium text-foreground">
                {data.subscriptionPlan}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contract Sections */}
        <div className="contract-content space-y-8">
          {CONTRACT_TEMPLATE.sections.map((section: ContractSection, sectionIndex: number) => (
            <React.Fragment key={sectionIndex}>
              <div className="contract-section space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  {replacePlaceholders(section.title, data)}
                </h2>
                <div className="space-y-3">
                  {section.blocks.map((block, blockIndex) =>
                    renderBlock(block, data, blockIndex)
                  )}
                </div>
              </div>
              {sectionIndex < CONTRACT_TEMPLATE.sections.length - 1 && (
                <Separator className="my-8" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Signature Section */}
        <div className="contract-signature-section mt-12">
          <Separator className="mb-8" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Service Provider Signature */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="contract-signature-line w-full" />
              <div className="contract-signature-label">
                <p className="font-semibold">امضای ارائه‌دهنده خدمات</p>
                <p className="text-xs text-muted-foreground">Service Provider Signature</p>
              </div>
              <div className="contract-signature-label">
                <p className="text-xs">نام و امضا: _____________________</p>
                <p className="text-xs">تاریخ: _____________________</p>
              </div>
            </div>

            {/* Customer Signature */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="contract-signature-line w-full" />
              <div className="contract-signature-label">
                <p className="font-semibold">امضای مشتری</p>
                <p className="text-xs text-muted-foreground">Customer Signature</p>
              </div>
              <div className="contract-signature-label">
                <p className="text-xs">نام و امضا: _____________________</p>
                <p className="text-xs">تاریخ: _____________________</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>{CONTRACT_TEMPLATE.footer}</p>
        </div>
      </div>
    </>
  );
}
