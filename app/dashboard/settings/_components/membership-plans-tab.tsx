"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { upsertMembershipPlan } from "@/app/actions/settings/mutations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  hasFixedSeat: boolean;
  description: string | null;
  isActive: boolean;
}

interface MembershipPlansTabProps {
  plans: Plan[];
}

export function MembershipPlansTab({ plans }: MembershipPlansTabProps) {
  const router = useRouter();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = (result: any) => {
    toast.success(result.message);
    setIsDialogOpen(false);
    setEditingPlan(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">پلن‌های عضویت</h3>
          <p className="text-sm text-muted-foreground">
            مدیریت انواع اشتراک‌ها و هزینه‌های سالن
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              پلن جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "ویرایش پلن" : "ایجاد پلن جدید"}</DialogTitle>
              <DialogDescription>
                تغییرات قیمت فقط روی اشتراک‌های جدید اعمال می‌شود.
              </DialogDescription>
            </DialogHeader>
            <ActionForm
              action={upsertMembershipPlan}
              onSuccess={handleSuccess}
              className="space-y-4 pt-4"
            >
              {editingPlan && <input type="hidden" name="planId" value={editingPlan.id} />}
              
              <div className="space-y-2">
                <Label htmlFor="name">نام پلن</Label>
                <Input id="name" name="name" defaultValue={editingPlan?.name} required placeholder="مثلاً: اشتراک طلایی ماهانه" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationDays">مدت (روز)</Label>
                  <Input id="durationDays" name="durationDays" type="number" defaultValue={editingPlan?.durationDays} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">قیمت (ریال)</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingPlan?.price} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات (اختیاری)</Label>
                <Input id="description" name="description" defaultValue={editingPlan?.description || ""} />
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div className="space-y-0.5">
                  <Label>صندلی اختصاصی</Label>
                  <p className="text-xs text-muted-foreground">آیا این پلن شامل صندلی ثابت است؟</p>
                </div>
                <Switch name="hasFixedSeat" defaultChecked={editingPlan?.hasFixedSeat ?? true} />
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div className="space-y-0.5">
                  <Label>وضعیت فعال</Label>
                  <p className="text-xs text-muted-foreground">پلن‌های غیرفعال در لیست ثبت‌نام نمایش داده نمی‌شوند.</p>
                </div>
                <Switch name="isActive" defaultChecked={editingPlan?.isActive ?? true} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                <Button type="submit">{editingPlan ? "بروزرسانی" : "ایجاد پلن"}</Button>
              </div>
            </ActionForm>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام پلن</TableHead>
              <TableHead>مدت</TableHead>
              <TableHead>قیمت</TableHead>
              <TableHead>صندلی ثابت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div>{plan.name}</div>
                  {plan.description && <div className="text-xs text-muted-foreground">{plan.description}</div>}
                </TableCell>
                <TableCell>{plan.durationDays} روز</TableCell>
                <TableCell>{plan.price.toLocaleString("fa-IR")} ریال</TableCell>
                <TableCell>
                  {plan.hasFixedSeat ? (
                    <Badge variant="outline" className="gap-1 text-emerald-600">
                      <Check className="size-3" /> بله
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <X className="size-3" /> خیر
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  هنوز پلن عضویتی تعریف نشده است.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
