require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2022',
    rootDir: './',
  },
});
require('tsconfig-paths').register();

const { GET } = require('./src/app/api/entry/[id]/route');

async function test() {
  console.log('Running direct route GET test...');
  const req = new Request('http://localhost/api/entry/movie-136400');
  const params = Promise.resolve({ id: 'movie-136400' });
  const response = await GET(req, { params });
  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  const text = await response.text();
  console.log('Body length:', text.length);
  console.log('Body:', text);
}

test().catch(console.error);
