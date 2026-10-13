import { redirect } from "next/navigation";

export default function LegacyExpensesRedirect() {
  redirect("/finance");
}
