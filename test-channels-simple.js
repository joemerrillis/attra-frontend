/**
 * Simple test to diagnose channel initialization
 */

import 'dotenv/config';

console.log('=== Environment Variables ===');
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]');
console.log('');

console.log('=== Attempting to import @attra/channels ===');
try {
  const channels = await import('@attra/channels');
  console.log('✓ Import successful');
  console.log('Available exports:', Object.keys(channels));
  console.log('');

  console.log('=== Attempting to initialize channels ===');
  await channels.initializeChannels();
  console.log('✓ Channels initialized');

  console.log('');
  console.log('=== Attempting to publish test message ===');
  await channels.publish(
    channels.Channel.META_AGENTS,
    channels.AgentId.FRONTEND,
    channels.MessageType.STATUS,
    'Frontend agent test message',
    {}
  );
  console.log('✓ Test message published');

  console.log('');
  console.log('🎉 SUCCESS! All channel operations working!');

  await channels.shutdownChannels();
  process.exit(0);
} catch (error) {
  console.error('✗ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
