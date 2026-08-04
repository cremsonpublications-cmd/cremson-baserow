export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

import StudyMaterialClient from "./StudyMaterialClient";

export default function Page() {
  return <StudyMaterialClient />;
}
