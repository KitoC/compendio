import "https://deno.land/x/xhr@0.1.0/mod.ts";

const getEnvKey = (key: string) => {
  return Deno.env.get(`LOCAL_${key}`)! || Deno.env.get(key)!;
};

export { getEnvKey };
