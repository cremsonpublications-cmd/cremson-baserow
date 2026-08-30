import StudyMaterialClient from "./StudyMaterialClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function Page() {
  return <StudyMaterialClient />;
}
