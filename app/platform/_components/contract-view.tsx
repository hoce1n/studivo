"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { CONTRACT_TEMPLATE, ContractContentBlock, ContractSection } from "@/lib/legal/contract-template";
import type { VenueDetail } from "@/app/actions/platform";
import { Logo } from "@/app/(marketing)/_components/navbar/logo";

interface ContractViewProps {
  venue: VenueDetail;
}

/**
 * Replaces template placeholders with actual venue data.
 */
function replacePlaceholders(text: string, venue: VenueDetail): string {
  const today = new Date();
  const contractDate = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "long",
  }).format(today);

  let subscriptionPlan = "Custom Plan";
  if (venue.monthlyFee === 0) {
    subscriptionPlan = "Free Trial";
  } else if (venue.monthlyFee <= 890000) {
    subscriptionPlan = "پایه (Basic)";
  } else if (venue.monthlyFee <= 1490000) {
    subscriptionPlan = "حرفه‌ای (Professional)";
  } else {
    subscriptionPlan = "ویژه (Premium)";
  }

  const contractNumber = `STD-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${venue.id.slice(0, 8).toUpperCase()}`;
  const managerName = venue.lead?.name || "مدیر سالن مطالعه";
  const phoneNumber = venue.lead?.phone || "ثبت نشده";

  return text
    .replace(/{{contractNumber}}/g, contractNumber)
    .replace(/{{contractDate}}/g, contractDate)
    .replace(/{{customerName}}/g, venue.name)
    .replace(/{{managerName}}/g, managerName)
    .replace(/{{phoneNumber}}/g, phoneNumber)
    .replace(/{{subscriptionPlan}}/g, subscriptionPlan);
}

function renderBlock(block: ContractContentBlock, venue: VenueDetail, index: number): React.ReactNode {
  const processedContent = block.content.map(line => replacePlaceholders(line, venue));

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
          <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ul>
    );
  }
  return null;
}

export function ContractView({ venue }: ContractViewProps) {
  const contractInfo = React.useMemo(() => {
    const today = new Date();
    const contractDate = new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "long",
    }).format(today);

    let subscriptionPlan = "Custom Plan";
    if (venue.monthlyFee === 0) {
      subscriptionPlan = "Free Trial";
    } else if (venue.monthlyFee <= 890000) {
      subscriptionPlan = "پایه (Basic)";
    } else if (venue.monthlyFee <= 1490000) {
      subscriptionPlan = "حرفه‌ای (Professional)";
    } else {
      subscriptionPlan = "ویژه (Premium)";
    }

    const contractNumber = `STD-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${venue.id.slice(0, 8).toUpperCase()}`;
    const managerName = venue.lead?.name || "مدیر سالن مطالعه";
    const phoneNumber = venue.lead?.phone || "ثبت نشده";

    return {
      contractNumber,
      contractDate,
      customerName: venue.name,
      managerName,
      phoneNumber,
      subscriptionPlan,
    };
  }, [venue]);

  return (
    <div className="flex flex-col gap-8 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo />
        <h1 className="text-2xl font-bold text-foreground">
          {CONTRACT_TEMPLATE.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {CONTRACT_TEMPLATE.subtitle}
        </p>
      </div>

      <Separator />

      {/* Contract Information Card */}
      <Card className="w-full">
        <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">شماره قرارداد</p>
            <p className="font-medium text-foreground">
              {contractInfo.contractNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">تاریخ انعقاد</p>
            <p className="font-medium text-foreground">
              {contractInfo.contractDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">نام سالن</p>
            <p className="font-medium text-foreground">
              {contractInfo.customerName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">مدیر</p>
            <p className="font-medium text-foreground">
              {contractInfo.managerName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">شماره تماس</p>
            <p className="font-medium text-foreground">
              {contractInfo.phoneNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">پلن</p>
            <p className="font-medium text-foreground">
              {contractInfo.subscriptionPlan}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contract Sections */}
      <div className="space-y-8">
        {CONTRACT_TEMPLATE.sections.map((section: ContractSection, sectionIndex: number) => (
          <React.Fragment key={sectionIndex}>
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                {replacePlaceholders(section.title, venue)}
              </h2>
              <div className="space-y-3">
                {section.blocks.map((block, blockIndex) =>
                  renderBlock(block, venue, blockIndex)
                )}
              </div>
            </div>
            {sectionIndex < CONTRACT_TEMPLATE.sections.length - 1 && (
              <Separator className="my-8" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>{CONTRACT_TEMPLATE.footer}</p>
      </div>
    </div>
  );
}
