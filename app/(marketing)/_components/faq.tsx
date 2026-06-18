import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";

const faq = [
  {
    question: "برای راه‌اندازی به دانش فنی نیاز دارم؟",
    answer:
      "خیر. کافیست ثبت‌نام کنید، تعداد صندلی‌ها و مبلغ شهریه را وارد کنید و بلافاصله شروع به مدیریت کنید. هیچ نصب یا تنظیمات پیچیده‌ای لازم نیست.",
  },
  {
    question: "هشدار تمدید شهریه چطور کار می‌کند؟",
    answer:
      "سیستم به‌صورت خودکار تاریخ پایان اشتراک هر دانش‌آموز را رصد می‌کند و میزهایی که تا سه روز آینده به تمدید نیاز دارند را با رنگ هشدار نمایش می‌دهد.",
  },
  {
    question: "آیا می‌توانم برای همکارانم دسترسی تعریف کنم؟",
    answer:
      "بله. در پلن حرفه‌ای می‌توانید برای مراقبان سالن حساب کاربری با نقش staff بسازید؛ آن‌ها به نقشه و پذیرش صندلی‌ها دسترسی دارند اما بخش مالی و تنظیمات مخصوص مدیر است.",
  },
  {
    question: "اطلاعات سالن من امن است؟",
    answer:
      "تمام داده‌های هر سالن کاملاً جدا از سالن‌های دیگر ذخیره و خوانده می‌شود و دسترسی فقط برای کاربران مجاز همان سالن امکان‌پذیر است.",
  },
  {
    question: "می‌توانم پلن رایگان را امتحان کنم؟",
    answer:
      "بله، پلن رایگان همیشه رایگان است و تا ۱۵ صندلی را پشتیبانی می‌کند. هر زمان نیاز به امکانات بیشتری داشتید می‌توانید به پلن حرفه‌ای ارتقا دهید.",
  },
];

const FAQ = () => {
  return (
    <div
      id="faq"
      className="w-full max-w-(--breakpoint-xl) mx-auto py-8 xs:py-16 px-6"
    >
      <h2 className="md:text-center text-3xl xs:text-4xl md:text-5xl leading-[1.15]! font-semibold tracking-tighter">
        سوالات پرتکرار
      </h2>
      <p className="mt-1.5 md:text-center xs:text-lg text-muted-foreground">
        پاسخ پرسش‌های رایج را اینجا جمع کرده‌ایم. اگر سوال دیگری دارید با تیم پشتیبانی در تماس باشید.
      </p>

      <div className="min-h-137.5 md:min-h-80 xl:min-h-75">
        <Accordion
          type="single"
          collapsible
          className="mt-8 space-y-4 md:columns-2 gap-4"
        >
          {faq.map(({ question, answer }, index) => (
            <AccordionItem
              key={question}
              value={`question-${index}`}
              className="bg-accent py-1 px-4 rounded-xl border-none mt-0! mb-4! break-inside-avoid"
            >
              <AccordionTrigger 
                className={cn(
                  "flex flex-1 items-center justify-between py-4 font-semibold tracking-tight transition-all hover:underline [&[data-state=open]>svg]:rotate-45",
                  "text-start text-lg"
                )}
              >
                {question}
                
              </AccordionTrigger>
              <AccordionContent className="text-[15px]">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;