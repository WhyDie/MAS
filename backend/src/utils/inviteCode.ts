import { v4 as uuidv4 } from 'uuid';

export function generateInviteCode(): string {
  const roles = ['MENTOR', 'COMMANDER', 'RECRUIT', 'PSYCHOLOGIST'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${role}${year}${random}`;
}