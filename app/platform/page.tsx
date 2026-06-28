import { requirePlatformUser } from "@/app/actions/auth";

export default async function PlatformPage() {
  const user = await requirePlatformUser();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        پلتفرم فروش Studivo
      </h1>
      <p className="text-sm text-muted-foreground">
        داشبورد عملیات فروش در حال توسعه است.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        خوش آمدید، {user.name}.
      </p>
    </div>
  );
}
