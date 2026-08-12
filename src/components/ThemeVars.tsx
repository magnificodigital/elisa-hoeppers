import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { applyTheme, fetchTheme } from "@/lib/theme";

/** Aplica as cores configuradas no admin às variáveis CSS globais. */
export function ThemeVars() {
  const { data } = useQuery({
    queryKey: ["site-theme"],
    queryFn: fetchTheme,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) applyTheme(data);
  }, [data]);

  return null;
}

export default ThemeVars;
