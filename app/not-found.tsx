import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-muted mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-3">
          ما که نفهمیدیم دنبال چی هستی!
        </h2>
        <p className="text-zinc-600 mb-8 max-w-md mx-auto">
          امیدوارم خودت بدونی، یا یه روزی بفهمی...
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button asChild variant={'outline'}>
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              صفحه اصلی 
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}