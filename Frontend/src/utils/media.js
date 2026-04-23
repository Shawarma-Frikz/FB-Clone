export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

export const formatRelativeTime = (value) => {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const units = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"]
  ];

  let count = seconds;
  let unit = "second";

  for (const [limit, label] of units) {
    if (count < limit) {
      unit = label;
      break;
    }

    count = Math.floor(count / limit);
  }

  return `${Math.max(1, count)} ${unit}${Math.max(1, count) > 1 ? "s" : ""} ago`;
};