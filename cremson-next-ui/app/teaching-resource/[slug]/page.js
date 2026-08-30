import TeachingResourceClient from "./TeachingResourceClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function Page() {
  return <TeachingResourceClient />;
}
