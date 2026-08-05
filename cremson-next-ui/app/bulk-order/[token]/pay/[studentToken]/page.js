export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ token: 'placeholder', studentToken: 'placeholder' }];
}

import StudentPayClient from "./StudentPayClient";

export default function Page() {
  return <StudentPayClient />;
}
