import { AnalyzerAgent } from '../../src/agents/AnalyzerAgent';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const agent = new AnalyzerAgent();
    await agent.init();
    const result = await agent.queryAccount('0.0.123456');
    console.log('Result:', result);
    console.log('✅ AnalyzerAgent test passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ AnalyzerAgent test failed:', error);
    process.exit(1);
  }
}

test();
