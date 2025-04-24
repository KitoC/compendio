export const buildPathWithParams = (
  path: string,
  params: Record<string, string>
) => {
  let pathWithParams = path;

  Object.entries(params).forEach(([key, value]) => {
    pathWithParams = pathWithParams.replace(`:${key}`, value);
  });

  return pathWithParams;
};
