/** Normalize a trip row from PostgreSQL for API clients (camelCase + media URLs). */
function formatTrip(row) {
  if (!row) return null;
  return {
    tripId: row.trip_id,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    pickupLatitude: row.pickup_latitude,
    pickupLongitude: row.pickup_longitude,
    pickupAddress: row.pickup_address,
    destinationLatitude: row.destination_latitude,
    destinationLongitude: row.destination_longitude,
    destinationAddress: row.destination_address,
    distance: row.distance,
    fare: row.fare,
    status: row.status,
    serviceType: row.service_type,
    requestTime: row.request_time,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    passengerUserId: row.passenger_user_id,
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone,
    passengerProfilePictureUrl: row.passenger_profile_picture_url || null,
    driverUserId: row.driver_user_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    driverProfilePictureUrl: row.driver_profile_picture_url || null,
    vehicleImageUrl: row.vehicle_image_url || null,
    vehicleMake: row.make,
    vehicleModel: row.model,
    vehicleRegistrationNumber: row.registration_number,
    driverDistance: row.driver_distance != null ? Number(row.driver_distance) : undefined,
  };
}

function formatTrips(rows) {
  return (rows || []).map(formatTrip);
}

module.exports = { formatTrip, formatTrips };
