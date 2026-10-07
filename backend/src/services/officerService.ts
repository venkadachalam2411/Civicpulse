import User from '../models/User';
import crypto from 'crypto';

/**
 * Automatically generates the next unique Officer Employee ID in the format OFC001, OFC002, etc.
 */
export async function generateNextEmployeeId(): Promise<string> {
  const officers = await User.find({
    $or: [
      { employeeId: { $exists: true, $ne: '' } },
      { role: 'officer' }
    ]
  }).select('employeeId').lean();

  let maxSeq = 0;
  for (const officer of officers) {
    if (officer.employeeId) {
      const match = officer.employeeId.match(/^OFC(\d+)$/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidateId = `OFC${String(nextSeq).padStart(3, '0')}`;

  // Ensure candidate ID is strictly unique in DB
  while (await User.exists({ employeeId: candidateId })) {
    nextSeq++;
    candidateId = `OFC${String(nextSeq).padStart(3, '0')}`;
  }

  return candidateId;
}

/**
 * Generates an official CivicPulse email from the officer's full name.
 * Example: 'Arun Kumar' -> 'arun.kumar@civicpulse.com'
 * In case of duplicates, adds a sequential suffix: 'arun.kumar2@civicpulse.com'
 */
export async function generateOfficialEmail(name: string, domain = 'civicpulse.com'): Promise<string> {
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.');

  const baseUsername = sanitized || 'officer';
  let candidateEmail = `${baseUsername}@${domain}`;
  let counter = 2;

  while (await User.exists({ email: candidateEmail })) {
    candidateEmail = `${baseUsername}${counter}@${domain}`;
    counter++;
  }

  return candidateEmail;
}

/**
 * Generates a secure, readable temporary password for new officer onboarding.
 */
export function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  const length = 10;
  let result = 'Cp#';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length - 3; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}
