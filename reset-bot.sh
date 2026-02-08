#!/bin/bash
cd ~/whatsapp-bot

echo "🛑 Stopping bot..."
docker compose -f docker-compose.prod.yml down

echo "🗑️  Clearing auth session..."
rm -rf auth_info_baileys
mkdir auth_info_baileys

echo "🚀 Starting bot..."
docker compose -f docker-compose.prod.yml up -d

echo "📷 Waiting for QR code..."
sleep 3
docker compose -f docker-compose.prod.yml logs -f
