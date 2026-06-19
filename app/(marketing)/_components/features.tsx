import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BookCheck,
  ChartPie,
  FolderSync,
  Goal,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Goal,
    title: "نقشه زنده صندلی‌ها",
    description:
      "چیدمان واقعی سالن را به‌صورت تصویری ببینید و در لحظه بدانید کدام صندلی آزاد، رزروشده، نزدیک تمدید یا منقضی است؛ بدون تماس‌های تکراری و دفترهای شلوغ.",
    imgUrl: "live-seat-map.png"
  },
  {
    icon: BookCheck,
    title: "مدیریت هوشمند اشتراک",
    description:
      "ثبت‌نام، تمدید، آزادسازی و جابه‌جایی صندلی با کنترل خودکار تداخل انجام می‌شود؛ هیچ عضو فعالی ناخواسته روی دو صندلی یا یک صندلی مشترک ثبت نمی‌شود.",
    imgUrl: "smart-subscription-management.png"
  },
  {
    icon: Users,
    title: "دسترسی نقش‌محور",
    description:
      "مدیر تصویر کامل سالن، درآمد و کارکنان را می‌بیند؛ پرسنل فقط عملیات روزمره مثل رزرو، تمدید و پیگیری اعضا را انجام می‌دهند تا کنترل نهایی همیشه دست مالک باشد.",
    imgUrl: "role-based-access.png"
  },
  {
    icon: ChartPie,
    title: "دید مدیریتی در یک نگاه",
    description:
      "ظرفیت، درصد اشغال، اعضای فعال و برآورد درآمد ماهانه را سریع بررسی کنید و تصمیم‌های روزانه را بر اساس داده بگیرید، نه حدس و حافظه.",
    imgUrl: "Managerial-Insights.png"
  },
  {
    icon: FolderSync,
    title: "پیگیری تمدیدها بدون فراموشی",
    description:
      "اشتراک‌های رو به پایان و منقضی همیشه مشخص‌اند تا قبل از خالی شدن صندلی یا ایجاد بدهی، با عضو تماس بگیرید و جریان درآمدی سالن را منظم نگه دارید.",
    imgUrl: "tracking-renewals.png"
  },
  {
    icon: Zap,
    title: "راه‌اندازی سبک و سریع",
    description:
      "برای شروع کافی است مشخصات سالن و تعداد صندلی‌ها را وارد کنید؛ Studivo صندلی‌ها را می‌سازد و تیم شما همان روز می‌تواند کار را منظم‌تر ادامه دهد.",
    imgUrl: "quick-lightweight-setup.png"
  },
]

const Features = () => {
  return (
    <div
      id="features"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-14 font-semibold tracking-tight sm:max-w-xl sm:text-center sm:mx-auto">
        هر چیزی که برای آرامش خیال در مدیریت سالن نیاز دارید
      </h2>
      <div className="mt-8 xs:mt-14 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="flex flex-col border rounded-xl overflow-hidden shadow-none"
          >
            <CardHeader>
              <feature.icon />
              <h4 className="mt-3! text-xl font-semibold tracking-tight">
                {feature.title}
              </h4>
              <p className="mt-1 text-muted-foreground text-sm xs:text-[17px]">
                {feature.description}
              </p>
            </CardHeader>
            <CardContent className="mt-auto px-0 pb-0">
              <div className="bg-muted h-52 ml-6 rounded-tl-xl">
                <Image 
                  width={600} 
                  height={600} 
                  src={`/${feature.imgUrl}`} 
                  alt={feature.title} 
                  className="aspect-video object-cover"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;