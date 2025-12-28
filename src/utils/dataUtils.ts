export const pick = (data: { [key: string]: any }, pick: string[]) => {
  return Object.fromEntries(
    pick
      .map((key) => [key, data[key]])
      .filter(([_, value]) => value !== undefined)
  );
};
