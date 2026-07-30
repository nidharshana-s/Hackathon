// ================================
// Fuel consumption (Litres / Engine Hour)
// ================================

export const fuelRate = {
  Excavator: 12,
  Bulldozer: 15,
  Crane: 10,
  Grader: 11,
  Loader: 13
};

const rentalDaysFor = (r) => Number(r?.rentalDays ?? r?.days ?? 0);
const checkInFor = (r) => r?.checkin ?? r?.checkIn;
const checkOutFor = (r) => r?.checkout ?? r?.checkOut;

export function isActiveRental(r, now = new Date()) {
  const checkIn = new Date(checkInFor(r));
  const checkoutValue = checkOutFor(r);
  const checkOut = checkoutValue ? new Date(checkoutValue) : null;

  if (Number.isNaN(checkIn.getTime()) || (checkOut && Number.isNaN(checkOut.getTime()))) {
    return false;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);

  if (!checkOut) {
    return today >= checkIn;
  }

  checkOut.setHours(23, 59, 59, 999);
  return today >= checkIn && today <= checkOut;
}

// ================================
// 1. Efficiency
// ================================

export function efficiency(r) {
  const total = r.engine + r.idle;
  return total === 0 ? 0 : ((r.engine / total) * 100).toFixed(2);
}

// ================================
// 2. Runtime Hours
// ================================

export function runtimeHours(r) {
  return (r.engine * rentalDaysFor(r)).toFixed(2);
}

// ================================
// 3. Fuel Used Per Day
// ================================

export function fuelPerDay(r) {
  const rate = fuelRate[r.type] || 10;
  return (rate * r.engine).toFixed(2);
}

// Total fuel during rental

export function totalFuel(r) {
  return (fuelPerDay(r) * rentalDaysFor(r)).toFixed(2);
}

// ================================
// 4. Location Check
// ================================

const operatorEmails = {
  OP101: "lewis44hamiltonp1@gmail.com",
  OP106: "22pc24@gmail.com",
  OP114: "lewis44hamiltonp1@gmail.com",
  OP203: "22pc24@gmail.com",
  OP301: "lewis44hamiltonp1@gmail.com"
};

export function locationAlert(r) {
  if (!r.site || r.site === "NULL") {
    return {
      sendMail: true,
      email: operatorEmails[r.operator] || "22pc24@gmail.com",
      subject: "Equipment Location Missing",
      message: `Equipment ${r.id} does not have a valid site location. Please update it immediately.`
    };
  }

  return { sendMail: false };
}

// ================================
// 5. Cost of Idle Time
// ================================

export function idleFuelLoss(r) {
  const rate = fuelRate[r.type] || 10;

  return (r.idle * rentalDaysFor(r) * rate).toFixed(2);
}

// ================================
// 6. Checkout Reminder
// ================================

export function reminderNeeded(r) {
  const rawCheckout = checkOutFor(r);
  if (!rawCheckout) return { sendMail: false };

  const today = new Date();
  const checkout = new Date(rawCheckout);
  if (Number.isNaN(checkout.getTime())) return { sendMail: false };

  const diff =
    Math.ceil((checkout - today) / (1000 * 60 * 60 * 24));

  if (diff === 3) {
    return {
      sendMail: true,
      email: operatorEmails[r.operator],
      subject: "Rental Ending Soon",
      message: `Equipment ${r.id} must be returned in 3 days.`
    };
  }

  return { sendMail: false };
}

// ================================
// 7. Fine Calculation
// ================================

export function fine(r) {
  const rawCheckout = checkOutFor(r);
  if (!rawCheckout) return 0;

  const checkin = new Date(checkInFor(r));
  const checkout = new Date(rawCheckout);
  if (Number.isNaN(checkin.getTime()) || Number.isNaN(checkout.getTime())) return 0;

  const days =
    Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

  if (days <= rentalDaysFor(r))
    return 0;

  const extra = days - rentalDaysFor(r);
  const finePerDay = 2500;

  return extra * finePerDay;
}

// ================================
// 8. Idle Percentage
// ================================

export function idlePercentage(r) {

  const total = r.engine + r.idle;

  return total === 0
    ? 0
    : ((r.idle / total) * 100).toFixed(2);
}

// ================================
// 9. Fleet Efficiency
// ================================

export function fleetEfficiency(data) {

  const engine = data.reduce(
    (sum, r) => sum + Number(r.engine),
    0
  );

  const total = data.reduce(
    (sum, r) => sum + Number(r.engine) + Number(r.idle),
    0
  );

  return total === 0
    ? 0
    : ((engine / total) * 100).toFixed(2);
}

// ================================
// 10. Assignment Check
// ================================

export function isUnassigned(r) {
  const operator = String(r?.operator ?? "")
    .trim()
    .toUpperCase();

  return (
    operator === "" ||
    operator === "NULL" ||
    operator === "UNASSIGNED" ||
    operator === "N/A"
  );
}

export function utilization(r) {
  const engine = Number(r?.engine ?? 0);
  const idle = Number(r?.idle ?? 0);
  const total = engine + idle;

  if (total <= 0) return 0;
  return (engine / total) * 100;
}

export function statusFor(input) {
  const u = typeof input === "number"
    ? input
    : utilization(input);

  if (u >= 70) {
    return { label: "Healthy", cls: "badge-ok" };
  }
  if (u >= 30) {
    return { label: "Watch", cls: "badge-warn" };
  }
  return { label: "Critical", cls: "badge-bad" };
}

// Bundle every computed value into one display-ready object.
export function calculatedStats(record, allRecords = []) {
  const utilValue = utilization(record);
  const status = statusFor(utilValue);
  const location = locationAlert(record);
  const reminder = reminderNeeded(record);

  return {
    utilization: `${utilValue.toFixed(2)}%`,
    efficiency: `${Number(efficiency(record)).toFixed(2)}%`,
    runtimeHours: Number(runtimeHours(record)),
    fuelPerDay: Number(fuelPerDay(record)),
    totalFuel: Number(totalFuel(record)),
    idleFuelLoss: Number(idleFuelLoss(record)),
    idlePercentage: `${Number(idlePercentage(record)).toFixed(2)}%`,
    fine: fine(record),
    statusLabel: status.label,
    statusClass: status.cls,
    isUnassigned: isUnassigned(record),
    locationAlert: location.sendMail ? location.message : "OK",
    reminderNeeded: reminder.sendMail,
    fleetEfficiency: allRecords.length
      ? `${Number(fleetEfficiency(allRecords)).toFixed(2)}%`
      : "0.00%"
  };
}
