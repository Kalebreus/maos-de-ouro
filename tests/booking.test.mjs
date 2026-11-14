import test from 'node:test';
import assert from 'node:assert/strict';
import {
  todayInSaoPaulo,
  buildTimeSlots,
  normalizeBookingPhone,
  validBookingPhone,
} from '../src/booking.js';
import { normalizePhone, validPhone } from '../src/profile.js';

// Fixed instants make the rules independent of the execution machine's clock/zone.
const saturdayMorning = new Date('2026-11-14T12:15:00Z'); // 09:15 in Brasília.
const tuesday = '2026-11-17';
const slot = (slots, time) => slots.find((item) => item.time === time);
const minutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

test('the booking day follows São Paulo across UTC midnight and a year boundary', () => {
  assert.equal(todayInSaoPaulo(new Date('2026-11-15T02:59:59Z')), '2026-11-14');
  assert.equal(todayInSaoPaulo(new Date('2026-11-15T03:00:00Z')), '2026-11-15');
  assert.equal(todayInSaoPaulo(new Date('2027-01-01T01:00:00Z')), '2026-12-31');
});

test('past dates and dates that normalize into another calendar date cannot be booked', () => {
  for (const date of ['2026-11-13', '2026-11-31', '2027-02-29', '2026-13-01', '2026-00-17', '17/11/2026', '', 'not-a-date']) {
    assert.deepEqual(buildTimeSlots(date, 45, [], saturdayMorning), [], date);
  }
});

test('Sunday and Monday are closed, while Tuesday and Saturday have slots', () => {
  assert.deepEqual(buildTimeSlots('2026-11-15', 30, [], saturdayMorning), []);
  assert.deepEqual(buildTimeSlots('2026-11-16', 30, [], saturdayMorning), []);
  assert.ok(buildTimeSlots(tuesday, 30, [], saturdayMorning).length > 0);
  assert.ok(buildTimeSlots('2026-11-14', 30, [], saturdayMorning).length > 0);
});

test('a leap-day appointment is accepted when the day is valid and open', () => {
  const slots = buildTimeSlots('2028-02-29', 45, [], saturdayMorning);
  assert.equal(slots[0].time, '09:00');
  assert.ok(slots.every((item) => item.available));
});

test('today disables elapsed times using Brasília rather than the machine timezone', () => {
  const slots = buildTimeSlots('2026-11-14', 30, [], saturdayMorning);
  assert.equal(slot(slots, '09:00').available, false);
  assert.equal(slot(slots, '09:30').available, true);
  const onTheMinute = buildTimeSlots('2026-11-14', 30, [], new Date('2026-11-14T12:30:00Z'));
  assert.equal(slot(onTheMinute, '09:30').available, false);
  assert.equal(slot(onTheMinute, '10:00').available, true);
  // This UTC Sunday is still a São Paulo Saturday, after closing.
  const afterClosing = buildTimeSlots('2026-11-14', 30, [], new Date('2026-11-15T02:00:00Z'));
  assert.ok(afterClosing.length > 0);
  assert.ok(afterClosing.every((item) => !item.available));
});

test('each service must finish by 19:00, including longer combinations', () => {
  for (const [duration, lastStart] of [[30, '18:30'], [45, '18:00'], [60, '18:00'], [75, '17:30']]) {
    const slots = buildTimeSlots(tuesday, duration, [], saturdayMorning);
    assert.equal(slots[0].time, '09:00');
    assert.equal(slots.at(-1).time, lastStart);
    assert.ok(slots.every((item) => minutes(item.time) + duration <= 19 * 60));
    assert.ok(slots.every((item) => minutes(item.time) % 30 === 0));
  }
});

test('invalid or overlong durations produce no usable slots', () => {
  for (const duration of [0, -30, NaN, Infinity, '45', 601]) {
    assert.deepEqual(buildTimeSlots(tuesday, duration, [], saturdayMorning), []);
  }
});

test('a combo blocks overlapping haircuts and beard services but permits adjacent bookings', () => {
  const bookings = [{ id: 'synthetic-combo', serviceId: 'combo', date: tuesday, time: '10:00' }];
  const haircut = buildTimeSlots(tuesday, 45, bookings, saturdayMorning);
  assert.equal(slot(haircut, '09:00').available, true);
  assert.equal(slot(haircut, '09:30').available, false); // Ends after the combo starts.
  assert.equal(slot(haircut, '10:00').available, false);
  assert.equal(slot(haircut, '11:00').available, false); // Combo ends at 11:15.
  assert.equal(slot(haircut, '11:30').available, true);
  const beard = buildTimeSlots(tuesday, 30, bookings, saturdayMorning);
  assert.equal(slot(beard, '09:30').available, true); // Ends exactly at 10:00.
  assert.equal(slot(beard, '11:00').available, false);
  assert.equal(slot(beard, '11:30').available, true);
});

test('booking overlap is scoped to its date, and a service can begin at the previous end', () => {
  const bookings = [
    { id: 'synthetic-beard', serviceId: 'barba', date: tuesday, time: '10:00' },
    { id: 'synthetic-other-day', serviceId: 'combo', date: '2026-11-18', time: '11:00' },
  ];
  const slots = buildTimeSlots(tuesday, 75, bookings, saturdayMorning);
  assert.equal(slot(slots, '09:00').available, false);
  assert.equal(slot(slots, '10:00').available, false);
  assert.equal(slot(slots, '10:30').available, true);
  assert.equal(slot(slots, '11:00').available, true);
});

test('profile and booking normalize formatted Brazilian mobile and landline numbers consistently', () => {
  for (const [input, expected] of [
    ['+55 (11) 90000-0000', '11900000000'],
    ['(11) 90000-0000', '11900000000'],
    ['+55 (11) 2000-0000', '1120000000'],
    ['(55) 90000-0000', '55900000000'], // DDD 55 is not a country code here.
  ]) {
    assert.equal(normalizePhone(input), expected);
    assert.equal(normalizeBookingPhone(input), expected);
    assert.equal(validPhone(input), true);
    assert.equal(validBookingPhone(input), true);
  }
});

test('profile and booking reject invalid DDD, malformed subscriber length, and foreign numbers', () => {
  for (const input of ['', '123', '(01) 90000-0000', '(10) 90000-0000', '(11) 80000-0000', '+1 (202) 555-0100', '+55 (11) 900000-0000']) {
    assert.equal(validPhone(input), false, input);
    assert.equal(validBookingPhone(input), false, input);
  }
});
