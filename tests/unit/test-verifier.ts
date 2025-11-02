import { VerifierAgent } from '../../src/agents/VerifierAgent';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const agent = new VerifierAgent();
    await agent.init();
    console.log('✅ VerifierAgent initialized successfully');
    
    // Test completed, exit after short delay
    setTimeout(() => {
      console.log('✅ VerifierAgent test passed');
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error('❌ VerifierAgent test failed:', error);
    process.exit(1);
  }
}

test();
