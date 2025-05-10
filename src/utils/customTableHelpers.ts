const makeBorderColors = (color: string) => {
  return {
    full: `border-${color}-600`,
    r: `border-r-${color}-600`,
    l: `border-l-${color}-600`,
    t: `border-t-${color}-600`,
    b: `border-b-${color}-600`,
    x: `border-x-${color}-600`,
    y: `border-y-${color}-600`,
  };
};

const makeColor = (key: string, color: string) => {
  return {
    [key]: {
      theme: `bg-${color}-300 text-${color}-900 border-${color}-600`,
      border: makeBorderColors(color),
      bg: `bg-${color}-300`,
      text: `text-${color}-900`,
      color: `${color}-900`,
      bgColor: `${color}-300`,
      borderColor: `${color}-600`,
    },
    [`light-${key}`]: {
      theme: `bg-${color}-200 text-${color}-800 border-${color}-300`,
      border: makeBorderColors(color),
      bg: `bg-${color}-200`,
      text: `text-${color}-800`,
      color: `${color}-800`,
      bgColor: `${color}-200`,
      borderColor: `${color}-300`,
    },
    [`dark-${key}`]: {
      theme: `bg-${color}-600 text-white border-${color}-700`,
      border: makeBorderColors(color),
      bg: `bg-${color}-600`,
      text: `text-white`,
      color: `${color}-900`,
      bgColor: `${color}-600`,
      borderColor: `${color}-700`,
    },
    [`darker-${key}`]: {
      theme: `bg-${color}-800 text-white border-${color}-900`,
      border: makeBorderColors(color),
      bg: `bg-${color}-800`,
      text: `text-white`,
      color: `${color}-900`,
      bgColor: `${color}-800`,
      borderColor: `${color}-900`,
    },
  };
};

export const getCustomTableColor = (color: string) => {
  const defaultColors = [
    // "bg-blue-300 text-blue-900 border-blue-600",
    // "bg-green-300 text-green-900 border-green-600",
    // "bg-yellow-300 text-yellow-900 border-yellow-600",
    // "bg-red-300 text-red-900 border-red-600",
    // "bg-purple-300 text-purple-900 border-purple-600",
    // "bg-orange-300 text-orange-900 border-orange-600",
    // "bg-brown-300 text-brown-900 border-brown-600",
    // "bg-gray-300 text-gray-900 border-gray-600",
    // "bg-pink-300 text-pink-900 border-pink-600",
    // // colors used in the kanban view
    // "border-l-blue-600 border-r-blue-600 border-t-blue-600 border-b-blue-600 border-x-blue-600 border-y-blue-600",
    // "border-l-green-600 border-r-green-600 border-t-green-600 border-b-green-600 border-x-green-600 border-y-green-600",
    // "border-l-yellow-600 border-r-yellow-600 border-t-yellow-600 border-b-yellow-600 border-x-yellow-600 border-y-yellow-600",
    // "border-l-red-600 border-r-red-600 border-t-red-600 border-b-red-600 border-x-red-600 border-y-red-600",
    // "border-l-purple-600 border-r-purple-600 border-t-purple-600 border-b-purple-600 border-x-purple-600 border-y-purple-600",
    // "border-l-orange-600 border-r-orange-600 border-t-orange-600 border-b-orange-600 border-x-orange-600 border-y-orange-600",
    // "border-l-brown-600 border-r-brown-600 border-t-brown-600 border-b-brown-600 border-x-brown-600 border-y-brown-600",
    // "border-l-gray-600 border-r-gray-600 border-t-gray-600 border-b-gray-600 border-x-gray-600 border-y-gray-600",
    // "border-l-pink-600 border-r-pink-600 border-t-pink-600 border-b-pink-600 border-x-pink-600 border-y-pink-600",
  ];

  const defaultColor = {
    theme: defaultColors[0],
    border: makeBorderColors("blue"),
    bg: `bg-blue-300`,
    text: `text-blue-900`,
    color: `blue-900`,
    bgColor: `blue-300`,
    borderColor: `blue-600`,
  };

  // Map Airtable colors to Tailwind classes
  if (!color) return defaultColor;

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

  return colorMap[color] || defaultColor;
};
