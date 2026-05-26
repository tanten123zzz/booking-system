#!/bin/bash
cd /home/u946594821/booking-system

# Fetch latest changes from Git
git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Check if port 49201 is listening
PORT_ACTIVE=$(ss -tuln | grep -q :49201 && echo "yes" || echo "no")

if [ "$LOCAL" != "$REMOTE" ] || [ "$PORT_ACTIVE" = "no" ]; then
    echo "$(date): New update detected or server is down. Restarting Node.js..." >> /home/u946594821/cron.log
    
    # Kill old process if it exists
    pkill -f "node dist/server.cjs"
    
    # Pull latest code
    git pull origin main
    
    # Start server
    nohup /home/u946594821/.nvm/versions/node/v20.20.2/bin/node dist/server.cjs > output.log 2>&1 &
else
    echo "$(date): Server is running fine. No updates." >> /home/u946594821/cron.log
fi
