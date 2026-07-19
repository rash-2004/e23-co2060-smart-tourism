export const formatUserId = (id, role) => {
  if (!id) return '';
  const paddedId = String(id).padStart(5, '0');
  if (role === 'guide' || role === 'travel_guide') return `G${paddedId}`;
  return `T${paddedId}`;
};
