import { NextResponse } from "next/server";
import { getActiveVacancies } from "@/lib/vacancies";
import { salaryMain } from "@/lib/format";
import { localize } from "@/lib/vacancy-i18n";
import type { QuizVacancy } from "@/lib/quiz-engine";

// Static JSON for the quiz (matches + counts). Rebuilt when an admin edit revalidates the `vacancies` tag.
export const dynamic = "force-static";

export async function GET() {
  const list: QuizVacancy[] = (await getActiveVacancies()).map((v) => {
    const r = localize(v, "ru");
    return {
      id: v.id,
      path: v.path,
      country: v.country,
      title: v.title,
      city: v.city,
      category: v.category,
      genders: v.genders,
      pay: salaryMain(v.salary),
      photo: v.photos[0] ?? "",
      hot: v.hot,
      order: v.order,
      ru: {
        title: r.title,
        path: r.path,
        city: r.city,
        pay: salaryMain(v.salary, "ru"),
      },
    };
  });
  return NextResponse.json(list, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
