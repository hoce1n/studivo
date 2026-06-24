import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";

const plans = [
  {
    name: "پایه",
    price: 0,
    description:
      "برای سالن‌های کوچک و شروع کار.",
    features: [
      "تا ۱۵ صندلی",
      "نقشه زنده صندلی‌ها",
      "مدیریت اعضا",
      "هشدار تمدید شهریه",
    ],
    buttonText: "شروع رایگان",
  },
  {
    name: "حرفه‌ای",
    price: "۸۹۰٬۰۰۰",
    isRecommended: true,
    description:
      "برای سالن‌های فعال با چند همکار.",
    features: [
      "صندلی نامحدود بدون افزایش هزینه به ازای هر صندلی",
      "مدیریت کارکنان و سطح دسترسی",
      "گزارش مالی و درآمد",
      "آماده اتصال به پیامک یادآوری تمدید",
      "پشتیبانی اولویت‌دار",
    ],
    buttonText: "انتخاب پلن حرفه‌ای",
    isPopular: true,
  },
  {
    name: "ویژه",
    price: "تماس بگیرید",
    description:
      "برای مجموعه‌های چندشعبه‌ای.",
    features: [
      "چند شعبه",
      "داشبورد یکپارچه",
      "API اختصاصی",
      "مدیر حساب اختصاصی",
    ],
    buttonText: "گفتگو با تیم فروش",
  },
];

const Pricing = () => {
  return (
    <div
      id="pricing"
      className="max-w-(--breakpoint-lg) mx-auto py-12 xs:py-20 px-6"
    >
      <h1 className="text-4xl xs:text-5xl font-semibold text-center tracking-tight">
        تعرفه شفاف برای شروع مطمئن
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center leading-8 text-muted-foreground">پلن پایه برای سالن‌های کوچک تا ۱۵ صندلی رایگان است. پلن حرفه‌ای با مبلغ ۸۹۰٬۰۰۰ تومان به‌صورت ماهانه فعال می‌شود و برای سالن‌های دارای ظرفیت بالا یا چند شیفت مناسب است.</p>
      <div className="mt-8 xs:mt-14 grid grid-cols-1 lg:grid-cols-3 items-center gap-8 lg:gap-0">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative bg-accent/50 border p-7 rounded-xl lg:rounded-none lg:first:rounded-l-xl lg:last:rounded-r-xl",
              {
                "bg-background border-[2px] border-primary py-12 rounded-xl!":
                  plan.isPopular,
              }
            )}
          >
            {plan.isPopular && (
              <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                محبوب‌ترین
              </Badge>
            )}
            <h3 className="text-lg font-medium">{plan.name}</h3>
            <p className="mt-2 text-4xl font-bold">
              {plan.price} 
              <span className="text-xs  font-light mr-1">
                {plan.name === "پایه" ? "همیشه رایگان تا ۱۵ صندلی" : plan.name === "ویژه" ? "متناسب با نیاز شما" : "تومان / ماه"}
              </span>
            </p>
            <p className="mt-4 font-medium text-muted-foreground">
              {plan.description}
            </p>
            <Separator className="my-6" />
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CircleCheck className="h-4 w-4 mt-1 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.isPopular ? "default" : "outline"}
              size="lg"
              className="w-full mt-6 rounded-full"
            >
              {plan.buttonText}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;