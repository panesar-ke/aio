import type { Route } from "next";

import { useRouter } from "next/navigation";

export default function useRedirect() {
  const router = useRouter();

  return (path: Route) => {
    router.push(path);
  };
}
