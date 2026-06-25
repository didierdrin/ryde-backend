const { yearsBetween } = require('./driverDetails');

function formatUser(user) {
  if (!user) return null;
  return {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone_number,
    userType: user.user_type,
    profilePictureUrl: user.profile_picture_url || null,
    registrationDate: user.registration_date,
    isActive: user.is_active,
    lastLogin: user.last_login,
    createdAt: user.created_at,
  };
}

function formatDriverProfile(row, vehicle) {
  const ageYears = yearsBetween(row.date_of_birth);
  const yearsFromLicense = yearsBetween(row.license_issued_date);
  return {
    driverId: row.driver_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phoneNumber: row.phone_number,
    profilePictureUrl: row.profile_picture_url || null,
    licenseNumber: row.license_number,
    address: row.address,
    dateOfBirth: row.date_of_birth,
    ageYears,
    licenseIssuedDate: row.license_issued_date,
    yearsExperience: row.years_experience != null ? row.years_experience : yearsFromLicense,
    licenseDocumentUrl: row.license_document_url || null,
    bio: row.bio || null,
    isAvailable: row.is_available,
    verificationStatus: row.verification_status,
    rating: row.rating != null ? Number(row.rating) : null,
    totalTrips: row.total_trips,
    vehicle: vehicle
      ? {
          vehicleId: vehicle.vehicle_id,
          registrationNumber: vehicle.registration_number,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          vehicleType: vehicle.vehicle_type,
          imageUrl: vehicle.image_url || null,
        }
      : null,
  };
}

function formatPassengerProfile(row) {
  return {
    passengerId: row.passenger_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phoneNumber: row.phone_number,
    profilePictureUrl: row.profile_picture_url || null,
    paymentMethod: row.payment_method,
    dateOfBirth: row.date_of_birth,
    ageYears: yearsBetween(row.date_of_birth),
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    rating: row.rating != null ? Number(row.rating) : null,
    totalTrips: row.total_trips,
  };
}

module.exports = { formatUser, formatDriverProfile, formatPassengerProfile };
