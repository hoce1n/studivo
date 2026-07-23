"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffListTab } from "./staff-list-tab";
import { ShiftListTab } from "./shift-list-tab";
import { Users, Clock } from "lucide-react";

interface StaffTabsProps {
  staff: any[];
  shifts: any[];
  isOwner: boolean;
  currentStaffId?: string;
}

export function StaffTabs({ staff, shifts, isOwner, currentStaffId }: StaffTabsProps) {
  return (
    <Tabs defaultValue="list" className="space-y-6" dir="rtl">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
        <TabsTrigger value="list" className="gap-2">
          <Users className="size-4" />
          لیست همکاران
        </TabsTrigger>
        <TabsTrigger value="shifts" className="gap-2">
          <Clock className="size-4" />
          شیفت‌ها
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="list">
        <StaffListTab staff={staff} isOwner={isOwner} />
      </TabsContent>
      
      <TabsContent value="shifts">
        <ShiftListTab 
          shifts={shifts} 
          staffAssignments={staff.filter(s => s.isActive)} 
          isOwner={isOwner}
          currentStaffId={currentStaffId}
        />
      </TabsContent>
    </Tabs>
  );
}
