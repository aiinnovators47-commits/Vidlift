// Test file to verify imports work correctly
import { sendIntervalMotivationalEmail } from './challengeEmailService';

console.log('✅ Import successful!');
console.log('Function available:', typeof sendIntervalMotivationalEmail);

// Test if function is callable
if (typeof sendIntervalMotivationalEmail === 'function') {
  console.log('✅ Function is properly exported and callable');
} else {
  console.log('❌ Function is not callable');
}