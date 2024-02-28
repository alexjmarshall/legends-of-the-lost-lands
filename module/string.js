export const insertSpaceBeforeCapitalUnlessSlash = (string) => {
  return string.replace(/(?<!\/)([A-Z])/g, ' $1').trim();
};

export const insertSpaceBeforeCapitals = (string) => {
  return string.replace(/([A-Z])/g, ' $1').trim();
};
