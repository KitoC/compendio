const makeColor = (key: string, color: string) => {
  return {
    [key]: `bg-${color}-400 text-${color}-900`,
    [`light-${key}`]: `bg-${color}-200 text-${color}-800`,
    [`dark-${key}`]: `bg-${color}-600 text-white`,
    [`darker-${key}`]: `bg-${color}-800 text-white`,
  };
};

export const getCustomTableColor = (color: string) => {
  const defaultColors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-purple-100 text-purple-800",
  ];

  // Map Airtable colors to Tailwind classes
  if (!color) return defaultColors[0];
  const colorMap = {
    ...makeColor("blue", "blue"),
    ...makeColor("green", "green"),
    ...makeColor("yellow", "yellow"),
    ...makeColor("red", "red"),
    ...makeColor("purple", "purple"),
    ...makeColor("cyan", "cyan"),
    ...makeColor("orange", "orange"),
    ...makeColor("brown", "amber"),
    ...makeColor("gray", "gray"),
    ...makeColor("pink", "pink"),
    ...makeColor("brown", "amber"),
  };

  return colorMap[color] || defaultColors[0];
};
