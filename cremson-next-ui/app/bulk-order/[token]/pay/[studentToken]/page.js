export async function generateStaticParams() {
  return [{ token: 'default', studentToken: 'default' }];
}

import StudentPayClient from "./StudentPayClient";

export default function Page() {
  return <StudentPayClient />;
}
