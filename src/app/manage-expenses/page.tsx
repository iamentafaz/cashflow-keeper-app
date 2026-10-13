import { redirect } from "next/navigation";

export default function LegacyManageExpensesRedirect() {
  redirect("/finance");
}
