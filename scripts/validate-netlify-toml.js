// Script to validate netlify.toml syntax
const fs = require('fs');
const toml = require('toml');

function validateNetlifyToml() {
  try {
    const content = fs.readFileSync('netlify.toml', 'utf8');
    const parsed = toml.parse(content);
    
    console.log('✅ netlify.toml validation successful!');
    console.log('📋 File structure:');
    console.log('  - build section:', !!parsed.build);
    console.log('  - functions section:', !!parsed.functions);
    console.log('  - redirects section:', !!parsed.redirects);
    console.log('  - template section:', !!parsed.template);
    
    if (parsed.build) {
      console.log('  Build settings:');
      console.log('    command:', parsed.build.command);
      console.log('    publish:', parsed.build.publish);
      console.log('    environment.NODE_VERSION:', parsed.build.environment?.NODE_VERSION);
    }
    
    if (parsed.functions) {
      console.log('  Functions settings:');
      console.log('    directory:', parsed.functions.directory);
      console.log('    node_bundler:', parsed.functions.node_bundler);
    }
    
    return true;
  } catch (error) {
    console.error('❌ netlify.toml validation failed:');
    console.error('   Error:', error.message);
    return false;
  }
}

// Run validation if called directly
if (require.main === module) {
  const isValid = validateNetlifyToml();
  process.exit(isValid ? 0 : 1);
}

module.exports = validateNetlifyToml;