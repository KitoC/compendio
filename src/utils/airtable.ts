export const getAirtableColor = (color: string) => {
  const defaultColors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-purple-100 text-purple-800",
  ];

  // Map Airtable colors to Tailwind classes
  if (!color) return defaultColors[0];

  // This is a simple mapping, you might want to expand it
  switch (color) {
    // Blue shades
    case "blue":
      return "bg-blue-100 text-blue-800";
    case "blueLight1":
      return "bg-blue-50 text-blue-700";
    case "blueLight2":
      return "bg-blue-100 text-blue-800";
    case "blueMedium":
      return "bg-blue-200 text-blue-900";
    case "blueBright":
      return "bg-blue-500 text-white";
    case "blueDark":
      return "bg-blue-600 text-white";
    case "blueDark1":
      return "bg-blue-700 text-white";
    case "blueDarker":
      return "bg-blue-800 text-white";

    // Cyan shades
    case "cyan":
      return "bg-cyan-100 text-cyan-800";
    case "cyanLight1":
      return "bg-cyan-50 text-cyan-700";
    case "cyanLight2":
      return "bg-cyan-100 text-cyan-800";
    case "cyanMedium":
      return "bg-cyan-200 text-cyan-900";
    case "cyanBright":
      return "bg-cyan-400 text-cyan-900";
    case "cyanDark":
      return "bg-cyan-500 text-white";
    case "cyanDark1":
      return "bg-cyan-600 text-white";
    case "cyanDarker":
      return "bg-cyan-700 text-white";

    // Teal shades
    case "teal":
      return "bg-teal-100 text-teal-800";
    case "tealLight1":
      return "bg-teal-50 text-teal-700";
    case "tealLight2":
      return "bg-teal-100 text-teal-800";
    case "tealMedium":
      return "bg-teal-200 text-teal-900";
    case "tealBright":
      return "bg-teal-400 text-teal-900";
    case "tealDark":
      return "bg-teal-500 text-white";
    case "tealDark1":
      return "bg-teal-600 text-white";
    case "tealDarker":
      return "bg-teal-700 text-white";

    // Green shades
    case "green":
      return "bg-green-100 text-green-800";
    case "greenLight1":
      return "bg-green-50 text-green-700";
    case "greenLight2":
      return "bg-green-100 text-green-800";
    case "greenMedium":
      return "bg-green-200 text-green-900";
    case "greenBright":
      return "bg-green-500 text-white";
    case "greenDark":
      return "bg-green-600 text-white";
    case "greenDark1":
      return "bg-green-700 text-white";
    case "greenDarker":
      return "bg-green-800 text-white";

    // Yellow shades
    case "yellow":
      return "bg-yellow-100 text-yellow-800";
    case "yellowLight1":
      return "bg-yellow-50 text-yellow-700";
    case "yellowLight2":
      return "bg-yellow-100 text-yellow-800";
    case "yellowMedium":
      return "bg-yellow-200 text-yellow-900";
    case "yellowBright":
      return "bg-yellow-400 text-yellow-900";
    case "yellowDark":
      return "bg-yellow-500 text-yellow-950";
    case "yellowDark1":
      return "bg-yellow-600 text-white";
    case "yellowDarker":
      return "bg-yellow-700 text-white";

    // Orange shades
    case "orange":
      return "bg-orange-100 text-orange-800";
    case "orangeLight1":
      return "bg-orange-50 text-orange-700";
    case "orangeLight2":
      return "bg-orange-100 text-orange-800";
    case "orangeMedium":
      return "bg-orange-200 text-orange-900";
    case "orangeBright":
      return "bg-orange-500 text-white";
    case "orangeDark":
      return "bg-orange-600 text-white";
    case "orangeDark1":
      return "bg-orange-700 text-white";
    case "orangeDarker":
      return "bg-orange-800 text-white";

    // Red shades
    case "red":
      return "bg-red-100 text-red-800";
    case "redLight1":
      return "bg-red-50 text-red-700";
    case "redLight2":
      return "bg-red-100 text-red-800";
    case "redMedium":
      return "bg-red-200 text-red-900";
    case "redBright":
      return "bg-red-500 text-white";
    case "redDark":
      return "bg-red-600 text-white";
    case "redDark1":
      return "bg-red-700 text-white";
    case "redDarker":
      return "bg-red-800 text-white";

    // Pink shades
    case "pink":
      return "bg-pink-100 text-pink-800";
    case "pinkLight1":
      return "bg-pink-50 text-pink-700";
    case "pinkLight2":
      return "bg-pink-100 text-pink-800";
    case "pinkMedium":
      return "bg-pink-200 text-pink-900";
    case "pinkBright":
      return "bg-pink-500 text-white";
    case "pinkDark":
      return "bg-pink-600 text-white";
    case "pinkDark1":
      return "bg-pink-700 text-white";
    case "pinkDarker":
      return "bg-pink-800 text-white";

    // Purple shades
    case "purple":
      return "bg-purple-100 text-purple-800";
    case "purpleLight1":
      return "bg-purple-50 text-purple-700";
    case "purpleLight2":
      return "bg-purple-100 text-purple-800";
    case "purpleMedium":
      return "bg-purple-200 text-purple-900";
    case "purpleBright":
      return "bg-purple-500 text-white";
    case "purpleDark":
      return "bg-purple-600 text-white";
    case "purpleDark1":
      return "bg-purple-700 text-white";
    case "purpleDarker":
      return "bg-purple-800 text-white";

    // Gray shades
    case "gray":
    case "grey":
      return "bg-gray-100 text-gray-800";
    case "grayLight1":
    case "greyLight1":
      return "bg-gray-50 text-gray-700";
    case "grayLight2":
    case "greyLight2":
      return "bg-gray-100 text-gray-800";
    case "grayMedium":
    case "greyMedium":
      return "bg-gray-200 text-gray-900";
    case "grayBright":
    case "greyBright":
      return "bg-gray-400 text-white";
    case "grayDark":
    case "greyDark":
      return "bg-gray-500 text-white";
    case "grayDark1":
    case "greyDark1":
      return "bg-gray-600 text-white";
    case "grayDarker":
    case "greyDarker":
      return "bg-gray-700 text-white";

    case "black":
      return "bg-gray-900 text-white";
    case "white":
      return "bg-white text-gray-800 border border-gray-200";

    // Lime shades
    case "lime":
      return "bg-lime-100 text-lime-800";
    case "limeLight1":
      return "bg-lime-50 text-lime-700";
    case "limeLight2":
      return "bg-lime-100 text-lime-800";
    case "limeMedium":
      return "bg-lime-200 text-lime-900";
    case "limeBright":
      return "bg-lime-400 text-lime-900";
    case "limeDark":
      return "bg-lime-500 text-white";
    case "limeDark1":
      return "bg-lime-600 text-white";
    case "limeDarker":
      return "bg-lime-700 text-white";

    // Indigo shades
    case "indigo":
      return "bg-indigo-100 text-indigo-800";
    case "indigoLight1":
      return "bg-indigo-50 text-indigo-700";
    case "indigoLight2":
      return "bg-indigo-100 text-indigo-800";
    case "indigoMedium":
      return "bg-indigo-200 text-indigo-900";
    case "indigoBright":
      return "bg-indigo-500 text-white";
    case "indigoDark":
      return "bg-indigo-600 text-white";
    case "indigoDark1":
      return "bg-indigo-700 text-white";
    case "indigoDarker":
      return "bg-indigo-800 text-white";

    // Violet shades
    case "violet":
      return "bg-violet-100 text-violet-800";
    case "violetLight1":
      return "bg-violet-50 text-violet-700";
    case "violetLight2":
      return "bg-violet-100 text-violet-800";
    case "violetMedium":
      return "bg-violet-200 text-violet-900";
    case "violetBright":
      return "bg-violet-500 text-white";
    case "violetDark":
      return "bg-violet-600 text-white";
    case "violetDark1":
      return "bg-violet-700 text-white";
    case "violetDarker":
      return "bg-violet-800 text-white";

    // Amber shades
    case "amber":
      return "bg-amber-100 text-amber-800";
    case "amberLight1":
      return "bg-amber-50 text-amber-700";
    case "amberLight2":
      return "bg-amber-100 text-amber-800";
    case "amberMedium":
      return "bg-amber-200 text-amber-900";
    case "amberBright":
      return "bg-amber-400 text-amber-900";
    case "amberDark":
      return "bg-amber-500 text-amber-950";
    case "amberDark1":
      return "bg-amber-600 text-white";
    case "amberDarker":
      return "bg-amber-700 text-white";

    // Brown shades (using amber as base)
    case "brown":
      return "bg-amber-200 text-amber-900";
    case "brownLight1":
      return "bg-amber-100 text-amber-800";
    case "brownLight2":
      return "bg-amber-200 text-amber-900";
    case "brownMedium":
      return "bg-amber-300 text-amber-950";
    case "brownBright":
      return "bg-amber-500 text-white";
    case "brownDark":
      return "bg-amber-600 text-white";
    case "brownDark1":
      return "bg-amber-700 text-white";
    case "brownDarker":
      return "bg-amber-800 text-white";

    default:
      return defaultColors[0];
  }
};
