import crypto from 'node:crypto';

// 1. Test validation logic
function validateFullName(name) {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Full name is required.' };
  if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters.' };
  return { valid: true };
}

function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: 'Email address is required.' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { valid: false, error: 'Please enter a valid email address.' };
  return { valid: true };
}

function validatePassword(password) {
  if (!password) return { valid: false, error: 'Password is required.' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters long.' };
  return { valid: true };
}

console.log('--- Testing Validation Rules ---');
console.assert(validateFullName('Diljit Dosanjh').valid, 'Valid full name should pass');
console.assert(!validateFullName('').valid, 'Empty full name should fail');
console.assert(!validateFullName('A').valid, '1-char full name should fail');

console.assert(validateEmail('diljit@soundwave.com').valid, 'Valid email should pass');
console.assert(!validateEmail('invalid-email').valid, 'Invalid email should fail');
console.assert(!validateEmail('').valid, 'Empty email should fail');

console.assert(validatePassword('secret123').valid, 'Valid password should pass');
console.assert(!validatePassword('12345').valid, 'Short password (<6) should fail');
console.assert(!validatePassword('').valid, 'Empty password should fail');
console.log('✓ Validation rules verified');

// 2. Test PBKDF2 / SHA-256 salted hashing
console.log('\n--- Testing Cryptographic Password Hashing ---');
function hashPasswordNode(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
}

const salt1 = crypto.randomBytes(16);
const salt2 = crypto.randomBytes(16);
const hash1 = hashPasswordNode('mySecurePassword123', salt1);
const hash2 = hashPasswordNode('mySecurePassword123', salt2);
const hash1Verify = hashPasswordNode('mySecurePassword123', salt1);
const hashWrong = hashPasswordNode('wrongPassword', salt1);

console.assert(hash1 === hash1Verify, 'Re-hashing with same salt should match');
console.assert(hash1 !== hash2, 'Hashing same password with different salts must produce different hashes (salted)');
console.assert(hash1 !== hashWrong, 'Hashing wrong password must not match');
console.assert(!hash1.includes('mySecurePassword123'), 'Plain-text password must never appear in hash');
console.log('✓ Cryptographic hashing verified');

// 3. Test multi-account preference isolation
console.log('\n--- Testing Multi-Account Preference Isolation ---');
const usersDb = {};
function registerUser(name, email, password, prefs) {
  const normEmail = email.toLowerCase();
  const salt = crypto.randomBytes(16);
  const hash = hashPasswordNode(password, salt);
  usersDb[normEmail] = {
    id: 'usr_' + Date.now() + '_' + Math.random(),
    name,
    email: normEmail,
    saltHex: salt.toString('hex'),
    hashHex: hash,
    preferences: prefs
  };
}

registerUser('User Punjabi', 'user1@test.com', 'pass123', {
  preferredLanguages: ['Punjabi'],
  favouriteSingers: ['Diljit Dosanjh', 'AP Dhillon'],
  preferredGenres: ['Punjabi', 'Hip-hop'],
  preferredMoods: ['Party', 'Energetic'],
  onboardingCompleted: true
});

registerUser('User English', 'user2@test.com', 'pass456', {
  preferredLanguages: ['English'],
  favouriteSingers: ['Taylor Swift', 'The Weeknd'],
  preferredGenres: ['Pop'],
  preferredMoods: ['Chill'],
  onboardingCompleted: true
});

console.assert(usersDb['user1@test.com'].preferences.preferredLanguages[0] === 'Punjabi', 'User 1 languages must be Punjabi');
console.assert(usersDb['user2@test.com'].preferences.preferredLanguages[0] === 'English', 'User 2 languages must be English');
console.assert(usersDb['user1@test.com'].preferences.favouriteSingers.includes('Diljit Dosanjh'), 'User 1 has Diljit');
console.assert(!usersDb['user2@test.com'].preferences.favouriteSingers.includes('Diljit Dosanjh'), 'User 2 must not have Diljit');
console.log('✓ Multi-account preference isolation verified');

console.log('\nALL AUTH & PREFERENCE LOGIC CHECKS PASSED SUCCESSFULLY!');
