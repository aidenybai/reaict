export const isCapitalized = (name?: string) => {
  if (!name || !name[0]) return false;
  return name[0] === name[0].toUpperCase();
};
