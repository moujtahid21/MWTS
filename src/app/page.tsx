import { redirect } from "next/navigation";

/** Entry point. Dispatchers land on the cockpit. */
export default function RootPage() {
  redirect("/overview");
}
