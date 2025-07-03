claude mcp add puppet -- npx  /home/peter/nova-mcp/puppeteer/dist/index.js
claude mcp add nova-memory -- uvx basic-memory --project nova mcp
claude mcp add github -- npx /home/peter/nova-mcp/github/dist/index.js
claude mcp add brave_search -- npx /home/peter/nova-mcp/brave-search/dist/index.js
claude mcp add postgres -- npx /home/peter/nova-mcp/postgresql-mcp-server/build/index.js --connection-string postgresql://postgres.rdobtpugtnmefxplgwyp:0rbZUh8y0Fsvdlry@aws-0-us-east-1.pooler.supabase.com:5432/postgres
claude mcp add gemini -- node /home/peter/nova-mcp/gemini/dist/index.js
claude mcp add chatgpt -- /home/peter/nova-mcp/chatgpt-puppeteer/run-with-env.sh
claude mcp add nova-browser -- node /home/peter/nova-mcp/nova-browser/dist/index.js
claude mcp add nova-scraper -- node /home/peter/nova-mcp/nova-scraper/dist/index.js