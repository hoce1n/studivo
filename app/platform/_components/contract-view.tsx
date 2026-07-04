"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CONTRACT_TEMPLATE, 
  ContractContentBlock, 
  ContractSection } from "@/lib/legal/contract-template";
import { Library } from "lucide-react";

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

  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .contract-no-print {
            display: none !important;
          }
          .contract-container {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          .contract-content {
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid;
          }
          .contract-section {
            page-break-inside: avoid;
          }
          .contract-signature-section {
            margin-top: 2rem;
            page-break-inside: avoid;
          }
          .contract-signature-line {
            border-bottom: 1px solid #000;
            height: 3rem;
            margin-bottom: 0.5rem;
          }
          .contract-signature-label {
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }
        }
      `}</style>

      <div className="contract-container flex flex-col gap-8 p-6" dir="rtl">
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
