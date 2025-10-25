#!/bin/bash
# Ensure web services are enabled before Apache starts
# This runs on every moodle container startup

echo "=== Ensuring Web Services are Enabled ==="

cd /var/www/html

# Check if Moodle is installed
if [ ! -f "config.php" ]; then
    echo "Moodle not yet installed, skipping web services check"
    exit 0
fi

# Force enable web services using CLI
echo "Enabling web services..."
php admin/cli/cfg.php --name=enablewebservices --set=1

# Force enable REST protocol
echo "Enabling REST protocol..."
php admin/cli/cfg.php --name=webserviceprotocols --set=rest

# Verify settings
WS_ENABLED=$(php admin/cli/cfg.php --name=enablewebservices | grep -c "1")
REST_ENABLED=$(php admin/cli/cfg.php --name=webserviceprotocols | grep -c "rest")

echo "Verification:"
echo "  - Web Services: $([ "$WS_ENABLED" -gt 0 ] && echo 'ENABLED' || echo 'DISABLED')"
echo "  - REST Protocol: $([ "$REST_ENABLED" -gt 0 ] && echo 'ENABLED' || echo 'DISABLED')"

if [ "$WS_ENABLED" -gt 0 ] && [ "$REST_ENABLED" -gt 0 ]; then
    echo "✓ Web services are properly enabled"
else
    echo "✗ WARNING: Web services may not be properly enabled!"
fi

echo "=== Web Services Check Complete ==="

