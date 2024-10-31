export const calculateTokenExpirationDate = () => {
  const now = new Date();
  const twoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
  const futureDate = new Date(now.getTime() + twoWeeksInMilliseconds);
  return futureDate;
};
