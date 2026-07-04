"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { CONTRACT_TEMPLATE } from "@/lib/legal/contract-template";
import type { VenueDetail } from "@/app/actions/platform";

interface ContractViewProps {
  venue: VenueDetail;
}

/**
 * Replaces template placeholders with actual venue data.
 * Returns formatted contract content as plain text (not HTML).
 */
function renderContract(venue: VenueDetail): string {
  const today = new Date();
  const contractDate = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "long",
  }).format(today);

  // Determine subscription plan from monthly fee
  // This is a simple heuristic based on the pricing page
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

  // Generate a simple contract number based on venue ID and date
  const contractNumber = `STD-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${venue.id.slice(0, 8).toUpperCase()}`;

  // Get manager name from the linked lead if available
  const managerName = venue.lead?.name || "Study Hall Manager";

  // Get phone number from the linked lead if available
  const phoneNumber = venue.lead?.phone || "Not provided";

  return CONTRACT_TEMPLATE.replace(/{{contractNumber}}/g, contractNumber)
    .replace(/{{contractDate}}/g, contractDate)
    .replace(/{{customerName}}/g, venue.name)
    .replace(/{{managerName}}/g, managerName)
    .replace(/{{phoneNumber}}/g, phoneNumber)
    .replace(/{{subscriptionPlan}}/g, subscriptionPlan);
}

/**
 * Parses the contract text and renders it with proper formatting.
 * Handles markdown-like headers and sections.
 */
function ContractContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={elements.length} className="text-sm leading-relaxed">
            {currentParagraph.join(" ")}
          </p>
        );
        currentParagraph = [];
      }
      continue;
    }

    // Handle headers (#, ## and ###)
    if (trimmed.startsWith("#")) {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={elements.length} className="text-sm leading-relaxed">
            {currentParagraph.join(" ")}
          </p>
        );
        currentParagraph = [];
      }

      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const headerText = trimmed.replace(/^#+\s*/, "");

      if (level === 1) {
        elements.push(
          <h1
            key={elements.length}
            className="mt-8 mb-6 text-2xl font-bold text-foreground text-center"
          >
            {headerText}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={elements.length}
            className="mt-6 mb-4 text-lg font-bold text-foreground"
          >
            {headerText}
          </h2>
        );
      } else {
        elements.push(
          <h3
            key={elements.length}
            className="mt-4 mb-2 text-base font-semibold text-foreground"
          >
            {headerText}
          </h3>
        );
      }
      continue;
    }

    // Handle bullet points
    if (trimmed.startsWith("*")) {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={elements.length} className="text-sm leading-relaxed">
            {currentParagraph.join(" ")}
          </p>
        );
        currentParagraph = [];
      }

      const bulletText = trimmed.replace(/^\*\s*/, "");
      elements.push(
        <li key={elements.length} className="ms-4 text-sm leading-relaxed">
          {bulletText}
        </li>
      );
      continue;
    }

    // Accumulate regular text
    currentParagraph.push(trimmed);
  }

  // Add any remaining paragraph
  if (currentParagraph.length > 0) {
    elements.push(
      <p key={elements.length} className="text-sm leading-relaxed">
        {currentParagraph.join(" ")}
      </p>
    );
  }

  return <>{elements}</>;
}

export function ContractView({ venue }: ContractViewProps) {
  const contractContent = React.useMemo(() => renderContract(venue), [venue]);

  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* Contract Content */}
      <div className="prose prose-sm max-w-none space-y-4 text-foreground text-right">
        <ContractContent content={contractContent} />
      </div>

      <Separator className="mt-6" />

      {/* Footer */}
      <div className="flex flex-col gap-2 text-xs text-muted-foreground text-center">
        <p>
          این قرارداد به‌صورت سیستمی تولید شده و بر اساس اطلاعات ثبت‌شده در سامانه استادیو تنظیم شده است.
        </p>
      </div>
    </div>
  );
}
