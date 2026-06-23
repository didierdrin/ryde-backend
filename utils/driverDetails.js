function yearsBetween(fromDate, toDate = new Date()) {
  if (!fromDate) return null;
  const start = new Date(fromDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(toDate);
  let years = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

function formatDriverForPassenger(row) {
  const age = yearsBetween(row.date_of_birth);
  const yearsExperience = yearsBetween(row.license_issued_date);
  return {
    driverId: row.driver_id,
    name: row.name,
    email: row.email,
    phoneNumber: row.phone_number,
    address: row.address || 'Address not provided',
    distanceKm: row.distance != null ? Number(Number(row.distance).toFixed(2)) : null,
    ageYears: age,
    yearsExperience,
    licenseIssuedDate: row.license_issued_date,
    rating: row.rating != null ? Number(row.rating) : null,
    totalTrips: row.total_trips,
    isAvailable: row.is_available,
    verificationStatus: row.verification_status,
    vehicle: row.make ? {
      make: row.make,
      model: row.model,
      year: row.year,
      color: row.color,
      type: row.vehicle_type,
      registrationNumber: row.registration_number,
    } : null,
    currentLatitude: row.current_latitude != null ? Number(row.current_latitude) : null,
    currentLongitude: row.current_longitude != null ? Number(row.current_longitude) : null,
  };
}

module.exports = { yearsBetween, formatDriverForPassenger };
