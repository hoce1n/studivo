import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BookCheck,
  ChartPie,
  FolderSync,
  Goal,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Goal,
    title: "نقشه گرافیکی میزها",
    description:
      "وضعیت صندلی‌های سالن، کتابخانه یا پانسیون را در یک نگاه ببینید؛ جای خالی، رزرو فعال و نیازمند پیگیری همیشه مشخص است.",
  },
  {
    icon: BookCheck,
    title: "هشدار خودکار شهریه",
    description:
      "موعد تمدید شهریه اعضا و داوطلبان را قبل از سررسید ببینید و پیگیری مالی را منظم و بدون فراموشی انجام دهید.",
  },
  {
    icon: ChartPie,
    title: "مدیریت ساده اعضا",
    description:
      "اطلاعات تماس، کد ملی و تاریخچه ثبت‌نام دانش‌آموزان، اعضای کتابخانه و داوطلبان کنکور را یکپارچه نگه دارید.",
  },
  {
    icon: Users,
    title: "کنترل وضعیت پرداخت",
    description:
      "به‌سادگی مشخص کنید کدام عضو تسویه کرده، کدام قرارداد نزدیک تمدید است و کدام پرداخت نیازمند پیگیری است.",
  },
  {
    icon: FolderSync,
    title: "Automate Your Workflow",
    description:
      "Streamline your processes by automating repetitive tasks, saving time and reducing effort.",
  },
  {
    icon: Zap,
    title: "Accelerate Growth",
    description:
      "Supercharge your growth by implementing strategies that drive results quickly and efficiently.",
  },
];

const Features = () => {
  return (
    <div
      id="features"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-14 font-semibold tracking-tight sm:max-w-xl sm:text-center sm:mx-auto">
        استراتژی خود را با ویژگی‌های هوشمند تقویت کنید.
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
              <div className="bg-muted h-52 ml-6 rounded-tl-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;