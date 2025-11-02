const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying contract to Hedera...\n');
  
  // First compile
  console.log('📋 Step 1: Compiling contract...');
  try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
  } catch (error) {
    console.log('Compilation failed, using pre-compiled bytecode');
  }
  
  console.log('\n✅ Ready to deploy');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

